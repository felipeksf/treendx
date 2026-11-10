// ======================================================
// TREEND DASHBOARD — EDGE FUNCTION (PRODUCTION SAFE)
// ======================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ---------- helpers ----------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
};

async function db(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  return res;
}

// ---------- HTML ----------
function page() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Treend Control</title>

<style>
body{
 background:#0b0f14;
 color:#e6edf3;
 font-family:system-ui;
 padding:40px;
}
button{
 padding:12px 20px;
 border-radius:10px;
 border:none;
 font-weight:600;
 background:#3fb950;
 color:#000;
 cursor:pointer;
 margin-bottom:20px;
}
pre{
 background:#05080c;
 padding:20px;
 border-radius:10px;
 overflow:auto;
}
</style>
</head>

<body>

<h2>Treend Dashboard</h2>

<button onclick="run()">Executar agente</button>
<button onclick="load()">Atualizar</button>

<pre id="log">carregando...</pre>

<script>
async function load(){
 const r = await fetch("./data");
 const j = await r.json();
 document.getElementById("log").textContent =
 JSON.stringify(j,null,2);
}

async function run(){
 await fetch("./run",{method:"POST"});
 load();
}

load();
</script>

</body>
</html>`;
}

// ---------- server ----------
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // preflight
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  // ---------- DATA ----------
  if (url.pathname.endsWith("/data")) {
    const r = await db(
      "heatmap_scores?select=*&order=updated_at.desc"
    );
    return new Response(await r.text(), { headers: corsHeaders });
  }

  // ---------- RUN AGENT ----------
  if (url.pathname.endsWith("/run")) {
    const r = await fetch(
      `${SUPABASE_URL}/functions/v1/treend-agent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );

    return new Response(await r.text(), { headers: corsHeaders });
  }

  // ---------- PAGE ----------
  return new Response(page(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "frame-ancestors *",
      "Cache-Control": "no-cache",
    },
  });
});