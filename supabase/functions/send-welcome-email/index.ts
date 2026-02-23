import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, name } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const firstName = name?.split(" ")[0] || "usuário";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#eef2fb;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#2563eb 0%,#1a40c8 100%);padding:48px 40px 40px;text-align:center;">
      <div style="font-family:'Inter',Arial,sans-serif;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">treend</div>
      <div style="color:rgba(255,255,255,0.75);font-size:18px;font-weight:500;margin-top:16px;letter-spacing:0.5px;">Seus dados de acesso</div>
    </div>
    <div style="background:#ffffff;padding:52px 48px 48px;">
      <h1 style="font-size:34px;font-weight:800;color:#1e293b;margin:0 0 20px;">Olá, <span style="color:#2563eb;">${firstName}</span>! 👋</h1>
      <p style="font-size:20px;color:#475569;line-height:1.7;margin:0 0 36px;">
        Sua conta no Treend foi criada com sucesso. Abaixo você encontra seu e-mail de acesso. Clique no botão para entrar na plataforma e começar a acompanhar o câmbio em tempo real com inteligência artificial.
      </p>
      <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:16px;padding:24px 28px;margin-bottom:40px;">
        <p style="font-size:18px;color:#374151;margin:0;">✉️ <strong style="color:#166534;">E-mail de acesso:</strong> ${email}</p>
      </div>
      <div style="text-align:center;margin-bottom:36px;">
        <a href="https://app.treend.com.br/login" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:20px;font-weight:700;text-decoration:none;padding:20px 48px;border-radius:14px;letter-spacing:0.2px;">Acessar minha conta →</a>
      </div>
      <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:16px;padding:24px 28px;margin-bottom:40px;">
        <p style="font-size:18px;color:#92400e;margin:0;">⚠️ Esqueceu sua senha? Na página de login, clique em <strong style="color:#b45309;">"Esqueci minha senha"</strong> para redefinir.</p>
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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Treend <noreply@treend.com.br>",
        to: [email],
        subject: "Acesso liberado na Treend",
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(`Resend error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending welcome email:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
