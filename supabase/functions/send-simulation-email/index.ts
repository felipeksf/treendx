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
  zone?: string;
  date?: string;
  projections?: { label: string; value: number }[];
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

function freqLabel(f: string): string {
  return f === "day" ? "Diário" : f === "week" ? "Semanal" : "Mensal";
}

function buildSimulationHtml(sim: SimulationData, userName: string): string {
  const sym = currencySymbol(sim.currency);
  const flag = currencyFlag(sim.currency);
  const isPositive = sim.netMonth >= 0;

  const now = new Date();
  const dateStr = sim.date || now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  const projections = sim.projections || [
    { label: "6 meses", value: sim.netMonth * 6 },
    { label: "12 meses", value: sim.netYear },
    { label: "24 meses", value: sim.netMonth * 24 },
  ];

  const projHtml = projections.map((p) => {
    const pPos = p.value >= 0;
    return `<td style="width:33%;text-align:center;padding:16px 8px;border:1px solid #e2e8f0;border-radius:12px;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">${p.label}</div>
      <div style="font-size:16px;font-weight:800;color:${pPos ? '#166534' : '#991b1b'};">${sym} ${fmtBrl(Math.abs(p.value))}</div>
    </td>`;
  }).join("");

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
        <h1 style="font-size:26px;font-weight:800;color:#1e293b;margin:0 0 4px;">${flag} <span style="color:#2563eb;">Simulação — ${sim.currency}</span></h1>
        <p style="font-size:13px;color:#94a3b8;margin:0 0 32px;">${dateStr} • ${userName}</p>

        <!-- Parameters -->
        <div style="background:#f8fafc;border-radius:16px;border:1.5px solid #e2e8f0;padding:24px;margin-bottom:28px;">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Parâmetros</div>
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
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Volume</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sym} ${fmtBrl(sim.volume)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Taxa no momento</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.currentRate.toFixed(4)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Taxa Treend estimada</td>
              <td style="padding:6px 0;font-size:13px;color:#2563eb;font-weight:600;text-align:right;">${sim.treendRate.toFixed(4)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Zona</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.zone || '—'}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:10px 0 6px;font-size:13px;color:#94a3b8;">Spread bancário</td>
              <td style="padding:10px 0 6px;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.bankSpread.toFixed(1)}%</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Operações</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.opsPerMonth} / ${freqLabel(sim.opsFrequency)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Projeção</td>
              <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">${sim.projectionMonths} meses</td>
            </tr>
          </table>
        </div>

        <!-- Results -->
        <div style="background:#f8fafc;border-radius:16px;border:1.5px solid #e2e8f0;padding:24px;margin-bottom:28px;">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Resultado da Simulação</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#94a3b8;">Volume em BRL</td>
              <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:700;text-align:right;">R$ ${fmtBrl(sim.volume * sim.currentRate)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#94a3b8;">Volume com Treend</td>
              <td style="padding:8px 0;font-size:14px;color:#2563eb;font-weight:700;text-align:right;">R$ ${fmtBrl(sim.volume * sim.treendRate)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#94a3b8;">Diferença de taxa</td>
              <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:700;text-align:right;">${(sim.currentRate - sim.treendRate).toFixed(4)} (${sim.rateDiffPct.toFixed(2)}%)</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#94a3b8;">Custo do spread (${sim.bankSpread.toFixed(1)}%)</td>
              <td style="padding:8px 0;font-size:14px;color:#dc2626;font-weight:700;text-align:right;">-R$ ${fmtBrl(sim.spreadCost)}</td>
            </tr>
          </table>
        </div>

        <!-- Economy highlight -->
        <div style="background:${isPositive ? '#f0fdf4' : '#fef2f2'};border:1.5px solid ${isPositive ? '#bbf7d0' : '#fecaca'};border-radius:16px;padding:20px 24px;margin-bottom:28px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="font-size:14px;font-weight:600;color:#1e293b;">${isPositive ? 'Economia estimada' : 'Custo adicional estimado'}</td>
              <td style="text-align:right;font-size:22px;font-weight:800;color:${isPositive ? '#166534' : '#991b1b'};">${isPositive ? '+' : ''}${sym} ${fmtBrl(sim.netMonth)}</td>
            </tr>
          </table>
        </div>

        <!-- Projections -->
        <div style="background:#f8fafc;border-radius:16px;border:1.5px solid #e2e8f0;padding:24px;margin-bottom:36px;">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Projeções</div>
          <table style="width:100%;border-collapse:separate;border-spacing:8px 0;">
            <tr>${projHtml}</tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:36px;">
          <a href="https://app.treend.com.br/calculator" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:18px 44px;border-radius:14px;">Abrir Calculadora →</a>
        </div>

        <p style="text-align:center;font-size:12px;color:#94a3b8;margin:0;font-style:italic;">Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.</p>
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
