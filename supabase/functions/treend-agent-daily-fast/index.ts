import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

const PROFILES = ["importador", "exportador", "agente_turismo", "freelancer"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "CNY", "USDT"] as const;
const FREQUENCIES = ["hourly", "daily", "weekly", "biweekly", "monthly"] as const;

const TV_PAIRS: Record<string, string> = {
  USD: "USDBRL",
  EUR: "EURBRL",
  GBP: "GBPBRL",
  CNY: "CNYBRL",
};

const TV_CRYPTO_PAIRS: Record<string, string> = {
  USDT: "USDTBRL",
};

// Mapeamento frequência → coluna RSI no TradingView (timeframe)
// Última hora = 1min, 1x ao dia = 5min, 1x na semana = 15min, 2x ao mês = 30min, 1x ao mês = 1h
const FREQ_TO_TV_COLUMN: Record<string, string> = {
  hourly: "RSI|1",
  daily: "RSI|5",
  weekly: "RSI|15",
  biweekly: "RSI|30",
  monthly: "RSI|60",
};

// ── In-memory RSI cache (TTL 10s) ──
const rsiCache = new Map<string, { rsi: number; ts: number }>();
const RSI_CACHE_TTL = 10_000;

function getCachedRsi(key: string): number | null {
  const entry = rsiCache.get(key);
  if (entry && Date.now() - entry.ts < RSI_CACHE_TTL) return entry.rsi;
  return null;
}

function setCachedRsi(key: string, rsi: number) {
  rsiCache.set(key, { rsi, ts: Date.now() });
}

// ── Minimum delta to trigger a write ──
const MIN_HEAT_X_DELTA = 1.0;

// ── Fetch RSI(14) from TradingView (forex scanner) ──
async function fetchTvRsi(pair: string, rsiColumn: string = "RSI|5"): Promise<number> {
  const cacheKey = `forex:${pair}:${rsiColumn}`;
  const cached = getCachedRsi(cacheKey);
  if (cached !== null) return cached;

  const url = `https://scanner.tradingview.com/forex/scan`;
  const body = {
    symbols: { tickers: [`FX_IDC:${pair}`] },
    columns: [rsiColumn],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`TV API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const rsi = data?.data?.[0]?.d?.[0];
  if (typeof rsi !== "number" || isNaN(rsi)) throw new Error("RSI not found in TV response");
  setCachedRsi(cacheKey, rsi);
  return rsi;
}

// ── Fetch RSI from TradingView crypto scanner (24/7) ──
async function fetchTvRsiCrypto(pair: string, rsiColumn: string = "RSI|5"): Promise<number> {
  const cacheKey = `crypto:${pair}:${rsiColumn}`;
  const cached = getCachedRsi(cacheKey);
  if (cached !== null) return cached;

  const url = `https://scanner.tradingview.com/crypto/scan`;
  const body = {
    symbols: { tickers: [`BINANCE:${pair}`] },
    columns: [rsiColumn],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`TV Crypto API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const rsi = data?.data?.[0]?.d?.[0];
  if (typeof rsi !== "number" || isNaN(rsi)) throw new Error("RSI not found in TV crypto response");
  setCachedRsi(cacheKey, rsi);
  return rsi;
}

// ── heat_y based on RSI extremity ──
function calcHeatY(rsi: number): number {
  if (rsi <= 20 || rsi >= 80) return Math.round((10 + Math.random() * 10) * 10) / 10;
  if (rsi <= 35 || rsi >= 65) return Math.round((25 + Math.random() * 15) * 10) / 10;
  return Math.round((45 + Math.random() * 20) * 10) / 10;
}

// ── Color label ──
function colorLabel(heatX: number): string {
  if (heatX <= 35) return "vermelho";
  if (heatX <= 49) return "laranja";
  if (heatX <= 64) return "amarelo";
  return "verde";
}

const INVERTED_PROFILES = new Set(["importador", "agente_turismo"]);

// ── Mapeamento não-linear RSI → heat_x ──
// RSI ≥ 70 (sobrecompra) → score 90-100 (verde)
// RSI ≤ 30 (sobrevenda)  → score 0-10  (vermelho)
// RSI 30-70 (neutro)     → score 10-90 (proporcional)
function rsiToHeatX(rsi: number, inverted: boolean): number {
  const r = Math.max(0, Math.min(100, rsi));
  let score: number;
  if (r <= 30) {
    score = (r / 30) * 10;
  } else if (r >= 70) {
    score = 90 + ((r - 70) / 30) * 10;
  } else {
    score = 10 + ((r - 30) / 40) * 80;
  }
  return inverted ? Math.round((100 - score) * 10) / 10 : Math.round(score * 10) / 10;
}

// v4.0 — Optimized: delta-check writes, RSI cache, batch upsert
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startMs = Date.now();
  const logLines: string[] = [];
  const addLog = (msg: string) => {
    logLines.push(msg);
    console.log(msg);
  };

  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  addLog(`▶ daily-fast v5.0 (timeframes corrigidos) — ${brt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} BRT`);
  addLog("");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find admin user
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();
    if (!adminRole) throw new Error("No admin user found");
    const adminId = adminRole.user_id;

    // ── Fetch ALL current scores in a single query (minimal columns) ──
    const { data: currentScores } = await supabase
      .from("heatmap_scores")
      .select("profile_type, currency, frequency, heat_x");
    
    const scoreMap = new Map<string, number>();
    for (const s of currentScores ?? []) {
      scoreMap.set(`${s.profile_type}|${s.currency}|${s.frequency}`, s.heat_x);
    }

    let totalOk = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const publishedAt = new Date().toISOString();

    // Collect all upserts and history inserts for batch processing
    const upsertBatch: any[] = [];
    const historyBatch: any[] = [];

    for (const freq of FREQUENCIES) {
      const rsiColumn = FREQ_TO_TV_COLUMN[freq];
      const tfLabel = rsiColumn.replace("RSI|", "") + "min";
      addLog(`📊 ${freq} (RSI 14 @ ${tfLabel}):`);

      for (const cur of CURRENCIES) {
        let rsi: number;
        let source = "tradingview";
        const isCrypto = cur in TV_CRYPTO_PAIRS;
        const pair = isCrypto ? TV_CRYPTO_PAIRS[cur] : TV_PAIRS[cur];

        try {
          rsi = isCrypto
            ? await fetchTvRsiCrypto(pair, rsiColumn)
            : await fetchTvRsi(pair, rsiColumn);
          const zone = rsi <= 30 ? "sobrevendido" : rsi >= 70 ? "sobrecomprado" : "neutro";
          addLog(`  ${cur} RSI=${rsi.toFixed(2)} (${zone}) [${isCrypto ? "crypto" : "forex"}]`);
        } catch (e) {
          addLog(`  ⚠️ ${cur}: ${(e as Error).message} — fallback RSI=50`);
          rsi = 50;
          source = "fallback";
        }

        for (const profile of PROFILES) {
          const isInverted = INVERTED_PROFILES.has(profile);
          const heatX = Math.max(0, Math.min(100, Math.round(rsiToHeatX(rsi, isInverted) * 10) / 10));
          const heatY = calcHeatY(rsi);

          // ── Delta check: skip write if change < 1 point ──
          const key = `${profile}|${cur}|${freq}`;
          const currentHeatX = scoreMap.get(key);
          if (currentHeatX !== undefined && Math.abs(heatX - currentHeatX) < MIN_HEAT_X_DELTA) {
            addLog(`    ⏭️ ${profile}|${cur} Δ=${Math.abs(heatX - currentHeatX).toFixed(1)} < ${MIN_HEAT_X_DELTA} — skipped`);
            totalSkipped++;
            continue;
          }

          upsertBatch.push({
            admin_id: adminId,
            profile_type: profile,
            currency: cur,
            frequency: freq,
            heat_x: heatX,
            heat_y: heatY,
            volatility_pct: 0,
            momentum: 0,
            published_at: publishedAt,
          });

          historyBatch.push({
            admin_id: adminId,
            profile_type: profile,
            currency: cur,
            frequency: freq,
            heat_x: heatX,
            heat_y: heatY,
            volatility_pct: 0,
            momentum: 0,
            published_at: publishedAt,
          });

          const label = colorLabel(heatX);
          addLog(`    ✅ ${profile}|${cur} RSI=${rsi.toFixed(2)}[${source}] x=${heatX} (${label}) [Δ=${currentHeatX !== undefined ? Math.abs(heatX - currentHeatX).toFixed(1) : "new"}]`);
          totalOk++;
        }
      }

      addLog("");
    }

    // ── Always touch updated_at on ALL scores so UI shows fresh timestamp ──
    const { error: touchErr } = await supabase
      .from("heatmap_scores")
      .update({ updated_at: publishedAt } as any)
      .gte("id", "00000000-0000-0000-0000-000000000000");

    if (touchErr) {
      addLog(`  ⚠️ Touch updated_at error: ${touchErr.message}`);
    }

    // ── Batch upsert all changed scores at once ──
    if (upsertBatch.length > 0) {
      addLog(`💾 Batch upsert: ${upsertBatch.length} scores changed (${totalSkipped} skipped)`);
      const { error: upsertErr } = await supabase
        .from("heatmap_scores")
        .upsert(upsertBatch as any, { onConflict: "profile_type,currency,frequency" });

      if (upsertErr) {
        addLog(`  ❌ Batch upsert error: ${upsertErr.message}`);
        totalErrors += upsertBatch.length;
        totalOk = 0;
      }

      // Batch insert history
      const { error: histErr } = await supabase
        .from("heatmap_history")
        .insert(historyBatch as any);

      if (histErr) {
        addLog(`  ⚠️ History batch error: ${histErr.message}`);
      }
    } else {
      addLog(`⏭️ No score values changed — only updated_at refreshed`);
    }

    const elapsedS = Math.round((Date.now() - startMs) / 100) / 10;
    const summary = `🏁 ${brt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} BRT | ${elapsedS}s | ✅ ${totalOk} | ⏭️ ${totalSkipped} | ❌ ${totalErrors}`;
    addLog("");
    addLog(summary);

    // Log the run
    await supabase.from("agent_run_logs").insert({
      triggered_by: "daily-fast",
      total_updated: totalOk,
      total_errors: totalErrors,
      duration_s: elapsedS,
      log_lines: logLines,
    } as any);

    // ── Trigger Radar Alert Check (only if scores changed) ──
    if (totalOk > 0) {
      try {
        addLog("🎯 Disparando verificação do Radar de Hedge...");
        const radarRes = await fetch(`${supabaseUrl}/functions/v1/send-radar-alert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ source: "daily-fast" }),
        });
        if (radarRes.ok) {
          const radarData = await radarRes.json();
          addLog(`  ✅ Radar: ${radarData.triggered || 0} alertas disparados, ${radarData.emailsSent || 0} e-mails enviados`);
        } else {
          const errText = await radarRes.text();
          addLog(`  ⚠️ Radar falhou: ${errText.slice(0, 200)}`);
        }
      } catch (radarErr) {
        addLog(`  ⚠️ Radar erro: ${(radarErr as Error).message}`);
      }
    } else {
      addLog("⏭️ Radar skipped — no score changes");
    }

    return new Response(
      JSON.stringify({ success: true, summary, log: logLines, total_ok: totalOk, total_skipped: totalSkipped, total_errors: totalErrors, elapsed_s: elapsedS }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = (error as Error).message;
    addLog(`💥 FATAL: ${msg}`);
    return new Response(
      JSON.stringify({ success: false, error: msg, log: logLines }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
