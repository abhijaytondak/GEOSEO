# Production launch runbook — flip demo → live (auth + hosted API)

The code is production-ready; going live is an **operator/secrets sequence** (dashboards only).
This is the exact, ordered path. Demo mode stays safe until you complete it.

## Prerequisites (dashboards — only you can do these)
1. **Clerk production instance** → create at dashboard.clerk.com, add the domain
   `geoseo-tau.vercel.app` (or your app domain). Copy `pk_live_…` + `sk_live_…`.
   (The current deploy uses a `pk_test_` dev instance, which is domain-restricted and breaks on a
   real host — this replaces it.)
2. **DEV_API_TOKEN** — one shared secret the Vercel BFF sends to the API. Generate:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   Use the **same value** on both Render and Vercel.
3. **Render plan** — the free web service cold-starts (~30–60s after idle). For production,
   upgrade to an always-on plan (fixes the perf-audit cold-start finding). Optional to start.

## Step 1 — Render (the API), env vars
Set on the `geoseo-api` service (render.yaml already declares the `sync:false` placeholders):
```
GEOSEO_MODE=production
API_AUTH_REQUIRED=true
DEV_API_TOKEN=<the 64-char secret>
CLERK_SECRET_KEY=sk_live_…
DATABASE_URL=<Supabase pooler URL>      # already set
ALLOW_INMEMORY_QUEUE=true               # already set (Upstash free tier can't sustain BullMQ)
```
Redeploy. The boot invariant (PR #20) then PASSES (hosted + DB + auth on). If auth is NOT set it
**refuses to boot** by design — that's the containment, not a bug.

## Step 2 — Vercel (the web), env vars
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…
CLERK_SECRET_KEY=sk_live_…
DEV_API_TOKEN=<same secret as Render>
GEOSEO_REQUIRE_AUTH=true
NEXT_PUBLIC_GEOSEO_MODE=production
API_INTERNAL_URL=https://geoseo-api.onrender.com   # the Render API URL
```
Redeploy.

## Step 3 — Merge the gated PRs (after Steps 1–2 are live)
- **PR #20** (boot invariant) — now boots *with* auth enforced.
- **PR #29** (no-mock) — real data only; safe once the API is hosted.

## Step 4 — Verify (copy-paste)
```
# auth enforced — app endpoints reject anonymous, health stays public
curl -s https://geoseo-tau.vercel.app/api/v1/health        # → "authRequired":true
curl -s -o /dev/null -w "%{http_code}\n" \
  https://geoseo-tau.vercel.app/api/v1/settings             # → 401
# SEO endpoints serve correct content types (PR #43)
curl -s -o /dev/null -w "%{content_type}\n" \
  https://geoseo-tau.vercel.app/api/v1/public/llms.txt      # → text/plain
```
Expected: health `authRequired:true`; `/settings` 401 signed-out; signed-in users (Clerk) work;
admins/marketers authorized (BFF forwards the verified role — PR #30, merged).

## Verified locally (2026-06-26)
Production-mode boot (GEOSEO_MODE=production + API_AUTH_REQUIRED=true + DEV_API_TOKEN + real
DATABASE_URL) starts cleanly: public health 200, `/settings` 401 without token / 200 with the
dev token. So the above config is known-good before you deploy.

## Optional, post-launch (still operator)
- `DEEPSEEK_API_KEY` (or Gemini free tier via the `DEEPSEEK_*` OpenAI-compatible base URL) →
  real LLM page content instead of templates.
- `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` → real keyword volume/difficulty/CPC.
- Snapshot the DB + rotate any previously-stored integration credentials before opening to users.
