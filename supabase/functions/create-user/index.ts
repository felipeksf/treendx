import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: roleCheck } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleCheck) throw new Error("Admin access required");

    const { name, email, role, password } = await req.json();

    if (!name || !email || !role) {
      throw new Error("name, email, and role are required");
    }
    if (!["admin", "editor", "user"].includes(role)) {
      throw new Error("Invalid role");
    }

    // Use a generated password if none provided
    const userPassword = password || crypto.randomUUID().slice(0, 16) + "!A1";

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError) throw new Error(createError.message);

    const userId = newUser.user.id;

    // Create profile
    await adminClient.from("profiles").insert({
      user_id: userId,
      full_name: name,
      subscription_status: "active",
    });

    // Create role
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role: role,
    });

    // Send welcome email
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        const firstName = name.split(" ")[0] || "usuário";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Treend <noreply@treend.com.br>",
            to: [email],
            subject: "Acesso liberado na Treend",
            html: `<p>Olá ${firstName}, sua conta foi criada na Treend. Acesse <a href="https://app.treend.com.br/login">aqui</a> com o email <strong>${email}</strong>. Sua senha temporária é: <strong>${userPassword}</strong>. Recomendamos alterar sua senha após o primeiro login.</p>`,
          }),
        });
      }
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, temp_password: userPassword }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating user:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
