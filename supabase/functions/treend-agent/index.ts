import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROFILES = ["importador", "exportador", "agente_turismo", "freelancer"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "CNY", "USDT"] as const;
const FREQUENCIES = ["hourly", "daily", "weekly", "biweekly", "monthly"] as const;

// TradingView pairs (forex)
const TV_PAIRS: Record<string, string> = {
  USD: "USDBRL",
  EUR: "EURBRL",
  GBP: "GBPBRL",
  CNY: "CNYBRL",
};

// Crypto pairs use a different scanner endpoint (24/7)
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

// ── Fetch RSI from TradingView's technical analysis (forex) ──
async function fetchTvRsi(pair: string, rsiColumn: string = "RSI|5"): Promise<number> {
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
  return rsi;
}

// ── Fetch RSI from TradingView crypto scanner (24/7) ──
async function fetchTvRsiCrypto(pair: string, rsiColumn: string = "RSI|5"): Promise<number> {
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
  return rsi;
}

// ── heat_y based on RSI extremity (lower y = stronger signal) ──
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

// Perfis que COMPRAM moeda estrangeira → RSI alto = ruim → score invertido
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

// v6.0 — Corrected timeframes: daily/weekly/4h/monthly RSI, linear heat_x
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
  addLog(`▶ treend-agent v6.0 (timeframes corrigidos) — ${brt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} BRT`);
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

    addLog("🔑 Admin autenticado");

    let totalUpdated = 0;
    let totalErrors = 0;
    const publishedAt = new Date().toISOString();

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

          const { error: upsertErr } = await supabase
            .from("heatmap_scores")
            .upsert(
              {
                admin_id: adminId,
                profile_type: profile,
                currency: cur,
                frequency: freq,
                heat_x: heatX,
                heat_y: heatY,
                volatility_pct: 0,
                momentum: 0,
                published_at: publishedAt,
              } as any,
              { onConflict: "profile_type,currency,frequency" }
            );

          if (upsertErr) {
            addLog(`    ❌ ${profile}|${cur}|${freq}: ${upsertErr.message}`);
            totalErrors++;
            continue;
          }

          await supabase.from("heatmap_history").insert({
            admin_id: adminId,
            profile_type: profile,
            currency: cur,
            frequency: freq,
            heat_x: heatX,
            heat_y: heatY,
            volatility_pct: 0,
            momentum: 0,
            published_at: publishedAt,
          } as any);

          const label = colorLabel(heatX);
          addLog(`    ✅ ${profile}|${cur} RSI=${rsi.toFixed(2)}[${source}] x=${heatX} (${label})`);
          totalUpdated++;
        }
      }

      addLog("");
    }

    // ── Log the run ──
    const elapsedS = Math.round((Date.now() - startMs) / 100) / 10;
    const summary = `🏁 ${totalUpdated} registros (${totalErrors} erros) em ${elapsedS}s — v6.0 timeframes corrigidos`;
    addLog("");
    addLog(summary);

    await supabase.from("agent_run_logs").insert({
      triggered_by: "edge-function",
      total_updated: totalUpdated,
      total_errors: totalErrors,
      duration_s: elapsedS,
      log_lines: logLines,
    } as any);

    // ── Trigger Radar Alert Check ──
    try {
      addLog("🎯 Disparando verificação do Radar de Hedge...");
      const radarRes = await fetch(`${supabaseUrl}/functions/v1/send-radar-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ source: "treend-agent" }),
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

    return new Response(
      JSON.stringify({ success: true, summary, log: logLines, total_updated: totalUpdated, total_errors: totalErrors }),
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
