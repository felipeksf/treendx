import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatDatePtBR(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildEventHtml(title: string, eventDate: string, description: string | null): string {
  const dateFormatted = formatDatePtBR(eventDate);
  const descBlock = description
    ? `<div style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">${description.replace(/\n/g, "<br/>")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Treend – Evento Macroeconômico</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Plus Jakarta Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(59,130,246,0.12);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%);padding:28px 48px 20px;text-align:center;position:relative;overflow:hidden;">
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:120px;width:auto;display:inline-block;background:transparent;border:none;" />
      <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:0.5px;margin-top:8px;">
        O Seu Guia Definitivo de Câmbio com IA
      </div>
    </div>

    <!-- Hero Strip -->
    <div style="background:#fffbeb;border-bottom:1px solid #fde68a;padding:28px 48px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td valign="middle">
          <div style="font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">📅 Evento Macroeconômico</div>
          <div style="font-size:17px;font-weight:700;color:#1e3a5f;line-height:1.3;">${title} em ${dateFormatted}</div>
        </td>
      </tr></table>
    </div>

    <!-- Body -->
    <div style="padding:40px 48px 32px;">
      ${descBlock}

      <!-- CTA -->
      <div style="text-align:center;margin:8px 0 32px;">
        <a href="https://treendx.lovable.app/agenda" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(59,130,246,0.35);">
          Ver na Agenda →
        </a>
      </div>

      <div style="height:1px;background:#e2e8f0;margin:0 0 28px;"></div>

      <!-- Support -->
      <div style="text-align:center;font-size:13.5px;color:#64748b;margin-bottom:8px;line-height:1.7;">
        Dúvidas ou problemas? Nossa equipe está pronta para te ajudar.<br/>
        Fale conosco em <a href="mailto:suporte@treend.com.br" style="color:#3b82f6;font-weight:600;text-decoration:none;">suporte@treend.com.br</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%);border-top:1px solid #e2e8f0;padding:28px 48px;text-align:center;">
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:60px;width:auto;display:inline-block;margin-bottom:14px;background:transparent;border:none;" />
      <div style="margin-bottom:14px;">
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Política de Privacidade</a>
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Termos de Uso</a>
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Central de Ajuda</a>
      </div>
      <div style="font-size:11.5px;color:rgba(255,255,255,0.6);line-height:1.6;">
        © ${new Date().getFullYear()} Treend. Todos os direitos reservados.<br/>
        Você está recebendo este e-mail porque possui uma conta ativa na plataforma Treend.
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
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

    const { title, event_date, description } = await req.json();

    if (!title || !event_date) throw new Error("title and event_date are required");

    const dateFormatted = formatDatePtBR(event_date);
    const subject = `Treend - ${title} em ${dateFormatted}`;

    // Fetch all users
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

      if (!usersRes.ok) {
        const errText = await usersRes.text();
        throw new Error(`Failed to fetch users: ${errText}`);
      }

      const usersData = await usersRes.json();
      const users = usersData.users || [];
      const emails = users
        .map((u: { email?: string }) => u.email)
        .filter((e: string | undefined): e is string => !!e);
      allEmails = [...allEmails, ...emails];
      if (users.length < perPage) break;
      page++;
    }

    if (allEmails.length === 0) {
      console.log("No users found");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending event email to ${allEmails.length} users: ${title}`);

    const html = buildEventHtml(title, event_date, description);

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

      const data = await res.json();
      if (!res.ok) {
        console.error("Resend batch error:", JSON.stringify(data));
      } else {
        totalSent += batch.length;
        console.log(`Batch sent: ${batch.length} emails`);
      }
    }

    console.log(`Event email sent to ${totalSent} users for: ${title}`);

    return new Response(
      JSON.stringify({ success: true, sent: totalSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending event email:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
