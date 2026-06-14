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
`pnpm --filter @geoseo/api start` (tsx), healthcheck `/api/v1/health`. The API
reads `$PORT` automatically.

```bash
railway login                      # interactive — only step a human must do
railway init                       # or: railway link  (pick/create a project)
# Set env vars (copy values from apps/api/.env — never commit them):
railway variables set \
  DATABASE_URL=...        \
  REDIS_URL=...           \
  LLM_PROVIDER=deepseek   \
  DEEPSEEK_API_KEY=...    \
  DEEPSEEK_BASE_URL=...   \
  DEEPSEEK_MODEL=...      \
  GEOSEO_MODE=production  \
  API_AUTH_REQUIRED=false        # or =true and add DEV_API_TOKEN / Clerk verify
railway up                         # deploys; gives a public https URL
```

## Point the Vercel web at the hosted API

Set `API_INTERNAL_URL` to the Railway URL (build + runtime), then redeploy:

```bash
# In the Vercel dashboard (project geoseo → Settings → Environment Variables),
# or via CLI from repo root:
vercel env add API_INTERNAL_URL production   # value: https://<railway-app>.up.railway.app
vercel deploy --prod --yes
```

The web's `next.config.ts` rewrite (`/api/v1/* → $API_INTERNAL_URL/api/v1/*`) and
the server-side api-client both read `API_INTERNAL_URL`, so browser + RSC calls
reach the hosted API. Set `NEXT_PUBLIC_GEOSEO_MODE=production` to fail closed
(no mock fallback) once the API is reliably up.

## Notes

- Secrets live in `apps/api/.env` (gitignored) — copy values into Railway, never commit.
- Redis (Upstash) is optional: without `REDIS_URL` the queue falls back to in-memory.
- Supabase RLS is enabled; the API's `postgres` role bypasses it (intended).
