# GEOSEO — Session Handoff (resume guide)

**Read this first.** It lets any fresh Claude Code session continue exactly where work left off. Last updated 2026-06-13.

---

## 0. Resume in 60 seconds
1. Repo: `/Users/abhijay/GEOSEO` (pnpm + Turborepo monorepo). **Untracked in git** (no commits yet — see §7).
2. Start servers (see §3). API on **:4000**, web on **:3001**.
3. Secrets already in `apps/api/.env` (git-ignored): Supabase `DATABASE_URL` + `DEEPSEEK_API_KEY`. Do NOT commit; values are NOT in this doc.
4. Read §5 (what's built) + §6 (what's next) and pick the next task from §6.
5. Verify anything with §8 commands.

## 1. What GEOSEO is
A Gushwork-class AI SaaS. Two PRDs drive it (both in `docs/`):
- `PRD-backlinking-seo-engine.md` — backlinking/authority dashboard (the original surface).
- `PRD-page-engine.md` (`/Users/abhijay/Documents/Codex/2026-06-12/.../automatic-page-creation-publishing-engine-prd.md`) — the **Page Creation & Publishing Engine** (current focus): Research → Blueprint → Page → Publish (/feeds + sitemap + llms.txt) → Leads → Monitoring/Refresh.
Other specs: `PRD-gushwork-platform.md`, `FLOWS.md`, `API-SPEC.md`, `TECH-STACK.md`, `ROADMAP.md`, `UI-REFERENCE.md`/`design/tokens.css`.

## 2. Architecture / stack
- `apps/web` — Next.js 16 (App Router, TS, Tailwind v4, shadcn/Base-UI). Routes under `src/app/(app)/`. Web is **API-backed** via `src/lib/api-client.ts` (Codex's) and `src/lib/page-engine-client.ts` (Claude's). Browser AI via `src/lib/puter-ai.ts`.
- `apps/api` — NestJS (`tsx watch`, port 4000). Global `{success,data,errors}` envelope, bearer guard (dev-permissive), Swagger at `/api/docs`. Modules in `src/modules/*`.
- `packages/types` — domain model (`index.ts` + `page-engine.ts`). `packages/mock` — fixtures + providers (`data.ts`, `providers.ts`, `page-engine.ts`).
- **Persistence**: Supabase Postgres via `apps/api/src/db/db.ts` (postgres.js, JSONB-per-entity). Page-engine store hydrates-on-boot + write-throughs.
- **AI**: Puter.js (browser, user-pays — primary) → DeepSeek (`src/llm/deepseek.ts`, server) → template. **DeepSeek key currently returns 402 (no balance)** so it falls back; Puter needs the user signed into Puter in-browser.

## 3. Running the app
```bash
cd /Users/abhijay/GEOSEO/apps/api && pnpm dev   # API :4000 (loads .env via dotenv)
cd /Users/abhijay/GEOSEO/apps/web && pnpm dev   # web :3001
```
Kill a stuck API (it runs as `tsx watch`, NOT `nest`): `for p in $(lsof -nP -iTCP:4000 -sTCP:LISTEN | awk 'NR>1{print $2}'); do kill -9 $p; done; pkill -9 -f tsx`. Then restart. A public ngrok tunnel was used for sharing (URL changes per run; not required).

## 4. ⚠️ Multi-agent — collision map
A **Codex** agent edits this repo concurrently (the user runs both). To avoid clobbering:
- **Claude owns (safe to edit):** page-engine — `apps/api/src/modules/page-engine.{service,controller}.ts`, `apps/api/src/db/*`, `apps/api/src/llm/*`, `apps/web/src/app/(app)/{pages,leads,onboarding}`, `apps/web/src/app/feeds`, `apps/web/src/components/{pages,leads,onboarding,feeds}`, `apps/web/src/lib/{page-engine-client,puter-ai}.ts`, brand `extract-from-site`.
- **Codex owns (edit with care / append-only):** `apps/api/src/app.module.ts`, `packages/types/src/index.ts`, `apps/web/src/lib/api-client.ts`, `apps/web/src/components/shell/nav-config.ts`, `components/system/app-feedback.tsx`, settings/content/outreach/brand UIs, jobs/content/settings/opportunities services.

## 5. What's BUILT (✅)
- **Web prototype**: Authority HQ, Backlink Opportunities (+outreach drawer), Performance (+drilldown), Alerts, Brand Memory, Content, Settings — all live, design-system'd, mobile nav.
- **Page Engine (full pipeline)**: `/pages` (KPI strip, Needs-Attention refresh recs, generated-pages list, **page editor** w/ meta+hero+CTA+sections+FAQs editing, **version history + rollback**, blueprint review, publish flow w/ **SEO gate**), Opportunity Backlog w/ **seed discovery**, `/leads` (dashboard, status, CSV export, CRM sync, delete), `/onboarding` (5-step wizard: scan→brand→publish→seed→discover), public **`/feeds/[slug]`** render (schema/canonical/lead form), **`sitemap.xml`** + **`llms.txt`**.
- **API**: opportunities (+discover/approve/reject), page-blueprints (+create/approve), pages (+generate/submit/approve/publish/refresh/PUT-edit/versions/rollback), leads (+export/sync/delete), public (pages/:slug, leads ingest w/ spam+dedupe+score), monitoring (recommendations/refresh, monitoring/pages/:id). All page-engine controllers use explicit `@Inject`.
- **Persistence**: Supabase live — verified data survives API restart (hydrate + write-through). `loadAll` tolerates double-encoded rows.
- **AI**: Puter (browser) → DeepSeek (server, 402) → template, three-tier fallback, verified content path produces valid JSON-LD.
- **Audit fixes**: auth fail-closed, validation hardening, api-client 4xx-surfacing + auth forwarding, mark-all-read, lint clean.

## 6. What's NEXT (open tasks, ordered)
DONE since last handoff: ✅ §9.2 Opportunity Explorer (`/research`), ✅ §9.1 page-engine Dashboard (`/dashboard`), ✅ dedupe + content-quality-check UI surfacing, ✅ §10.1 **audit log** (`GET /audit`, persisted to `pe_audit`, surfaced as Dashboard "Activity Log"; logs generate/edit/publish/approve/reject/defer/rollback/delete).
**All unblocked page-engine tasks are now complete.** Remaining is coordination- or credential-blocked:
1. **RBAC enforcement + tenant isolation** — audit log records `workspaceId`/`actor` (currently `ws-default`/`you`); real per-workspace isolation + role guard need **Clerk** (the dev-permissive guard + global-guard collision with Codex's routes make a mock version low-value).
2. **Migrate Codex's stores to Supabase** — brand/settings/jobs/alerts (reuse `db.ts` JSONB + hydrate/write-through). Coordinate (Codex's files).
3. **Blocked on credentials**: fund DeepSeek (or add OpenAI/Anthropic key) for server AI; **Clerk** auth; **BullMQ/Redis** real queue; **pgvector** embeddings for Brand Memory.

## 7. Git
**Nothing committed yet** — entire repo untracked, two agents editing. A checkpoint commit is overdue. Do NOT push without the user's explicit OK (and end commit messages with the required Co-Authored-By line). `.gitignore` covers `.env`.

## 8. Verify commands
```bash
cd /Users/abhijay/GEOSEO && pnpm typecheck            # must be clean
cd apps/web && pnpm lint                               # must be 0 errors/warnings
# API smoke:
curl -s localhost:4000/api/v1/pages | head -c 200
curl -s -X POST localhost:4000/api/v1/pages/generate -H 'content-type: application/json' -d '{"opportunityId":"kw-3"}'
# screenshot a route (verify visually): headless Chrome --screenshot to /tmp, then Read the png.
```

## 9. Gotchas (learned the hard way)
- **NestJS DI**: tsx/esbuild emits NO decorator metadata → EVERY class-typed constructor param needs explicit `@Inject(Class)` or routes 500.
- **API process**: runs as `tsx watch src/main.ts` — `pkill -f nest` won't kill it; use lsof on :4000 + `pkill -f tsx`.
- **Mock fallback**: every provider/client falls back to mock so the UI never hard-fails; `get()` surfaces 4xx but degrades on network/5xx.
- **Hydrated data can drift** — guard `.filter`/`.map`/map-lookups with `?? []` / `?? default` (see `pages-view.tsx`, `db.ts loadAll`).
- **Secrets**: only in `apps/api/.env`; user OK'd the shared DeepSeek key + Supabase password for prototyping but wants them rotated later.

## 10. Source of truth
Live task list = the Task tool (TaskList). Durable backlog = `docs/ROADMAP.md`. Per-session memory = `~/.claude/projects/-Users-abhijay/memory/project_geoseo.md` (auto-loads if same OS user).
