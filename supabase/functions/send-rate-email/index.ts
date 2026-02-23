import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RateData {
  code: string;
  name: string;
  bid: string;
  ask: string;
  varBid: string;
  pctChange: string;
  high: string;
  low: string;
}

async function fetchRates(): Promise<Record<string, RateData>> {
  const res = await fetch(
    "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL"
  );
  if (!res.ok) throw new Error(`AwesomeAPI error: ${res.status}`);
  const data = await res.json();
  return {
    USD: data.USDBRL,
    EUR: data.EURBRL,
    GBP: data.GBBRL || data.GBPBRL,
  };
}

function formatRate(value: string): string {
  return parseFloat(value).toFixed(4);
}

function getVariationColor(pctChange: string): string {
  const pct = parseFloat(pctChange);
  if (pct > 0) return "#EF4444"; // red = subiu
  if (pct < 0) return "#22C55E"; // green = caiu
  return "#94A3B8"; // neutral
}

function getVariationArrow(pctChange: string): string {
  const pct = parseFloat(pctChange);
  if (pct > 0) return "▲";
  if (pct < 0) return "▼";
  return "—";
}

function buildRateEmailHtml(
  rates: Record<string, RateData>,
  period: "morning" | "afternoon"
): string {
  const periodLabel = period === "morning" ? "Abertura (10h)" : "Fechamento (17h)";
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  const flags: Record<string, string> = {
    USD: "🇺🇸",
    EUR: "🇪🇺",
    GBP: "🇬🇧",
  };

  const names: Record<string, string> = {
    USD: "Dólar Americano",
    EUR: "Euro",
    GBP: "Libra Esterlina",
  };

  const currencyRows = Object.entries(rates)
    .filter(([, v]) => v)
    .map(([code, rate]) => {
      const varColor = getVariationColor(rate.pctChange);
      const arrow = getVariationArrow(rate.pctChange);
      const pct = parseFloat(rate.pctChange);
      return `
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;">
          <div style="font-size:28px;line-height:1;">${flags[code] || ""}</div>
        </td>
        <td style="padding:16px 12px;border-bottom:1px solid #f1f5f9;">
          <div style="font-size:16px;font-weight:700;color:#1e293b;">${code}/BRL</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px;">${names[code] || code}</div>
        </td>
        <td style="padding:16px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">
          <div style="font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;">R$ ${formatRate(rate.bid)}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Compra</div>
        </td>
        <td style="padding:16px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">
          <div style="font-size:16px;font-weight:600;color:#475569;">R$ ${formatRate(rate.ask)}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Venda</div>
        </td>
        <td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;text-align:right;">
          <div style="font-size:14px;font-weight:700;color:${varColor};">${arrow} ${Math.abs(pct).toFixed(2)}%</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Variação</div>
        </td>
      </tr>`;
    })
    .join("");

  const rangeRows = Object.entries(rates)
    .filter(([, v]) => v)
    .map(([code, rate]) => {
      return `
      <td style="padding:12px 16px;text-align:center;width:33%;">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">${flags[code] || ""} ${code}</div>
        <div style="font-size:13px;color:#1e293b;font-weight:600;">R$ ${formatRate(rate.low)} — R$ ${formatRate(rate.high)}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">Mín — Máx do dia</div>
      </td>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#eef2fb;font-family:'Inter',Arial,sans-serif;">
  <div style="padding:40px 20px;">
    <div style="max-width:680px;margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#2563eb 0%,#1a40c8 100%);padding:48px 40px 40px;text-align:center;">
        <div style="font-family:'Inter',Arial,sans-serif;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">treend</div>
        <div style="color:rgba(255,255,255,0.75);font-size:18px;font-weight:500;margin-top:16px;letter-spacing:0.5px;">Cotações em Tempo Real</div>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:52px 48px 48px;">
        <h1 style="font-size:30px;font-weight:800;color:#1e293b;margin:0 0 8px;">📊 <span style="color:#2563eb;">${periodLabel}</span></h1>
        <p style="font-size:16px;color:#94a3b8;margin:0 0 32px;text-transform:capitalize;">${dateFormatted}</p>

        <!-- Rates Table -->
        <table style="width:100%;border-collapse:collapse;border-radius:16px;overflow:hidden;border:1.5px solid #e2e8f0;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:12px 20px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;"></th>
              <th style="padding:12px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Moeda</th>
              <th style="padding:12px 12px;text-align:right;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Compra</th>
              <th style="padding:12px 12px;text-align:right;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Venda</th>
              <th style="padding:12px 20px;text-align:right;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Var.</th>
            </tr>
          </thead>
          <tbody>
            ${currencyRows}
          </tbody>
        </table>

        <!-- Range info -->
        <div style="margin-top:24px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>${rangeRows}</tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin:40px 0 36px;">
          <a href="https://app.treend.com.br/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:20px;font-weight:700;text-decoration:none;padding:20px 48px;border-radius:14px;letter-spacing:0.2px;">Ver Dashboard Completo →</a>
        </div>

        <p style="text-align:center;font-size:17px;color:#94a3b8;margin:0;">Dúvidas? Fale conosco em <a href="mailto:suporte@treend.com.br" style="color:#2563eb;font-weight:700;text-decoration:none;">suporte@treend.com.br</a></p>
      </div>

      <!-- Footer -->
      <div style="background:linear-gradient(135deg,#2563eb 0%,#1a40c8 100%);padding:40px 40px 36px;text-align:center;">
        <div style="font-family:'Inter',Arial,sans-serif;font-size:36px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;margin-bottom:16px;">treend</div>
        <p style="color:rgba(255,255,255,0.55);font-size:14px;margin-top:12px;">© ${new Date().getFullYear()} Treend. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Missing Supabase env");

    // Determine period from request body or auto-detect
    let period: "morning" | "afternoon" = "morning";
    try {
      const body = await req.json();
      if (body?.period) period = body.period;
    } catch {
      // Auto-detect based on current BRT time
      const now = new Date();
      const brtHour = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).getHours();
      period = brtHour >= 14 ? "afternoon" : "morning";
    }

    // Fetch live rates
    const rates = await fetchRates();
    console.log("Rates fetched:", JSON.stringify(Object.keys(rates)));

    // Fetch active + trial users from profiles
    const profilesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?subscription_status=in.(active,trial)&select=user_id`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!profilesRes.ok) throw new Error(`Failed to fetch profiles: ${await profilesRes.text()}`);
    const profiles: { user_id: string }[] = await profilesRes.json();
    const userIds = profiles.map((p) => p.user_id);

    if (userIds.length === 0) {
      console.log("No active/trial users found");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch emails from auth for these user IDs
    let allEmails: string[] = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const usersRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        {
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (!usersRes.ok) throw new Error(`Failed to fetch users: ${await usersRes.text()}`);
      const usersData = await usersRes.json();
      const users = usersData.users || [];

      const emails = users
        .filter((u: { id: string; email?: string }) => userIds.includes(u.id) && u.email)
        .map((u: { email: string }) => u.email);

      allEmails = [...allEmails, ...emails];
      if (users.length < perPage) break;
      page++;
    }

    if (allEmails.length === 0) {
      console.log("No emails found for active/trial users");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending rate email (${period}) to ${allEmails.length} users`);

    const periodLabel = period === "morning" ? "Abertura 10h" : "Fechamento 17h";
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
    const subject = `Treend - Cotações ${periodLabel} (${dateStr})`;
    const html = buildRateEmailHtml(rates, period);

    // Send in batches
    const batchSize = 50;
    let totalSent = 0;

    for (let i = 0; i < allEmails.length; i += batchSize) {
      const batch = allEmails.slice(i, i + batchSize);
      const batchPayload = batch.map((email) => ({
        from: "Treend <noreply@treend.com.br>",
        to: [email],
        subject,
        html,
      }));

      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(batchPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Resend batch error:", JSON.stringify(errData));
      } else {
        totalSent += batch.length;
        console.log(`Batch sent: ${batch.length} emails`);
      }
    }

    console.log(`Rate email (${period}) sent to ${totalSent} users`);

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, period }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending rate email:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
