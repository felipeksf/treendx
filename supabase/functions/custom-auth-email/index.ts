import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildResetPasswordHtml(email: string, confirmationUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Treend – Redefinição de Senha</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Plus Jakarta Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(59,130,246,0.12);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%);padding:52px 48px 40px;text-align:center;position:relative;overflow:hidden;">
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:200px;width:auto;display:inline-block;" />
      <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:0.5px;margin-top:12px;">
        O Seu Guia Definitivo de Câmbio com IA
      </div>
    </div>

    <!-- Hero Strip -->
    <div style="background:#eff6ff;border-bottom:1px solid #dbeafe;padding:28px 48px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td width="68" valign="middle">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:14px;text-align:center;line-height:52px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </div>
        </td>
        <td valign="middle" style="padding-left:16px;">
          <div style="font-size:17px;font-weight:700;color:#1e3a5f;line-height:1.3;">Redefinição de senha solicitada</div>
          <div style="font-size:13.5px;color:#64748b;margin-top:3px;">Clique no botão abaixo para criar uma nova senha.</div>
        </td>
      </tr></table>
    </div>

    <!-- Body -->
    <div style="padding:40px 48px 32px;">
      <div style="font-size:22px;font-weight:700;color:#1e3a5f;margin-bottom:12px;">
        Olá! 👋
      </div>
      <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 32px;">
        Recebemos uma solicitação para redefinir a senha da sua conta associada ao e-mail
        <strong style="color:#1e3a5f;">${email}</strong>. Clique no botão abaixo para criar uma nova senha de acesso.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:8px 0 32px;">
        <a href="${confirmationUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(59,130,246,0.35);">
          Redefinir minha senha →
        </a>
      </div>

      <!-- Security Notice -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:32px;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="32" valign="top">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </td>
          <td>
            <p style="font-size:13px;color:#92400e;line-height:1.6;margin:0;">
              Este link expira em <strong style="color:#b45309;">1 hora</strong>. Se você não solicitou esta redefinição,
              ignore este e-mail — sua senha permanecerá inalterada.
            </p>
          </td>
        </tr></table>
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
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:100px;width:auto;display:inline-block;margin-bottom:14px;" />
      <div style="margin-bottom:14px;">
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Política de Privacidade</a>
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Termos de Uso</a>
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Central de Ajuda</a>
      </div>
      <div style="font-size:11.5px;color:rgba(255,255,255,0.6);line-height:1.6;">
        © ${new Date().getFullYear()} Treend. Todos os direitos reservados.
      </div>
    </div>

  </div>
</body>
</html>`;
}

function buildConfirmationHtml(email: string, confirmationUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Treend – Confirme seu e-mail</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Plus Jakarta Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(59,130,246,0.12);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%);padding:52px 48px 40px;text-align:center;position:relative;overflow:hidden;">
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:200px;width:auto;display:inline-block;" />
      <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:0.5px;margin-top:12px;">
        O Seu Guia Definitivo de Câmbio com IA
      </div>
    </div>

    <!-- Hero Strip -->
    <div style="background:#eff6ff;border-bottom:1px solid #dbeafe;padding:28px 48px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td width="68" valign="middle">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:14px;text-align:center;line-height:52px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </td>
        <td valign="middle" style="padding-left:16px;">
          <div style="font-size:17px;font-weight:700;color:#1e3a5f;line-height:1.3;">Confirme seu e-mail</div>
          <div style="font-size:13.5px;color:#64748b;margin-top:3px;">Um último passo para ativar sua conta.</div>
        </td>
      </tr></table>
    </div>

    <!-- Body -->
    <div style="padding:40px 48px 32px;">
      <div style="font-size:22px;font-weight:700;color:#1e3a5f;margin-bottom:12px;">
        Olá! 👋
      </div>
      <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 32px;">
        Obrigado por se cadastrar no Treend! Clique no botão abaixo para confirmar seu e-mail
        <strong style="color:#1e3a5f;">${email}</strong> e ativar sua conta.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:8px 0 32px;">
        <a href="${confirmationUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(59,130,246,0.35);">
          Confirmar meu e-mail →
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
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:100px;width:auto;display:inline-block;margin-bottom:14px;" />
      <div style="margin-bottom:14px;">
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Política de Privacidade</a>
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Termos de Uso</a>
        <a href="#" style="font-size:12.5px;color:rgba(255,255,255,0.7);text-decoration:none;margin:0 10px;">Central de Ajuda</a>
      </div>
      <div style="font-size:11.5px;color:rgba(255,255,255,0.6);line-height:1.6;">
        © ${new Date().getFullYear()} Treend. Todos os direitos reservados.
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
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const payload = await req.json();
    console.log("Auth hook payload type:", payload.type);

    // Auth Hook sends: { user, email_data }
    const user = payload.user;
    const emailData = payload.email_data;

    if (!user || !emailData) {
      throw new Error("Invalid hook payload");
    }

    const email = user.email;
    const tokenHash = emailData.token_hash;
    const token = emailData.token;
    const emailActionType = emailData.email_action_type;
    const redirectTo = emailActionType === "recovery" 
      ? "https://treendx.lovable.app/reset-password" 
      : (emailData.redirect_to || "https://treendx.lovable.app");

    let subject: string;
    let html: string;

    // Build confirmation URL
    // For recovery: use the token_hash with type=recovery
    // For signup: use the token_hash with type=signup
    const siteUrl = Deno.env.get("SUPABASE_URL") || "https://khbkfcdpgrksrrpocdvb.supabase.co";

    if (emailActionType === "recovery") {
      const confirmationUrl = `${siteUrl}/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`;
      subject = "Redefinição de senha – Treend";
      html = buildResetPasswordHtml(email, confirmationUrl);
    } else if (emailActionType === "signup" || emailActionType === "email") {
      const confirmationUrl = `${siteUrl}/auth/v1/verify?token=${tokenHash}&type=signup&redirect_to=${encodeURIComponent(redirectTo)}`;
      subject = "Confirme seu e-mail – Treend";
      html = buildConfirmationHtml(email, confirmationUrl);
    } else {
      // For other types, just pass through
      console.log("Unhandled email action type:", emailActionType);
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Treend <noreply@treend.com.br>",
        to: [email],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(`Resend error: ${JSON.stringify(data)}`);
    }

    console.log("Email sent successfully:", data.id, "type:", emailActionType);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in custom-auth-email:", message);
    // Return 200 even on error to not block auth flow
    return new Response(JSON.stringify({ error: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
