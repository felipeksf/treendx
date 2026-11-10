# Treend — app

Consultoria cambial inteligente. Vite + React + TypeScript + Tailwind + shadcn/ui, com Supabase (banco, auth e edge functions), Resend (e-mail), Stripe (assinaturas) e deploy na Vercel.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com as credenciais do seu projeto Supabase
npm run dev            # http://localhost:8080
```

Scripts: `npm run build` (produção), `npm run lint`, `npm test`.

## Variáveis de ambiente

### Frontend (`.env` local e env vars da Vercel)

Apenas a chave publishable/anon — nunca a `service_role`, que ficaria exposta no bundle.

| Variável | Para quê |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publishable/anon (aceita também `VITE_SUPABASE_ANON_KEY`) |
| `VITE_SUPABASE_PROJECT_ID` | Ref do projeto |

Sem `VITE_SUPABASE_URL` ou a chave, a app falha no boot com mensagem explícita em vez de tela branca.

### Edge functions (secrets no Supabase)

Configure em Project Settings → Edge Functions → Secrets, ou via `supabase secrets set`.

| Secret | Usado por |
|---|---|
| `GEMINI_API_KEY` | `analyze-chart` (leitura do RSI no screenshot do TradingView) |
| `RESEND_API_KEY` | `send-welcome-email`, `send-weekly-report`, `send-event-email`, `send-rate-email`, `send-simulation-email`, `custom-auth-email`, `create-user`, `stripe-webhook` |
| `STRIPE_SECRET_KEY` | `create-checkout`, `check-subscription`, `customer-portal`, `stripe-webhook` |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` |

## Edge functions

```bash
supabase functions deploy <nome>        # uma função
supabase functions deploy               # todas
```

`supabase/config.toml` define quais funções dispensam JWT (`verify_jwt = false`).

### `analyze-chart`

Recebe `{ imageUrl }` (screenshot do TradingView em Supabase storage), lê o RSI 14 e devolve `rsi_value`, `rsi_zone`, `currency_pair`, `confidence`, `analysis_summary`, `suggested_score`, `volatility_pct` e `momentum`. Roda em `gemini-2.5-flash` no Google AI Studio, com `temperature: 0` e saída estruturada por `responseSchema` para que o mesmo screenshot sempre produza a mesma leitura. Consumida por `AdminScores` e `AdminAnalise`, que preenchem os campos para revisão antes de publicar.

## Deploy (Vercel)

Framework Vite, build `npm run build`, output `dist`. As três variáveis `VITE_*` precisam estar definidas no projeto da Vercel. O `vercel.json` já faz o fallback de SPA para `/`, necessário para as rotas do React Router.
