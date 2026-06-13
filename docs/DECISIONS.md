# Decisions Log

## 2026-06-13 — Persistence: Supabase is intentional (supersedes "mock-only")
**Decision:** GEOSEO's API **intentionally uses Supabase/Postgres persistence** (the `cx_*` + `pe_*` JSONB stores via `db.ts`/`DocStore`, RLS-enabled). This was explicitly directed by the operator across multiple sessions ("migrate Codex's stores to Supabase," the RLS hardening, "do Phase 2 persistence") and live keys are provisioned in `apps/api/.env`.

**Resolves:** the review's P0 ("code violates the mock-only prototype constraint"). The original `PRD-gushwork-platform.md` / early roadmap framing of "UI-prototype-first, mock-backed" is **superseded** — real persistence is now the intended direction. Mock remains the **automatic fallback** when `DATABASE_URL` is unset (`db.ts` returns `null` → pure in-memory), so the prototype still runs keyless/DB-less.

**Implication:** new work (BullMQ jobs, persistence-backed fixes) targets the persisted stores, not mock-only.

## 2026-06-13 — Auth: Clerk (web), keyless dev mode until keys claimed
Clerk wired into `apps/web` (`proxy.ts` + `<ClerkProvider>` + topbar controls). Runs keyless in dev; claim URL issued. Backend JWT verification in `BearerGuard` is a follow-on once `CLERK_SECRET_KEY` lands.

## 2026-06-13 — Queue: Upstash Redis provisioned
`REDIS_URL` (TLS) in `apps/api/.env`, connectivity verified. BullMQ activates-on-`REDIS_URL` (next step); falls back to in-memory job simulation when unset.
