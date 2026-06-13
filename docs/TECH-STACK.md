# GEOSEO — Tech Stack

Multi-tenant AI SaaS (GEO/SEO analytics platform). MVP → enterprise-grade.
2026 best-practice stack balancing performance, scalability, cost, and DX.

## 1. AI / Model Orchestration
- **MVP:** API-based LLMs (Anthropic Claude / OpenAI). Custom orchestration service handling prompt templates, caching, fallback, streaming, billing limits.
- **Full:** provider routing (cost/perf), embeddings caching, optional private hosting.
- AI calls async; stream tokens; log prompts & outputs.
- *House note:* default to latest Claude (Opus/Sonnet) per global pref.

## 2. Frontend (Dashboard / UX)
- **Next.js (React) + TypeScript** — SSR, SEO, fast iteration.
- **Tailwind CSS + shadcn/ui** — design system. (Our `design/tokens.css` already drives this via CSS vars.)
- **Radix / Headless UI** — accessible primitives.
- **Recharts / Chart.js / D3** — visualizations.
- **Framer Motion** — animated KPI transitions, delight.
- Real-time data, actionable cards, guided insights.

## 3. Backend & APIs
Handles auth + multi-tenant data, business logic + AI workflows, background jobs/webhooks, integrations.
- **Option A — FastAPI (Python):** best for AI/ML-heavy logic, async, richest LLM ecosystem.
- **Option B — Node.js + TS (NestJS / Fastify):** unified language with frontend, strong async, good provider SDKs.
- Auth: **Clerk** or Auth.js · Billing: **Stripe** (subscription + metered) · Jobs: **Redis + BullMQ / RQ / Celery** · Cache: **Redis** · Logging: **Sentry + OpenTelemetry**.

## 4. Database & Search
- **PostgreSQL + pgvector** — relational + vector in one DB; multi-tenant (ACLs, joins, analytics).
- Stores: users/teams/tenants, page content & metadata, vector embeddings (RAG), SEO/perf logs.
- **Full:** optional **Pinecone / Weaviate** for large/multi-tenant vector workloads.
- **Redis** for session/result caching + queues.

## 5. DevOps & Infra
| Layer | MVP | Full |
|---|---|---|
| Frontend | Vercel | Vercel / Cloudflare |
| Backend | Railway / Render | AWS / GCP (Cloud Run / ECS / Fargate) |
| Database | Managed Postgres (Neon / Supabase) | Managed Postgres + vector DB |
| Storage | AWS S3 / Cloudflare R2 | — |
- CI/CD: GitHub Actions · feature flags · secret mgmt · autoscaling.

## 6. Security & Compliance
Multi-tenant data isolation · RBAC · encryption at rest for sensitive data · audit logging · GDPR/CCPA.

## 7. Analytics & Monitoring
PostHog / Plausible (product) · Sentry (errors/perf) · Prometheus + Grafana (infra) · billing + AI-cost tracking.

## MVP vs Full
| Layer | MVP | Full |
|---|---|---|
| Frontend | Next.js + Tailwind | + rich analytics UI |
| Backend | FastAPI / Node | modular microservices |
| Database | Postgres + pgvector | + Pinecone/Weaviate |
| AI | LLM API calls | model routing + caching |
| Search | SQL + vector | semantic search + RAG |
| Deploy | Vercel + managed DB | multi-cloud scaled |
| Monitoring | basic logs | full observability + tracing |

## Decisions (locked)
- **Backend language: Node.js + TypeScript** (chosen 2026-06-12 over FastAPI). One language across the stack, shared types with the Next.js frontend, single Turborepo monorepo, **BullMQ** for jobs. LLM work is API-based (not in-process ML), so Python's ML edge isn't needed.
  - Framework: **NestJS** recommended (DI, modules, guards → clean RBAC + multi-tenancy) over Fastify. Confirm at scaffold time.
- Proposed monorepo: `apps/web` (Next.js) · `apps/api` (NestJS) · `packages/{ui,db,types,config}` · `design/` (tokens, already present).
