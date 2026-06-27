import { Inject, Injectable, Logger } from "@nestjs/common";
import { settled, degradeLogger } from "../common/async";
import type {
  Alert,
  BacklinkProspect,
  BrandProfile,
  InternalLinkSuggestion,
  JobRun,
  SearchEntityType,
  SearchFacet,
  SearchInterpretation,
  SearchResponse,
  SearchResult,
  SearchResultAction,
  SearchSuggestion,
  SeoDataProvider,
  TrackedPage,
  WorkspaceSettings,
} from "@geoseo/types";
import type {
  AuditEntry,
  GeneratedPage,
  KeywordOpportunity,
  Lead,
} from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { PageEngineStore } from "./page-engine.service";
import { JobsStore } from "./jobs.service";
import { SettingsStore } from "./settings.service";
import { OpportunitiesStore } from "./opportunities.service";
import { ContentStore } from "./content.service";
import { BrandMemoryStore } from "./brand.service";

/** An indexable record: the result shell plus the text we score against. */
interface Indexed {
  result: Omit<SearchResult, "score">;
  title: string;
  haystack: string;
  /** Entity-importance boost added to text score (PRD §9). */
  boost: number;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Category-name synonyms appended to each item's haystack so searching by type
 *  ("alerts", "leads", "pages", "jobs"…) actually surfaces that type (PRD §8.1). */
const TYPE_KEYWORDS: Record<string, string> = {
  prospect: "prospect prospects backlink outreach",
  alert: "alert alerts notification",
  "tracked-page": "tracked page pages performance ranking rank traffic",
  "generated-page": "page pages generated content published",
  "page-opportunity": "opportunity opportunities keyword research",
  lead: "lead leads contact inbound",
  job: "job jobs task queue background",
  setting: "setting settings workspace integration team billing",
  brand: "brand memory profile",
  content: "content recommendation internal link refresh",
  audit: "audit activity log history",
};

const nav = (href: string, label = "Open"): SearchResultAction => ({
  id: `open:${href}`,
  label,
  kind: "navigate",
  href,
});

/**
 * Unified, demo-mode search (PRD §13: "Demo mode can build this index in memory
 * from current mock/API stores"). Aggregates every core entity into scored
 * SearchResults. Secrets (API keys, tokens, integration credentials) are never
 * indexed — only labels/status/metrics. Production swaps this for a tenant-scoped
 * repository-backed index behind the same controller.
 */
@Injectable()
export class SearchService {
  private readonly log = new Logger(SearchService.name);

  /** Per-tenant cache of the built search index. The index was rebuilt from every store on
   *  EVERY query (each keystroke in the palette) — O(all tenant objects) per request (perf
   *  audit P2). A short TTL collapses a burst of searches into one rebuild; results may be up
   *  to INDEX_TTL_MS stale (acceptable — search finds existing entities, not just-created ones). */
  private static readonly INDEX_TTL_MS = 30_000;
  private readonly indexCache = new Map<string, { at: number; index: Indexed[] }>();

  private async cachedIndex(tenantId: string): Promise<Indexed[]> {
    const hit = this.indexCache.get(tenantId);
    const now = Date.now();
    if (hit && now - hit.at < SearchService.INDEX_TTL_MS) return hit.index;
    const index = await this.index(tenantId);
    this.indexCache.set(tenantId, { at: now, index });
    return index;
  }

  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(PageEngineStore) private readonly pageEngine: PageEngineStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
    @Inject(SettingsStore) private readonly settings: SettingsStore,
    @Inject(OpportunitiesStore) private readonly prospects: OpportunitiesStore,
    @Inject(ContentStore) private readonly content: ContentStore,
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
  ) {}

  /** Curated zero-typing suggestions (PRD §10.4). */
  private suggestions(): SearchSuggestion[] {
    return [
      { id: "s1", label: "Critical alerts", query: "type:alert critical", reason: "Needs attention" },
      { id: "s2", label: "Pages ready to publish", query: "type:generated-page approved", reason: "Approved drafts" },
      { id: "s3", label: "High-authority prospects", query: "type:prospect da>70", reason: "DA over 70" },
      { id: "s4", label: "Failed jobs", query: "type:job failed", reason: "Retry candidates" },
      { id: "s5", label: "Pages needing refresh", query: "type:generated-page needs-refresh", reason: "Content decay" },
    ];
  }

  /** Lightweight query interpreter: pulls out `type:x` scope and `da>NN`/`rank>NN`
   *  numeric filters; everything else is free-text terms (PRD §8.2). */
  interpret(raw: string): { interp: SearchInterpretation; scope?: SearchEntityType; minDa?: number } {
    const filters: SearchInterpretation["filters"] = [];
    let scope: SearchEntityType | undefined;
    let minDa: number | undefined;
    const terms: string[] = [];
    for (const tok of raw.trim().split(/\s+/).filter(Boolean)) {
      const typeM = /^type:([a-z-]+)$/i.exec(tok);
      const daM = /^da>(\d+)$/i.exec(tok);
      if (typeM) {
        scope = typeM[1].toLowerCase() as SearchEntityType;
        filters.push({ key: "type", operator: "=", value: typeM[1].toLowerCase() });
      } else if (daM) {
        minDa = Number(daM[1]);
        filters.push({ key: "da", operator: ">", value: minDa });
      } else {
        terms.push(norm(tok));
      }
    }
    return { interp: { raw, terms, filters }, scope, minDa };
  }

  private async index(tenantId: string): Promise<Indexed[]> {
    // Per-provider degradation (allSettled): one failed store yields its slice of the
    // index empty rather than 500-ing global search.
    const [prospectsR, alertsR, trackedPagesR, brandProfileR] = await Promise.allSettled([
      this.seo.getProspects(),
      this.seo.getAlerts(),
      this.seo.getTrackedPages(),
      this.brand.getBrandProfile(),
    ]);
    const warn = degradeLogger(this.log, "search index");
    const prospectsBase = settled(prospectsR, [], warn("prospects"));
    const alerts = settled(alertsR, [], warn("alerts"));
    const trackedPages = settled(trackedPagesR, [], warn("tracked-pages"));
    const brandProfile = settled<BrandProfile, BrandProfile | null>(brandProfileR, null, warn("brand-profile"));
    const prospects = this.prospects.list(prospectsBase);
    const items: Indexed[] = [];

    // Backlink prospects (§7.1)
    for (const p of prospects as BacklinkProspect[]) {
      const email = p.contactEmail;
      const actions: SearchResultAction[] = [nav("/opportunities", "Open outreach")];
      if (email) actions.push({ id: `copy:${p.id}`, label: "Copy email", kind: "copy", copyValue: email });
      items.push({
        title: p.domain,
        haystack: norm([p.domain, p.url, p.industry, p.tags.join(" "), p.status, p.rationale, email].join(" ")),
        boost: p.impactScore >= 85 ? 0.22 : p.impactScore >= 70 ? 0.12 : 0,
        result: {
          id: `prospect:${p.id}`,
          type: "prospect",
          title: p.domain,
          subtitle: `Backlink prospect · ${p.industry}`,
          status: p.status,
          badges: p.tags.slice(0, 3),
          metrics: [
            { label: "DA", value: p.domainAuthority },
            { label: "Impact", value: p.impactScore },
          ],
          icon: "Link2",
          href: "/opportunities",
          updatedAt: p.lastInteraction,
          actions,
        },
      });
    }

    // Alerts (§7.4)
    for (const a of alerts as Alert[]) {
      const boost = a.severity === "critical" ? 0.28 : a.severity === "warning" ? 0.12 : 0;
      items.push({
        title: a.title,
        haystack: norm([a.title, a.description, a.type, a.severity, a.metric ?? ""].join(" ")),
        boost,
        result: {
          id: `alert:${a.id}`,
          type: "alert",
          title: a.title,
          subtitle: `Alert · ${a.type}`,
          excerpt: a.description,
          status: a.resolved ? "resolved" : a.read ? "read" : a.severity,
          badges: [a.severity],
          metrics: a.metric ? [{ label: "", value: a.metric }] : undefined,
          icon: "AlertTriangle",
          href: a.recommendedAction?.href ?? "/alerts",
          updatedAt: a.createdAt,
          actions: [nav(a.recommendedAction?.href ?? "/alerts", a.recommendedAction?.label ?? "Open")],
        },
      });
    }

    // Tracked pages (§7.3)
    for (const t of trackedPages as TrackedPage[]) {
      items.push({
        title: t.title,
        haystack: norm([t.title, t.path].join(" ")),
        boost: t.currentRank > t.prevRank ? 0.1 : 0, // dropped rank → surface it
        result: {
          id: `tracked:${t.id}`,
          type: "tracked-page",
          title: t.title,
          subtitle: t.path,
          status: `#${t.currentRank}`,
          metrics: [
            { label: "Impr.", value: t.impressions },
            { label: "Clicks", value: t.clicks },
          ],
          icon: "LineChart",
          href: "/performance",
          actions: [nav("/performance", "Open drilldown")],
        },
      });
    }

    // Generated pages (§7.9)
    for (const g of this.pageEngine.listPages(tenantId) as GeneratedPage[]) {
      const seoPass = (g.seoChecks ?? []).filter((c) => c.pass).length;
      const seoTotal = (g.seoChecks ?? []).length;
      const boost = g.status === "needs-refresh" || g.status === "in-review" ? 0.16 : g.status === "approved" ? 0.12 : 0;
      items.push({
        title: g.title,
        haystack: norm([g.title, g.slug, g.status, g.metaTitle, g.targetKeywords.join(" ")].join(" ")),
        boost,
        result: {
          id: `page:${g.id}`,
          type: "generated-page",
          title: g.title,
          subtitle: `/${g.slug}`,
          status: g.status,
          metrics: [{ label: "SEO", value: `${seoPass}/${seoTotal}` }],
          icon: "FileText",
          href: g.publishedUrl ? `/feeds/${g.slug}` : "/pages",
          updatedAt: g.updatedAt,
          actions: [nav(g.publishedUrl ? `/feeds/${g.slug}` : "/pages", g.publishedUrl ? "View live" : "Open editor")],
        },
      });
    }

    // Page-engine opportunities (§7.8)
    for (const o of this.pageEngine.listOpportunities(tenantId) as KeywordOpportunity[]) {
      items.push({
        title: o.query,
        haystack: norm([o.query, o.clusterLabel, o.intent, o.status, o.evidence].join(" ")),
        boost: o.status === "new" ? 0.08 : 0,
        result: {
          id: `opp:${o.id}`,
          type: "page-opportunity",
          title: o.query,
          subtitle: `Opportunity · ${o.intent} · ${o.clusterLabel}`,
          status: o.status,
          metrics: [
            { label: "Vol", value: o.volume },
            { label: "Diff", value: o.difficulty },
          ],
          icon: "Telescope",
          href: "/research",
          updatedAt: o.createdAt,
          actions: [nav("/research", "Open explorer")],
        },
      });
    }

    // Leads (§7.10)
    for (const l of this.pageEngine.listLeads(tenantId) as Lead[]) {
      items.push({
        title: l.name,
        haystack: norm([l.name, l.email, l.company, l.pageTitle, l.status, l.spamStatus].join(" ")),
        boost: l.spamStatus === "clean" && l.score >= 75 ? 0.14 : 0,
        result: {
          id: `lead:${l.id}`,
          type: "lead",
          title: l.name,
          subtitle: `Lead · ${l.company || l.email}`,
          status: l.status,
          badges: l.spamStatus !== "clean" ? [l.spamStatus] : undefined,
          metrics: [{ label: "Score", value: l.score }],
          icon: "UserRound",
          href: "/leads",
          updatedAt: l.createdAt,
          actions: [nav("/leads", "Open lead"), { id: `copy:${l.id}`, label: "Copy email", kind: "copy", copyValue: l.email }],
        },
      });
    }

    // Jobs (§7.11)
    for (const j of this.jobs.list() as JobRun[]) {
      const boost = j.status === "failed" ? 0.12 : j.status === "running" ? 0.06 : 0;
      items.push({
        title: j.title,
        haystack: norm([j.title, j.description, j.type, j.status].join(" ")),
        boost,
        result: {
          id: `job:${j.id}`,
          type: "job",
          title: j.title,
          subtitle: `Job · ${j.type}`,
          excerpt: j.result ?? j.error,
          status: j.status,
          metrics: [{ label: "", value: `${j.progress}%` }],
          icon: "Activity",
          href: "/",
          updatedAt: j.createdAt,
          actions: [nav("/", "Open job center")],
        },
      });
    }

    // Settings — labels/status only, NEVER secrets (§15)
    const s: WorkspaceSettings = this.settings.get();
    const settingRows: Array<{ id: string; title: string; subtitle: string }> = [
      { id: "profile", title: "Workspace profile", subtitle: `${s.profile.workspaceName} · ${s.profile.domain}` },
      { id: "billing", title: "Billing & plan", subtitle: `${s.billing.plan} · ${s.billing.status}` },
      { id: "publishing", title: "Publishing settings", subtitle: "Approval gate, sitemap, llms.txt" },
      ...s.integrations.map((i) => ({ id: `integration-${i.id}`, title: `${i.label} integration`, subtitle: `${i.description} · ${i.status}` })),
      ...s.team.map((m) => ({ id: `team-${m.id}`, title: m.name, subtitle: `Team · ${m.role} · ${m.email}` })),
    ];
    for (const row of settingRows) {
      items.push({
        title: row.title,
        haystack: norm([row.title, row.subtitle].join(" ")),
        boost: 0,
        result: {
          id: `setting:${row.id}`,
          type: "setting",
          title: row.title,
          subtitle: row.subtitle,
          icon: "Settings",
          href: "/settings",
          actions: [nav("/settings", "Open settings")],
        },
      });
    }

    // Brand memory (§7.6) — skipped entirely if the brand provider was unavailable.
    if (brandProfile) {
      const b: BrandProfile = brandProfile;
      items.push({
        title: b.company,
        haystack: norm([b.company, b.domain, b.industry, (b.topics ?? []).join(" "), (b.keywords ?? []).join(" "), b.audience ?? ""].join(" ")),
        boost: 0,
        result: {
          id: "brand:current",
          type: "brand",
          title: `${b.company} — Brand Memory`,
          subtitle: `${b.domain} · ${b.industry}`,
          badges: (b.topics ?? []).slice(0, 3),
          icon: "Sparkles",
          href: "/brand",
          actions: [nav("/brand", "Open Brand Memory")],
        },
      });
    }

    // Content recommendations (§7.5) — internal-link suggestions from real published pages
    const publishedPages = this.pageEngine.listPages(tenantId).filter((p) => p.status === "published");
    for (const c of this.content.suggestions(publishedPages) as InternalLinkSuggestion[]) {
      items.push({
        title: c.fromTitle,
        haystack: norm([c.fromTitle, c.toPath, c.status].join(" ")),
        boost: c.status === "suggested" ? 0.06 : 0,
        result: {
          id: `content:${c.id}`,
          type: "content",
          title: c.fromTitle,
          subtitle: `Internal link → ${c.toPath}`,
          status: c.status,
          icon: "Workflow",
          href: "/content",
          actions: [nav("/content", "Open recommendations")],
        },
      });
    }

    // Audit / activity (§7.12)
    for (const e of this.pageEngine.listAudit(tenantId, 60) as AuditEntry[]) {
      items.push({
        title: `${e.action} ${e.entity}`,
        haystack: norm([e.action, e.entity, e.entityId, e.actor].join(" ")),
        boost: 0,
        result: {
          id: `audit:${e.id}`,
          type: "audit",
          title: `${e.actor} — ${e.action} ${e.entity}`,
          subtitle: e.entityId,
          icon: "History",
          href: "/dashboard",
          updatedAt: e.at,
          actions: [nav("/dashboard", "Open dashboard")],
        },
      });
    }

    // Append category synonyms so type-name queries surface the right entities.
    for (const it of items) {
      const kw = TYPE_KEYWORDS[it.result.type];
      if (kw) it.haystack = `${it.haystack} ${kw}`;
    }
    return items;
  }

  private scoreText(title: string, haystack: string, terms: string[]): number {
    if (terms.length === 0) return 0;
    const t = norm(title);
    const joined = terms.join(" ");
    if (t === joined) return 1;
    if (t.startsWith(joined)) return 0.82;
    const everyTermInHaystack = terms.every((term) => haystack.includes(term));
    if (!everyTermInHaystack) {
      // partial: proportion of terms found (allows fuzzy-ish recall)
      const found = terms.filter((term) => haystack.includes(term)).length;
      return found === 0 ? 0 : 0.2 * (found / terms.length);
    }
    let score = 0.5;
    if (t.includes(joined)) score += 0.2;
    const inTitle = terms.filter((term) => t.includes(term)).length;
    score += Math.min(0.2, inTitle * 0.1);
    return Math.min(0.95, score);
  }

  async search(tenantId: string, rawQuery: string, opts: { type?: string; limit: number; offset: number }): Promise<SearchResponse> {
    const { interp, scope, minDa } = this.interpret(rawQuery);
    const explicitScope = (opts.type as SearchEntityType | undefined) ?? scope;

    // Empty query → suggestions only (the palette shows commands/recents itself).
    if (interp.terms.length === 0 && minDa === undefined && !explicitScope) {
      return { results: [], total: 0, facets: [], suggestions: this.suggestions(), interpretedQuery: interp };
    }

    const index = await this.cachedIndex(tenantId);
    const scored = index
      .filter((it) => (explicitScope ? it.result.type === explicitScope : true))
      .filter((it) => {
        if (minDa === undefined) return true;
        if (it.result.type !== "prospect") return false;
        const da = it.result.metrics?.find((m) => m.label === "DA")?.value;
        return typeof da === "number" && da >= minDa;
      })
      .map((it) => {
        // No free-text terms (pure scope/filter query) → flat base relevance.
        const textScore = interp.terms.length === 0 ? 0.4 : this.scoreText(it.title, it.haystack, interp.terms);
        return { result: it.result, textScore, boost: it.boost };
      })
      // Entity boost only RANKS genuine text matches — it must never qualify a
      // non-matching item (else every critical alert / high-impact prospect would
      // surface for any query).
      .filter((x) => x.textScore > 0)
      .map((x) => ({ ...x.result, score: Number((x.textScore * 0.6 + x.boost).toFixed(4)) }) as SearchResult)
      .sort((a, b) => b.score - a.score);

    const facetMap = new Map<SearchEntityType, number>();
    for (const r of scored) facetMap.set(r.type, (facetMap.get(r.type) ?? 0) + 1);
    const facets: SearchFacet[] = [...facetMap.entries()].map(([type, count]) => ({ type, label: type, count }));

    const page = scored.slice(opts.offset, opts.offset + opts.limit);
    return { results: page, total: scored.length, facets, suggestions: [], interpretedQuery: interp };
  }
}
