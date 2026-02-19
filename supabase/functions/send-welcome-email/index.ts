import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Treend <noreply@treend.com.br>",
        to: [email],
        subject: `Bem-vindo à Treend, ${firstName}! 🚀`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9, #0284c7);padding:40px 40px 30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;margin:0;">Treend</h1>
              <p style="color:#e0f2fe;font-size:14px;margin:8px 0 0;">Inteligência estatística para câmbio</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#18181b;font-size:22px;margin:0 0 16px;">Olá, ${firstName}! 👋</h2>
              <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Sua conta na <strong>Treend</strong> foi criada com sucesso. Você agora tem acesso ao seu <strong>trial gratuito de 7 dias</strong> com todas as funcionalidades da plataforma.
              </p>
              <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Veja o que você pode fazer:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:8px;margin-bottom:8px;">
                    <p style="margin:0;color:#0c4a6e;font-size:14px;">📊 <strong>Score Treend</strong> — Indicador diário com 95% de eficácia</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:8px;">
                    <p style="margin:0;color:#0c4a6e;font-size:14px;">🧮 <strong>Calculadora</strong> — Simule operações de câmbio em tempo real</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:8px;">
                    <p style="margin:0;color:#0c4a6e;font-size:14px;">📰 <strong>Feed & Notícias</strong> — Análises e insights do mercado</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:8px;">
                    <p style="margin:0;color:#0c4a6e;font-size:14px;">🎓 <strong>Tutoriais</strong> — Aprenda a usar a plataforma</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://treendx.lovable.app/dashboard" style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
                      Acessar meu painel
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="color:#a1a1aa;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Treend. Todos os direitos reservados.<br/>
                Este e-mail foi enviado porque você criou uma conta na plataforma Treend.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
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
