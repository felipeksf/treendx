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
<body style="margin:0;padding:0;background-color:#eef2fb;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#2563eb 0%,#1a40c8 100%);padding:48px 40px 40px;text-align:center;">
      <div style="font-family:'Inter',Arial,sans-serif;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">treend</div>
      <div style="color:rgba(255,255,255,0.75);font-size:18px;font-weight:500;margin-top:16px;letter-spacing:0.5px;">Assinatura Confirmada</div>
    </div>
    <div style="background:#ffffff;padding:52px 48px 48px;">
      <h1 style="font-size:34px;font-weight:800;color:#1e293b;margin:0 0 20px;">Parabéns, <span style="color:#2563eb;">${firstName}</span>! 🎉</h1>
      <p style="font-size:20px;color:#475569;line-height:1.7;margin:0 0 36px;">
        Sua assinatura do Treend foi confirmada com sucesso! Agora você tem acesso completo a todas as ferramentas da plataforma: Score diário, Calculadora inteligente, Histórico de decisões e muito mais.
      </p>
      <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:16px;padding:24px 28px;margin-bottom:40px;">
        <p style="font-size:18px;color:#374151;margin:0;">✅ <strong style="color:#166534;">Acesso completo ativado</strong> — aproveite todas as funcionalidades sem restrições.</p>
      </div>
      <div style="text-align:center;margin-bottom:36px;">
        <a href="https://app.treend.com.br/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:20px;font-weight:700;text-decoration:none;padding:20px 48px;border-radius:14px;letter-spacing:0.2px;">Acessar o Dashboard →</a>
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
