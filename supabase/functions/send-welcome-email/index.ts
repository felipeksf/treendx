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

    const { email, name, password } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const firstName = name?.split(" ")[0] || "usuário";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Treend – Seus dados de acesso</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Plus Jakarta Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(59,130,246,0.12);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%);padding:44px 48px 36px;text-align:center;position:relative;overflow:hidden;">
      <div style="font-size:38px;font-weight:800;color:#ffffff;letter-spacing:-1.5px;line-height:1;">
        treend<span style="display:inline-block;width:8px;height:8px;background:#93c5fd;border-radius:50%;margin-left:2px;vertical-align:super;"></span>
      </div>
      <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:0.5px;margin-top:4px;">
        O Seu Guia Definitivo de Câmbio com IA
      </div>
    </div>

    <!-- Hero Strip -->
    <div style="background:#eff6ff;border-bottom:1px solid #dbeafe;padding:28px 48px;display:flex;align-items:center;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td width="68" valign="middle">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:14px;text-align:center;line-height:52px;">
            <span style="font-size:26px;">🔑</span>
          </div>
        </td>
        <td valign="middle">
          <div style="font-size:17px;font-weight:700;color:#1e3a5f;line-height:1.3;">Seus dados de acesso chegaram!</div>
          <div style="font-size:13.5px;color:#64748b;margin-top:3px;">Acesse sua conta e comece a acompanhar o câmbio agora.</div>
        </td>
      </tr></table>
    </div>

    <!-- Body -->
    <div style="padding:40px 48px 32px;">
      <div style="font-size:22px;font-weight:700;color:#1e3a5f;margin-bottom:12px;">
        Olá, <span style="color:#3b82f6;">${firstName}</span>! 👋
      </div>
      <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 32px;">
        Sua conta na Treend foi criada com sucesso. Abaixo você encontra
        suas credenciais de acesso. Guarde-as em um local seguro e nunca
        compartilhe com ninguém.
      </p>

      <!-- Credentials Card -->
      <div style="background:#f8faff;border:1.5px solid #dbeafe;border-radius:16px;overflow:hidden;margin-bottom:28px;">
        <div style="background:#eff6ff;padding:14px 24px;font-size:11px;font-weight:700;color:#3b82f6;letter-spacing:1.2px;text-transform:uppercase;border-bottom:1px solid #dbeafe;">
          🔐  Suas Credenciais de Acesso
        </div>
        <!-- Email row -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:18px 24px;border-bottom:1px solid #e2e8f0;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td width="52" valign="middle">
                  <div style="width:36px;height:36px;background:#eff6ff;border-radius:10px;text-align:center;line-height:36px;">
                    <span style="font-size:16px;">✉️</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:3px;">E-mail</div>
                  <div style="font-size:15.5px;font-weight:700;color:#1e3a5f;letter-spacing:0.3px;word-break:break-all;">${email}</div>
                </td>
              </tr></table>
            </td>
          </tr>
          <!-- Password row -->
          <tr>
            <td style="padding:18px 24px;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td width="52" valign="middle">
                  <div style="width:36px;height:36px;background:#f0fdf4;border-radius:10px;text-align:center;line-height:36px;">
                    <span style="font-size:16px;">🔒</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:3px;">Senha temporária</div>
                  <div style="font-family:'Courier New',monospace;background:#ecfdf5;color:#059669;padding:6px 12px;border-radius:8px;display:inline-block;font-size:16px;font-weight:700;letter-spacing:2px;margin-top:2px;">${password || "••••••"}</div>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:8px 0 32px;">
        <a href="https://treendx.lovable.app/login" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(59,130,246,0.35);">
          Acessar minha conta →
        </a>
      </div>

      <!-- Security Notice -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:32px;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="32" valign="top" style="font-size:20px;">⚠️</td>
          <td>
            <p style="font-size:13px;color:#92400e;line-height:1.6;margin:0;">
              <strong style="color:#b45309;">Importante:</strong> Esta é uma senha temporária gerada automaticamente. Por segurança,
              recomendamos que você a altere no primeiro acesso em Configurações → Segurança.
              Caso não tenha solicitado este cadastro, entre em contato conosco imediatamente.
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
    <div style="background:#f8faff;border-top:1px solid #e2e8f0;padding:28px 48px;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#3b82f6;letter-spacing:-0.8px;margin-bottom:10px;">treend</div>
      <div style="margin-bottom:14px;">
        <a href="#" style="font-size:12.5px;color:#64748b;text-decoration:none;margin:0 10px;">Política de Privacidade</a>
        <a href="#" style="font-size:12.5px;color:#64748b;text-decoration:none;margin:0 10px;">Termos de Uso</a>
        <a href="#" style="font-size:12.5px;color:#64748b;text-decoration:none;margin:0 10px;">Central de Ajuda</a>
      </div>
      <div style="font-size:11.5px;color:#94a3b8;line-height:1.6;">
        © ${new Date().getFullYear()} Treend. Todos os direitos reservados.<br/>
        Você está recebendo este e-mail porque realizou um cadastro em nosso sistema.
      </div>
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
        subject: `Treend – Seus dados de acesso 🔑`,
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
