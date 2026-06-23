# API Audit Repairs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the confirmed compile, billing-webhook, queue-durability, and audit-runner failures found during the full GEOSEO API audit.

**Architecture:** Keep the existing NestJS/Next.js boundaries. Add focused regression tests around pure signature and queue-policy helpers, preserve user-owned UI edits, and make audit scripts targetable at an isolated API through `API_BASE`.

**Tech Stack:** TypeScript, NestJS 11, Next.js 16, Node test runner via `tsx --test`, BullMQ/Redis, Stripe webhook signatures.

---

### Task 1: Restore frontend compilation

**Files:**
- Modify: `apps/web/src/components/competitors/competitor-analysis-view.tsx`

- [ ] Replace the stale `INTENT_TONE` class lookup with the already-added `Badge` and `INTENT_VARIANT` mapping.
- [ ] Run `pnpm --filter @geoseo/web typecheck`; expect exit 0.
- [ ] Run `pnpm --filter @geoseo/web lint`; expect exit 0 with no warnings in this file.

### Task 2: Verify real Stripe webhook signatures

**Files:**
- Create: `apps/api/src/modules/billing-webhook.test.ts`
- Create: `apps/api/src/modules/billing-webhook.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/modules/billing.controller.ts`

- [ ] Write tests proving a valid raw-body `Stripe-Signature` is accepted and invalid/stale signatures are rejected.
- [ ] Run `pnpm --filter @geoseo/api exec tsx --test src/modules/billing-webhook.test.ts`; expect failure because the verifier does not exist.
- [ ] Implement constant-time HMAC-SHA256 verification with a five-minute timestamp tolerance.
- [ ] Enable Nest raw-body capture and make the controller reject invalid signatures with HTTP 400.
- [ ] Re-run the focused test; expect all tests to pass.

### Task 3: Fail closed when production Redis is unavailable

**Files:**
- Create: `apps/api/src/modules/queue-policy.test.ts`
- Create: `apps/api/src/modules/queue-policy.ts`
- Modify: `apps/api/src/modules/queue.service.ts`
- Modify: `apps/api/src/modules/jobs.service.ts`

- [ ] Write tests proving production requires an active durable queue unless `ALLOW_INMEMORY_QUEUE=true`, while demo mode may simulate jobs.
- [ ] Run the focused test and verify it fails before implementation.
- [ ] Add the queue policy helper, ping Redis before declaring BullMQ active, and reject new/retried jobs with HTTP 503 after a production queue outage.
- [ ] Prevent queued production jobs from being fake-completed after the circuit breaker trips.
- [ ] Re-run the focused tests; expect all tests to pass.

### Task 4: Make audits safe and bounded

**Files:**
- Modify: `apps/api/scripts/audit-get.mjs`
- Modify: `apps/api/scripts/smoke-live.mjs`
- Modify: `apps/api/scripts/audit-tenant-isolation.mjs`

- [ ] Make every audit honor `API_BASE` and add a per-request timeout that reports a failure rather than hanging forever.
- [ ] Run all three audits against an isolated demo API on port 4100; expect clean termination and explicit pass/fail totals.

### Task 5: Full verification

**Files:**
- Verify only.

- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Run `node apps/api/scripts/audit-no-mock-production.mjs`.
- [ ] Review `git diff --check` and `git diff --stat` to confirm only scoped changes were added.
