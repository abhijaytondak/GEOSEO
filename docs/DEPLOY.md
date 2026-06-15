# Deploying GEOSEO (web + API)

GEOSEO is two services: the **Next.js web** (`apps/web`) and the **NestJS API**
(`apps/api`, long-running, talks to Supabase + Upstash Redis). For a fully-live
public product you host BOTH and point the web at the API.

## Current state

- **Web** → Vercel project `geoseo` (`https://geoseo-tau.vercel.app`). Deployed in
  demo mode (mock-backed reads) because the API isn't hosted there yet.
- **Live full-stack preview (local-backed)** → `https://nectar-polo-parameter.ngrok-free.dev`
  — a reserved ngrok tunnel to the local web (`:3001`), which proxies `/api/v1` to the
  local API (`:4000`, real Supabase data). Live while the local processes + tunnel run.

## Durable API host — Railway (one-time)

`railway.json` (repo root) is already configured: Nixpacks builder, start
`pnpm --filter @geoseo/api start` (tsx — now a **runtime** dependency so a
production install keeps it), healthcheck `/api/v1/health` (300s timeout — the
API boots ~90s as it inits ~30 stores serially). The server binds `0.0.0.0:$PORT`
automatically — **do not set `PORT`**.

The full env-var list (with comments, no secrets) is **`apps/api/.env.railway.example`** —
copy real values from your local `apps/api/.env`.

```bash
railway login                      # interactive — the only step a human must do
railway init                       # create a project (or `railway link` to an existing one)

# Core vars — copy real values from apps/api/.env (current Railway CLI syntax):
railway variables \
  --set "GEOSEO_MODE=production" \        # fail-closed: auth CANNOT be disabled in production
  --set "API_AUTH_REQUIRED=true" \        # required; boot aborts if production + auth disabled
  --set "DEV_API_TOKEN=<bearer>" \        # the secret the web BFF injects (until Clerk JWT verify lands)
  --set "WEB_ORIGIN=https://geoseo-tau.vercel.app" \   # CORS allow-list (your web origin)
  --set "DATABASE_URL=<supabase-url>" \
  --set "REDIS_URL=<upstash-url>" \
  --set "LLM_PROVIDER=deepseek" \
  --set "DEEPSEEK_API_KEY=<key>" \
  --set "DEEPSEEK_BASE_URL=https://api.deepseek.com" \
  --set "DEEPSEEK_MODEL=deepseek-chat"

# Optional integration keys flip a capability from demo→live (see the template for all):
#   DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD · HUBSPOT_ACCESS_TOKEN ·
#   GSC_SERVICE_ACCOUNT_JSON / GSC_SITE_URL · IMAGE_GEN_API_KEY · WORDPRESS_*/WEBFLOW_*/SHOPIFY_*

railway up                         # deploys; prints a public https URL
```

> Mode matters: **production** forces auth on (the boot aborts if you try
> `API_AUTH_REQUIRED=false`). For an **open beta** host, set `GEOSEO_MODE=demo`
> instead — it runs unauthenticated + sales-safe with persistence still on.
> Pair production with the web's `NEXT_PUBLIC_GEOSEO_MODE=production` so the BFF +
> middleware enforce sign-in automatically.

**Verify the deploy** (the honesty-pass health check confirms the DB is truly reachable, not just configured):

```bash
curl -s https://<railway-app>.up.railway.app/api/v1/health | jq
# Expect: {"status":"ok","mode":"production","persistence":"postgres","dbReachable":true,"authRequired":true}
# persistence:"degraded" ⇒ DATABASE_URL is set but unreachable from Railway (check the Supabase host/allowlist).
curl -s https://<railway-app>.up.railway.app/api/v1/dashboard/kpis   # ⇒ 401 without a token (auth is on) ✓
```

## Durable API host — Render (free tier, alternative to Railway)

`render.yaml` (repo root) is a ready Blueprint. Render deploys straight from GitHub,
so the only steps are in the dashboard:

1. **Render → New → Blueprint** → pick this repo → it reads `render.yaml` and creates
   the `geoseo-api` web service (Node, pnpm workspace install, start `pnpm --filter
   @geoseo/api start`, healthcheck `/api/v1/health`).
2. Fill the `sync: false` secrets (values from `apps/api/.env`): `DATABASE_URL`,
   `REDIS_URL`, `DEEPSEEK_API_KEY` (+ any integration keys to activate seams).
3. Deploy → Render gives `https://geoseo-api.onrender.com`. Verify:
   `curl https://geoseo-api.onrender.com/api/v1/health` → `persistence:"postgres"` if
   Supabase is reachable from Render.

> **Free-tier caveat:** the service spins down after ~15 min idle; the next request
> cold-starts ~30–60s (the web's "Demo data" banner covers that window gracefully).
> Upgrade the Render plan for always-on. The Blueprint defaults to `GEOSEO_MODE=demo`
> (open + persistence on); to go production set `GEOSEO_MODE=production` +
> `API_AUTH_REQUIRED=true` + `DEV_API_TOKEN` (and mirror the token on Vercel).

## Point the Vercel web at the hosted API

Set `API_INTERNAL_URL` to the Railway URL (build + runtime), then redeploy:

```bash
# In the Vercel dashboard (project geoseo → Settings → Environment Variables),
# or via CLI from repo root:
vercel env add API_INTERNAL_URL production   # value: https://<railway-app>.up.railway.app
vercel deploy --prod --yes
```

The web's BFF route handler (`app/api/v1/[...path]/route.ts`, which replaced the old
static rewrite) and the server-side api-client both read `API_INTERNAL_URL`, so browser + RSC calls
reach the hosted API. Set `NEXT_PUBLIC_GEOSEO_MODE=production` to fail closed
(no mock fallback) once the API is reliably up.

## Notes

- Secrets live in `apps/api/.env` (gitignored) — copy values into Railway, never commit.
- Redis (Upstash) is optional: without `REDIS_URL` the queue falls back to in-memory.
- Supabase RLS is enabled; the API's `postgres` role bypasses it (intended).
