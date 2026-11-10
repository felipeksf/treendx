// ================================================================
// TREEND — send-rate-whatsapp
// Espelho do send-rate-email via Z-API (WhatsApp)
// Disparo: mesmo gatilho do send-rate-email (10h e 17h BRT)
// ================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Cotações com múltiplos fallbacks ─────────────────────────────
interface RateData {
  bid: string;
  ask: string;
  pctChange: string;
  high: string;
  low: string;
}

// Fonte 1: AwesomeAPI
async function fetchAwesome(): Promise<Record<string, RateData> | null> {
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL", {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      USD: data.USDBRL,
      EUR: data.EURBRL,
      GBP: data.GBBRL || data.GBPBRL,
    };
  } catch { return null; }
}

// Fonte 2: ExchangeRate-API (gratuita, sem key)
async function fetchExchangeRate(): Promise<Record<string, RateData> | null> {
  try {
    const [usdRes, eurRes, gbpRes] = await Promise.all([
      fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(8_000) }),
      fetch("https://open.er-api.com/v6/latest/EUR", { signal: AbortSignal.timeout(8_000) }),
      fetch("https://open.er-api.com/v6/latest/GBP", { signal: AbortSignal.timeout(8_000) }),
    ]);
    if (!usdRes.ok || !eurRes.ok || !gbpRes.ok) return null;
    const [usd, eur, gbp] = await Promise.all([usdRes.json(), eurRes.json(), gbpRes.json()]);

    const makeRate = (bid: number, pct = "0"): RateData => ({
      bid: bid.toFixed(4),
      ask: (bid * 1.001).toFixed(4),
      pctChange: pct,
      high: (bid * 1.005).toFixed(4),
      low:  (bid * 0.995).toFixed(4),
    });

    return {
      USD: makeRate(usd.rates?.BRL ?? 0),
      EUR: makeRate(eur.rates?.BRL ?? 0),
      GBP: makeRate(gbp.rates?.BRL ?? 0),
    };
  } catch { return null; }
}

async function fetchRates(): Promise<Record<string, RateData>> {
  const awesome = await fetchAwesome();
  if (awesome) { console.log("[RATES] AwesomeAPI ✅"); return awesome; }

  console.warn("[RATES] AwesomeAPI falhou, tentando ExchangeRate-API...");
  const er = await fetchExchangeRate();
  if (er) { console.log("[RATES] ExchangeRate-API ✅"); return er; }

  throw new Error("Todas as fontes de cotação falharam");
}

// ── Formata mensagem WhatsApp ─────────────────────────────────────
function buildWhatsAppMessage(rates: Record<string, RateData>, period: "morning" | "afternoon"): string {
  const periodLabel = period === "morning" ? "☀️ Abertura (10h)" : "🌆 Fechamento (17h)";
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
    timeZone: "America/Sao_Paulo",
  });

  const flags: Record<string, string> = { USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧" };
  const names: Record<string, string> = { USD: "Dólar", EUR: "Euro", GBP: "Libra" };

  const lines = Object.entries(rates)
    .filter(([, v]) => v)
    .map(([code, r]) => {
      const pct = parseFloat(r.pctChange);
      const arrow = pct > 0 ? "📈" : pct < 0 ? "📉" : "➡️";
      const signal = pct > 0 ? "+" : "";
      return `${flags[code]} *${names[code]} (${code}/BRL)*\n` +
             `   Compra: *R$ ${parseFloat(r.bid).toFixed(4)}*\n` +
             `   Venda: R$ ${parseFloat(r.ask).toFixed(4)}\n` +
             `   ${arrow} ${signal}${Math.abs(pct).toFixed(2)}% | Mín R$${parseFloat(r.low).toFixed(4)} — Máx R$${parseFloat(r.high).toFixed(4)}`;
    })
    .join("\n\n");

  return `*treend* | Cotações ${periodLabel}\n` +
         `📅 ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}\n\n` +
         `${lines}\n\n` +
         `🔗 Dashboard: https://app.treend.com.br/dashboard`;
}

// ── Envia mensagem via Z-API ──────────────────────────────────────
async function sendWhatsApp(phone: string, message: string, zApiInstanceId: string, zApiToken: string): Promise<boolean> {
  // Normaliza número: remove tudo exceto dígitos, garante código do país
  const normalized = phone.replace(/\D/g, "");
  const withCountry = normalized.startsWith("55") ? normalized : `55${normalized}`;

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${zApiInstanceId}/token/${zApiToken}/send-text`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: withCountry, message }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) {
      console.error(`[ZAPI] Falhou para ${withCountry}: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[ZAPI] Erro para ${withCountry}:`, (e as Error).message);
    return false;
  }
}

// ── Handler ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ZAPI_INSTANCE  = Deno.env.get("ZAPI_INSTANCE_ID")!;
    const ZAPI_TOKEN     = Deno.env.get("ZAPI_TOKEN")!;

    if (!ZAPI_INSTANCE || !ZAPI_TOKEN) throw new Error("ZAPI_INSTANCE_ID e ZAPI_TOKEN são obrigatórios");

    // Detecta período (morning/afternoon)
    let period: "morning" | "afternoon" = "morning";
    try {
      const body = await req.json();
      if (body?.period) period = body.period;
    } catch {
      const brtHour = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).getHours();
      period = brtHour >= 14 ? "afternoon" : "morning";
    }

    // Busca cotações
    const rates = await fetchRates();
    const message = buildWhatsAppMessage(rates, period);

    // Busca usuários active/trial COM whatsapp_phone preenchido
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?subscription_status=in.(active,trial)&whatsapp_phone=not.is.null&select=user_id,whatsapp_phone`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    if (!res.ok) throw new Error(`Falha ao buscar profiles: ${await res.text()}`);
    const profiles: { user_id: string; whatsapp_phone: string }[] = await res.json();

    if (profiles.length === 0) {
      console.log("Nenhum usuário com WhatsApp cadastrado");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enviando cotação WhatsApp (${period}) para ${profiles.length} usuários`);

    // Envia em série com pequeno delay para não sobrecarregar a Z-API
    let sent = 0, errors = 0;
    for (const p of profiles) {
      const ok = await sendWhatsApp(p.whatsapp_phone, message, ZAPI_INSTANCE, ZAPI_TOKEN);
      if (ok) sent++; else errors++;
      await new Promise(r => setTimeout(r, 300)); // 300ms entre envios
    }

    console.log(`WhatsApp cotação (${period}): ✅ ${sent} enviados | ❌ ${errors} erros`);

    return new Response(
      JSON.stringify({ success: true, period, sent, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro send-rate-whatsapp:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
