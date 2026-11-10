// ================================================================
// TREEND — send-weekly-whatsapp
// Espelho do send-weekly-report via Z-API (WhatsApp)
// Disparo: mesmo gatilho do send-weekly-report (publicação de post)
// Payload esperado: { post_id, body, report_type?, image_url? }
// ================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Formata mensagem de report ────────────────────────────────────
function buildReportMessage(body: string, reportType: string, createdAt: string): string {
  const label = reportType === "monthly" ? "📆 Report Mensal" : "📋 Report Semanal";
  const date = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  // Trunca o corpo se muito longo (WhatsApp tem limite de ~4096 chars)
  const maxBodyLen = 800;
  const truncatedBody = body.length > maxBodyLen
    ? body.substring(0, maxBodyLen) + "...\n\n_(leia o report completo no app)_"
    : body;

  return `*treend* | ${label}\n` +
         `📅 ${date}\n\n` +
         `${truncatedBody}\n\n` +
         `🔗 Ver no feed: https://app.treend.com.br/feed`;
}

// ── Envia via Z-API ───────────────────────────────────────────────
async function sendWhatsApp(phone: string, message: string, instanceId: string, token: string): Promise<boolean> {
  const normalized = phone.replace(/\D/g, "");
  const withCountry = normalized.startsWith("55") ? normalized : `55${normalized}`;

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: withCountry, message }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) {
      console.error(`[ZAPI] Falhou ${withCountry}: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[ZAPI] Erro ${withCountry}:`, (e as Error).message);
    return false;
  }
}

// ── Handler ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ZAPI_INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID")!;
    const ZAPI_TOKEN    = Deno.env.get("ZAPI_TOKEN")!;

    if (!ZAPI_INSTANCE || !ZAPI_TOKEN) throw new Error("ZAPI_INSTANCE_ID e ZAPI_TOKEN são obrigatórios");

    const { post_id, body, report_type = "weekly", created_at, image_url } = await req.json();
    if (!post_id || !body) throw new Error("post_id e body são obrigatórios");

    const message = buildReportMessage(body, report_type, created_at || new Date().toISOString());

    // Busca todos os usuários COM whatsapp_phone
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?whatsapp_phone=not.is.null&select=user_id,whatsapp_phone`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    if (!res.ok) throw new Error(`Falha ao buscar profiles: ${await res.text()}`);
    const profiles: { user_id: string; whatsapp_phone: string }[] = await res.json();

    if (profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enviando report WhatsApp (${report_type}) para ${profiles.length} usuários`);

    let sent = 0, errors = 0;
    for (const p of profiles) {
      const ok = await sendWhatsApp(p.whatsapp_phone, message, ZAPI_INSTANCE, ZAPI_TOKEN);
      if (ok) sent++; else errors++;
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`WhatsApp report: ✅ ${sent} | ❌ ${errors}`);

    return new Response(
      JSON.stringify({ success: true, report_type, post_id, sent, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro send-weekly-whatsapp:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
