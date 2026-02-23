import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatDatePtBR(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildReportHtml(body: string, imageUrl: string | null, dateFormatted: string): string {
  const imageBlock = imageUrl
    ? `<div style="text-align:center;margin:0 0 36px;">
        <img src="${imageUrl}" alt="Report semanal" style="max-width:100%;max-height:400px;border-radius:16px;border:1.5px solid #dbeafe;" />
      </div>`
    : "";

  const formattedBody = body.replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#eef2fb;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#2563eb 0%,#1a40c8 100%);padding:48px 40px 40px;text-align:center;">
      <div style="font-family:'Inter',Arial,sans-serif;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">treend</div>
      <div style="color:rgba(255,255,255,0.75);font-size:18px;font-weight:500;margin-top:16px;letter-spacing:0.5px;">Report Semanal</div>
    </div>
    <div style="background:#ffffff;padding:52px 48px 48px;">
      <h1 style="font-size:34px;font-weight:800;color:#1e293b;margin:0 0 20px;">📊 <span style="color:#2563eb;">Report Semanal</span></h1>
      <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:16px;padding:24px 28px;margin-bottom:40px;">
        <p style="font-size:18px;color:#374151;margin:0;">📅 <strong style="color:#166534;">Publicado em:</strong> ${dateFormatted}</p>
      </div>
      <p style="font-size:20px;color:#475569;line-height:1.7;margin:0 0 36px;">${formattedBody}</p>
      ${imageBlock}
      <div style="text-align:center;margin-bottom:36px;">
        <a href="https://app.treend.com.br/feed" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:20px;font-weight:700;text-decoration:none;padding:20px 48px;border-radius:14px;letter-spacing:0.2px;">Ver no Feed →</a>
      </div>
      <p style="text-align:center;font-size:17px;color:#94a3b8;margin:0;">Dúvidas? Fale conosco em <a href="mailto:suporte@treend.com.br" style="color:#2563eb;font-weight:700;text-decoration:none;">suporte@treend.com.br</a></p>
    </div>
    <div style="background:linear-gradient(135deg,#2563eb 0%,#1a40c8 100%);padding:40px 40px 36px;text-align:center;">
      <div style="font-family:'Inter',Arial,sans-serif;font-size:36px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;margin-bottom:16px;">treend</div>
      <p style="color:rgba(255,255,255,0.55);font-size:14px;margin-top:12px;">© ${new Date().getFullYear()} Treend. Todos os direitos reservados.</p>
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
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const { post_id, body, image_url, created_at } = await req.json();

    if (!post_id || !body) {
      throw new Error("post_id and body are required");
    }

    const dateFormatted = formatDatePtBR(created_at || new Date().toISOString());
    const subject = `Treend - Report Semanal (${dateFormatted})`;

    // Fetch all users from auth
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
      console.log("No users found to send report to");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending weekly report to ${allEmails.length} users`);

    const html = buildReportHtml(body, image_url, dateFormatted);

    // Send in batches of 50 (Resend batch limit is 100)
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
        // Continue with remaining batches even if one fails
      } else {
        totalSent += batch.length;
        console.log(`Batch sent: ${batch.length} emails`);
      }
    }

    console.log(`Weekly report sent successfully to ${totalSent} users for post ${post_id}`);

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, post_id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending weekly report:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
