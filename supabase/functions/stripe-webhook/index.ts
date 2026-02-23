import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If STRIPE_WEBHOOK_SECRET is set, verify signature; otherwise parse raw
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      logStep("Signature verified");
    } else {
      event = JSON.parse(body) as Stripe.Event;
      logStep("No webhook secret configured, parsing raw event");
    }

    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const customerEmail = session.customer_details?.email || session.customer_email;
      logStep("Checkout completed", { userId, email: customerEmail, customerId: session.customer });

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Prefer metadata user_id; fallback to email lookup
      let matchedUserId = userId;
      if (!matchedUserId && customerEmail) {
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const matchedUser = users?.users?.find(u => u.email === customerEmail);
        matchedUserId = matchedUser?.id;
        logStep("Fallback email lookup", { found: !!matchedUser });
      }

      if (matchedUserId) {
        await supabaseClient
          .from("profiles")
          .update({ subscription_status: "active" })
          .eq("user_id", matchedUserId);
        logStep("Profile updated to active", { userId: matchedUserId });

        // Get user name for email
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("full_name")
          .eq("user_id", matchedUserId)
          .maybeSingle();

        // Send confirmation email
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY && customerEmail) {
          const firstName = profile?.full_name?.split(" ")[0] || "usuário";

          const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(59,130,246,0.12);">
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%);padding:36px 48px 24px;text-align:center;">
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:120px;width:auto;display:inline-block;background-color:#2563eb;border:none;border-radius:0;" />
      <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:0.5px;margin-top:10px;">Assinatura Confirmada</div>
    </div>
    <div style="padding:40px 48px 32px;">
      <div style="font-size:22px;font-weight:700;color:#1e3a5f;margin-bottom:12px;">
        Parabéns, <span style="color:#3b82f6;">${firstName}</span>! 🎉
      </div>
      <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
        Sua assinatura do Treend foi confirmada com sucesso! Agora você tem acesso completo 
        a todas as ferramentas da plataforma: Score diário, Calculadora inteligente, 
        Histórico de decisões e muito mais.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <p style="font-size:14px;color:#166534;margin:0;line-height:1.6;">
          ✅ <strong>Acesso completo ativado</strong> — aproveite todas as funcionalidades sem restrições.
        </p>
      </div>
      <div style="text-align:center;margin:8px 0 32px;">
        <a href="https://treendx.lovable.app/dashboard" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:12px;box-shadow:0 4px 20px rgba(59,130,246,0.35);">
          Acessar o Dashboard →
        </a>
      </div>
      <div style="text-align:center;font-size:13.5px;color:#64748b;line-height:1.7;">
        Dúvidas? Fale conosco em <a href="mailto:suporte@treend.com.br" style="color:#3b82f6;font-weight:600;text-decoration:none;">suporte@treend.com.br</a>
      </div>
    </div>
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%);padding:28px 48px;text-align:center;">
      <img src="https://treendx.lovable.app/treend-logo-white.png" alt="Treend" style="height:60px;width:auto;display:inline-block;margin-bottom:14px;background-color:#2563eb;border:none;border-radius:0;" />
      <div style="font-size:11.5px;color:rgba(255,255,255,0.6);line-height:1.6;">
        © ${new Date().getFullYear()} Treend. Todos os direitos reservados.
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
              to: [customerEmail],
              subject: "🎉 Assinatura confirmada — Treend",
              html,
            }),
          });
          const emailData = await res.json();
          logStep("Confirmation email sent", { ok: res.ok, id: emailData.id });
        }
      } else {
        logStep("No matching user found", { email: customerEmail });
      }
    }

    if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
      const obj = event.data.object as any;
      const customerId = obj.customer as string;
      logStep("Subscription event", { type: event.type, customerId });

      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const customerEmail = customer.email;

      if (customerEmail) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const matchedUser = users?.users?.find(u => u.email === customerEmail);

        if (matchedUser) {
          await supabaseClient
            .from("profiles")
            .update({ subscription_status: "expired" })
            .eq("user_id", matchedUser.id);
          logStep("Profile set to expired", { userId: matchedUser.id });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
