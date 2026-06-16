import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { dbPing } from "../db/db";
import { resolveMode } from "../common/mode";
import { CmsPublishStore } from "./cms-publish.service";
import { GscService } from "./gsc.service";
import { CrmSyncStore } from "./crm-sync.service";
import { KeywordResearchService } from "./keyword-research.service";
import { ImageGenStore } from "./image-gen.service";
import { CompetitorAnalysisService } from "./competitor-analysis.service";
import { BillingStore } from "./billing.service";

/**
 * Unified provider status (No-Dummy-Data PRD §8.1 / §7.8 `GET /integrations/health`).
 * Every provider-backed UI reads from this single shape instead of guessing from
 * saved local flags. Read-only; never throws — a probe failure becomes an `error`
 * status row, not a 500. The only async probe is the DB (`select 1`).
 */
export type ProviderStatus =
  | { provider: string; category: string; label: string; status: "connected"; lastCheckedAt: string }
  | { provider: string; category: string; label: string; status: "not_configured"; setupHint?: string }
  | { provider: string; category: string; label: string; status: "error"; message: string; lastCheckedAt: string }
  | { provider: string; category: string; label: string; status: "disabled"; reason: string };

const connected = (provider: string, category: string, label: string, now: string): ProviderStatus => ({
  provider,
  category,
  label,
  status: "connected",
  lastCheckedAt: now,
});
const notConfigured = (provider: string, category: string, label: string, setupHint: string): ProviderStatus => ({
  provider,
  category,
  label,
  status: "not_configured",
  setupHint,
});

@ApiTags("integrations")
@Controller("integrations")
export class ProviderHealthController {
  constructor(
    @Inject(CmsPublishStore) private readonly cms: CmsPublishStore,
    @Inject(GscService) private readonly gsc: GscService,
    @Inject(CrmSyncStore) private readonly crm: CrmSyncStore,
    @Inject(KeywordResearchService) private readonly keywords: KeywordResearchService,
    @Inject(ImageGenStore) private readonly images: ImageGenStore,
    @Inject(CompetitorAnalysisService) private readonly competitors: CompetitorAnalysisService,
    @Inject(BillingStore) private readonly billing: BillingStore,
  ) {}

  @Get("health")
  async health() {
    const now = new Date().toISOString();
    const providers: ProviderStatus[] = [];

    // --- Auth (Clerk) ---
    providers.push(
      process.env.CLERK_SECRET_KEY
        ? connected("clerk", "auth", "Clerk", now)
        : notConfigured("clerk", "auth", "Clerk", "Set CLERK_SECRET_KEY + NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY."),
    );

    // --- Database (real probe) ---
    if (!process.env.DATABASE_URL) {
      providers.push(notConfigured("postgres", "database", "Supabase Postgres", "Set DATABASE_URL."));
    } else {
      const ping = await dbPing();
      providers.push(
        ping.reachable
          ? connected("postgres", "database", "Supabase Postgres", now)
          : { provider: "postgres", category: "database", label: "Supabase Postgres", status: "error", message: ping.error ?? "Database unreachable.", lastCheckedAt: now },
      );
    }

    // --- Queue (Redis/BullMQ) ---
    providers.push(
      process.env.REDIS_URL
        ? connected("redis", "queue", "Upstash Redis / BullMQ", now)
        : notConfigured("redis", "queue", "Upstash Redis / BullMQ", "Set REDIS_URL — jobs run in-memory without it."),
    );

    // --- Keyword research (DataForSEO) ---
    providers.push(
      this.keywords.configured
        ? connected("dataforseo", "research", "DataForSEO", now)
        : notConfigured("dataforseo", "research", "DataForSEO", "Set DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD."),
    );

    // --- Competitor SERP ---
    providers.push(
      this.competitors.configured
        ? connected(this.competitors.source, "serp", "Competitor SERP", now)
        : notConfigured("brave", "serp", "Competitor SERP", "Set BRAVE_SEARCH_API_KEY (else keyless DuckDuckGo / heuristic)."),
    );

    // --- Analytics (GSC) ---
    providers.push(
      this.gsc.configured
        ? connected("gsc", "analytics", "Google Search Console", now)
        : notConfigured("gsc", "analytics", "Google Search Console", "Set GSC_SERVICE_ACCOUNT_JSON + GSC_SITE_URL."),
    );

    // --- LLM (content generation) ---
    providers.push(
      process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
        ? connected("llm", "content", "LLM (content generation)", now)
        : notConfigured("llm", "content", "LLM (content generation)", "Set DEEPSEEK_API_KEY (or OPENAI/ANTHROPIC) — Puter browser AI is the fallback."),
    );

    // --- Image generation ---
    providers.push(
      this.images.configured
        ? connected("image-generation", "media", "Image generation", now)
        : notConfigured("image-generation", "media", "Image generation", "Set IMAGE_GEN_API_KEY — placeholders are used otherwise."),
    );

    // --- CMS publishing ---
    providers.push(
      this.cms.configured
        ? connected(this.cms.provider, "publishing", "CMS publishing", now)
        : notConfigured("cms", "publishing", "CMS publishing", "Connect WordPress / Webflow / Shopify, or use managed /feeds."),
    );

    // --- CRM (HubSpot) ---
    providers.push(
      this.crm.configured
        ? connected(this.crm.provider, "crm", "HubSpot CRM", now)
        : notConfigured("hubspot", "crm", "HubSpot CRM", "Set HUBSPOT_ACCESS_TOKEN."),
    );

    // --- Billing (Stripe) ---
    providers.push(
      this.billing.configured
        ? connected("stripe", "billing", "Stripe", now)
        : notConfigured("stripe", "billing", "Stripe", "Set STRIPE_SECRET_KEY + plan price ids."),
    );

    // --- Error monitoring (Sentry) ---
    providers.push(
      process.env.SENTRY_DSN
        ? connected("sentry", "observability", "Sentry", now)
        : notConfigured("sentry", "observability", "Sentry", "Set SENTRY_DSN."),
    );

    // --- Product analytics (PostHog) ---
    providers.push(
      process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY
        ? connected("posthog", "observability", "PostHog", now)
        : notConfigured("posthog", "observability", "PostHog", "Set NEXT_PUBLIC_POSTHOG_KEY."),
    );

    const summary = {
      total: providers.length,
      connected: providers.filter((p) => p.status === "connected").length,
      notConfigured: providers.filter((p) => p.status === "not_configured").length,
      error: providers.filter((p) => p.status === "error").length,
      mode: resolveMode(),
    };
    return { providers, summary, checkedAt: now };
  }
}
