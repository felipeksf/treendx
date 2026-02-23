import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SimulationData {
  currency: string;
  profile: string;
  volume: number;
  currentRate: number;
  treendRate: number;
  opsPerMonth: number;
  opsFrequency: string;
  bankSpread: number;
  projectionMonths: number;
  netMonth: number;
  netYear: number;
  grossMonth: number;
  spreadCost: number;
  effectiveRate: number;
  rateDiffPct: number;
  netPct: number;
  economiaMinusSpread: number;
  overallHealth: string;
}

function currencySymbol(c: string): string {
  return c === "BRL" ? "R$" : c === "USD" ? "US$" : c === "GBP" ? "£" : "€";
}

function currencyFlag(c: string): string {
  return c === "USD" ? "🇺🇸" : c === "EUR" ? "🇪🇺" : c === "GBP" ? "🇬🇧" : c === "BRL" ? "🇧🇷" : "";
}

function fmtBrl(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function profileLabel(p: string): string {
  const map: Record<string, string> = {
    importador: "Importador",
    exportador: "Exportador",
    agente_turismo: "Agente de Turismo",
    turista: "Turista",
    freelancer: "Freelancer",
  };
  return map[p] || p;
}

function healthLabel(h: string): { text: string; color: string; bg: string } {
  if (h === "good") return { text: "Saudável", color: "#166534", bg: "#f0fdf4" };
  if (h === "warning") return { text: "Atenção", color: "#92400e", bg: "#fffbeb" };
  return { text: "Crítico", color: "#991b1b", bg: "#fef2f2" };
}

function freqLabel(f: string): string {
  return f === "day" ? "Dia" : f === "week" ? "Semana" : "Mês";
}

function buildSimulationHtml(sim: SimulationData, userName: string): string {
  const sym = currencySymbol(sim.currency);
  const flag = currencyFlag(sim.currency);
  const health = healthLabel(sim.overallHealth);
  const isPositive = sim.netMonth > 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#eef2fb;font-family:'Inter',Arial,sans-serif;">
  <div style="padding:40px 20px;">
    <div style="max-width:680px;margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#2563eb 0%,#1a40c8 100%);padding:48px 40px 40px;text-align:center;">
        <div style="font-family:'Inter',Arial,sans-serif;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">treend</div>
        <div style="color:rgba(255,255,255,0.75);font-size:18px;font-weight:500;margin-top:16px;letter-spacing:0.5px;">Resumo da Simulação</div>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:52px 48px 48px;">
        <h1 style="font-size:30px;font-weight:800;color:#1e293b;margin:0 0 8px;">📊 <span style="color:#2563eb;">Simulação Cambial</span></h1>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 32px;">${dateStr} • ${userName}</p>

        <!-- Parameters -->
        <div style="background:#f8fafc;border-radius:16px;border:1.5px solid #e2e8f0;padding:24px;margin-bottom:28px;">
          <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:16px;">Parâmetros da Simulação</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Moeda</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${flag} ${sim.currency}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Perfil</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${profileLabel(sim.profile)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Volume Mensal</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sym} ${fmtBrl(sim.volume)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Operações</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.opsPerMonth}/${freqLabel(sim.opsFrequency)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Spread Bancário</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.bankSpread.toFixed(1)}%</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Projeção</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.projectionMonths} meses</td>
            </tr>
          </table>
        </div>

        <!-- Rates -->
        <div style="display:flex;gap:12px;margin-bottom:28px;">
          <div style="flex:1;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Taxa Atual</div>
            <div style="font-size:22px;font-weight:800;color:#1e293b;">${sim.currentRate.toFixed(4)}</div>
          </div>
          <div style="flex:1;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;padding:16px;text-align:center;">
            <div style="font-size:11px;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Taxa Treend</div>
            <div style="font-size:22px;font-weight:800;color:#2563eb;">${sim.treendRate.toFixed(4)}</div>
          </div>
          <div style="flex:1;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Taxa Efetiva</div>
            <div style="font-size:22px;font-weight:800;color:#1e293b;">${sim.effectiveRate.toFixed(4)}</div>
          </div>
        </div>

        <!-- Results -->
        <div style="margin-bottom:28px;">
          <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:16px;">Resultados</div>
          <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1.5px solid #e2e8f0;">
            <tr style="background:${isPositive ? '#f0fdf4' : '#fef2f2'};">
              <td style="padding:14px 20px;font-size:14px;font-weight:600;color:#1e293b;">Economia Mensal</td>
              <td style="padding:14px 20px;text-align:right;font-size:18px;font-weight:800;color:${isPositive ? '#166534' : '#991b1b'};">${isPositive ? '' : '-'}${sym} ${fmtBrl(Math.abs(sim.netMonth))}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">Economia Anual</td>
              <td style="padding:12px 20px;text-align:right;font-size:15px;font-weight:700;color:${isPositive ? '#166534' : '#991b1b'};border-top:1px solid #f1f5f9;">${isPositive ? '' : '-'}${sym} ${fmtBrl(Math.abs(sim.netYear))}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">Economia Bruta</td>
              <td style="padding:12px 20px;text-align:right;font-size:15px;font-weight:700;color:#1e293b;border-top:1px solid #f1f5f9;">${sym} ${fmtBrl(sim.grossMonth)}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">Custo de Spread</td>
              <td style="padding:12px 20px;text-align:right;font-size:15px;font-weight:700;color:#dc2626;border-top:1px solid #f1f5f9;">-${sym} ${fmtBrl(sim.spreadCost)}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">Diferença de Taxa</td>
              <td style="padding:12px 20px;text-align:right;font-size:15px;font-weight:700;color:#1e293b;border-top:1px solid #f1f5f9;">${sim.rateDiffPct.toFixed(2)}%</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">Percentual Líquido</td>
              <td style="padding:12px 20px;text-align:right;font-size:15px;font-weight:700;color:${sim.netPct >= 0 ? '#166534' : '#991b1b'};border-top:1px solid #f1f5f9;">${sim.netPct.toFixed(2)}%</td>
            </tr>
          </table>
        </div>

        <!-- Health -->
        <div style="background:${health.bg};border-radius:12px;padding:16px 20px;margin-bottom:36px;text-align:center;">
          <span style="font-size:13px;color:${health.color};font-weight:700;">Saúde da Operação: ${health.text}</span>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:36px;">
          <a href="https://app.treend.com.br/calculator" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:20px;font-weight:700;text-decoration:none;padding:20px 48px;border-radius:14px;">Abrir Calculadora →</a>
        </div>

        <p style="text-align:center;font-size:13px;color:#94a3b8;margin:0;font-style:italic;">Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.</p>
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    // Get user info
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, Authorization: authHeader },
    });
    if (!userRes.ok) throw new Error("Unauthorized");
    const userData = await userRes.json();
    const userEmail = userData.email;
    const userName = userData.user_metadata?.full_name || userEmail;

    const simulation: SimulationData = await req.json();

    const html = buildSimulationHtml(simulation, userName);
    const sym = currencySymbol(simulation.currency);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Treend <noreply@treend.com.br>",
        to: [userEmail],
        subject: `Treend - Simulação ${simulation.currency} (${sym} ${simulation.volume.toLocaleString("pt-BR")})`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending simulation email:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
