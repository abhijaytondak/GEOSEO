import { Controller, Get, Header, Inject, Logger, NotFoundException, Param, Query, Req } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type { SeoDataProvider, TrackedPage, PerformanceOverview } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { paginate } from "../common/pagination";
import { settled, degradeLogger } from "../common/async";
import { AiMentionStore } from "./ai-search.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";
import { GscService } from "./gsc.service";
import { PageEngineStore } from "./page-engine.service";
import { SettingsStore } from "./settings.service";

type SortKey = "rankChange" | "impressions" | "clicks" | "rank";

/** Trailing-day window per UI range key (series are 90 daily points). */
const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "8w": 56, quarter: 90 };

function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function sortPages(pages: TrackedPage[], key?: SortKey): TrackedPage[] {
  const copy = [...pages];
  switch (key) {
    case "impressions":
      return copy.sort((a, b) => b.impressions - a.impressions);
    case "clicks":
      return copy.sort((a, b) => b.clicks - a.clicks);
    case "rank":
      return copy.sort((a, b) => a.currentRank - b.currentRank);
    case "rankChange":
      return copy.sort((a, b) => b.prevRank - b.currentRank - (a.prevRank - a.currentRank));
    default:
      return copy;
  }
}

@ApiTags("performance")
@Controller("performance")
export class PerformanceController {
  private readonly log = new Logger(PerformanceController.name);

  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(GscService) private readonly gsc: GscService,
    @Inject(AiMentionStore) private readonly mentions: AiMentionStore,
    @Inject(PageEngineStore) private readonly pageEngine: PageEngineStore,
    @Inject(SettingsStore) private readonly settings: SettingsStore,
  ) {}


  @Get("pages")
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "offset", required: false })
  @ApiQuery({ name: "sortBy", required: false, enum: ["rankChange", "impressions", "clicks", "rank"] })
  async pages(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("sortBy") sortBy?: SortKey,
  ) {
    const sorted = sortPages(await this.seo.getTrackedPages(), sortBy);
    // Full pages incl. per-page series so the dashboard drilldown has data.
    const { items, total, limit: l, offset: o } = paginate(sorted, limit, offset);
    return { pages: items, total, limit: l, offset: o };
  }

  @Get("overview")
  @ApiQuery({ name: "range", required: false, enum: ["7d", "30d", "8w", "quarter"] })
  async overview(@Req() req: TenantRequest, @Query("range") range = "8w"): Promise<PerformanceOverview> {
    const days = RANGE_DAYS[range] ?? RANGE_DAYS["8w"];
    // Degrade per-provider (allSettled) so one failure can't 500 the whole overview.
    const [ranksR, impressionsR, signalsR, pagesR] = await Promise.allSettled([
      this.seo.getRankSeries(),
      this.seo.getImpressionSeries(),
      this.mentions.visibility(resolveTenantId(req)).then((r) => r.signals), // real recorded checks (never the mock sample)
      this.seo.getTrackedPages(),
    ]);
    const warn = degradeLogger(this.log, "performance/overview");
    const ranks = settled(ranksR, [], warn("rank-series"));
    const impressions = settled(impressionsR, [], warn("impression-series"));
    const signals = settled(signalsR, [], warn("ai-visibility"));
    const pages = settled(pagesR, [], warn("tracked-pages"));

    const window = ranks.slice(-days);
    const prior = ranks.slice(-days * 2, -days);
    const avg = (xs: { rank: number }[]) => (xs.length ? xs.reduce((a, p) => a + p.rank, 0) / xs.length : 0);
    let avgRank = round(avg(window), 1);
    let rankDelta = prior.length ? round(avg(prior) - avgRank, 1) : 0; // +ve ⇒ improved

    const impr = impressions.slice(-days);
    let totalImpr = impr.reduce((a, p) => a + p.impressions, 0);
    let totalClicks = impr.reduce((a, p) => a + p.clicks, 0);
    let ctr = totalImpr ? round((totalClicks / totalImpr) * 100, 1) : 0;
    let source: "gsc" | "heuristic" = "heuristic";

    // Real Search Console data displaces the heuristic when GSC is connected.
    const gscRows = await this.gsc.searchAnalytics(range, "date");
    if (gscRows && gscRows.length) {
      source = "gsc";
      const sorted = [...gscRows].sort((a, b) => a.key.localeCompare(b.key));
      const posAvg = (xs: typeof sorted) => {
        const ps = xs.map((r) => r.position).filter((p) => p > 0);
        return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
      };
      avgRank = round(posAvg(sorted), 1);
      const half = Math.max(1, Math.floor(sorted.length / 2));
      const firstHalf = posAvg(sorted.slice(0, half));
      const secondHalf = posAvg(sorted.slice(half));
      rankDelta = firstHalf && secondHalf ? round(firstHalf - secondHalf, 1) : 0; // +ve ⇒ improved
      totalImpr = sorted.reduce((a, r) => a + r.impressions, 0);
      totalClicks = sorted.reduce((a, r) => a + r.clicks, 0);
      ctr = totalImpr ? round((totalClicks / totalImpr) * 100, 1) : 0;
    }

    const aiMentions = signals.reduce((a, s) => a + s.mentions, 0);
    const avgShareOfVoice = signals.length
      ? round(signals.reduce((a, s) => a + s.shareOfVoice, 0) / signals.length)
      : 0;

    const topMovers = [...pages]
      .map((p) => ({ id: p.id, title: p.title, path: p.path, rankDelta: p.prevRank - p.currentRank }))
      .sort((a, b) => Math.abs(b.rankDelta) - Math.abs(a.rankDelta))
      .slice(0, 5);

    return {
      range,
      days,
      avgRank,
      rankDelta,
      impressions: totalImpr,
      clicks: totalClicks,
      ctr,
      aiMentions,
      avgShareOfVoice,
      trackedPages: pages.length,
      topMovers,
      source,
    };
  }

  @Get("domain-health")
  async domainHealth() {
    return this.seo.getDomainHealth();
  }

  @Get("rank-series")
  async rankSeries() {
    // Real Search Console daily positions when GSC is connected; heuristic mock otherwise.
    const rows = await this.gsc.searchAnalytics("quarter", "date");
    if (rows && rows.length) {
      const series = [...rows].sort((a, b) => a.key.localeCompare(b.key)).map((r) => ({ date: r.key, rank: r.position }));
      return { series, source: "gsc" as const };
    }
    return { series: await this.seo.getRankSeries(), source: "heuristic" as const };
  }

  @Get("impression-series")
  async impressionSeries() {
    const rows = await this.gsc.searchAnalytics("quarter", "date");
    if (rows && rows.length) {
      const series = [...rows]
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((r) => ({ date: r.key, impressions: r.impressions, clicks: r.clicks }));
      return { series, source: "gsc" as const };
    }
    return { series: await this.seo.getImpressionSeries(), source: "heuristic" as const };
  }

  @Get("ai-visibility")
  aiVisibility(@Req() req: TenantRequest) {
    // Real recorded citation checks (source: "tracked"), or an empty "none" set — never the mock sample.
    return this.mentions.visibility(resolveTenantId(req));
  }

  @Get("pages/:id")
  async detail(@Req() req: TenantRequest, @Param("id") id: string) {
    const page = (await this.seo.getTrackedPages()).find((p) => p.id === id);
    if (!page) throw new NotFoundException(`No tracked page '${id}'`);
    const { signals: aiVisibility } = await this.mentions.visibility(resolveTenantId(req));
    return { ...page, aiVisibility };
  }

  /**
   * ROI overview — joins published pages with their lead conversion data.
   * Returns per-page: impressions, clicks, lead count, won count, avg lead score.
   * Sorted by lead count descending so top-converting pages rise to the top.
   */
  @Get("roi")
  async roi(@Req() req: TenantRequest) {
    const tenantId = resolveTenantId(req);
    const [trackedPages, allLeads] = await Promise.all([
      this.seo.getTrackedPages(),
      Promise.resolve(this.pageEngine.listLeads(tenantId)),
    ]);

    // Index leads by pageId (clean leads only for accuracy).
    const cleanLeads = allLeads.filter((l) => l.spamStatus === "clean");
    const leadsByPage = new Map<string, typeof cleanLeads>();
    for (const l of cleanLeads) {
      const arr = leadsByPage.get(l.pageId) ?? [];
      arr.push(l);
      leadsByPage.set(l.pageId, arr);
    }

    // Build ROI rows — tracked pages enriched with lead data.
    const rows = trackedPages.map((p) => {
      const pagLeads = leadsByPage.get(p.id) ?? [];
      const won = pagLeads.filter((l) => l.status === "won").length;
      const avgScore = pagLeads.length ? round(pagLeads.reduce((a, l) => a + l.score, 0) / pagLeads.length, 1) : 0;
      return {
        id: p.id,
        title: p.title,
        slug: p.path,
        currentRank: p.currentRank,
        impressions: p.impressions,
        clicks: p.clicks,
        leadCount: pagLeads.length,
        wonCount: won,
        avgLeadScore: avgScore,
        conversionRate: p.clicks > 0 ? round((pagLeads.length / p.clicks) * 100, 1) : 0,
      };
    });

    // Untracked published pages that have leads but no perf data yet.
    const trackedIds = new Set(trackedPages.map((p) => p.id));
    for (const [pageId, pagLeads] of leadsByPage) {
      if (trackedIds.has(pageId)) continue;
      const won = pagLeads.filter((l) => l.status === "won").length;
      const avgScore = round(pagLeads.reduce((a, l) => a + l.score, 0) / pagLeads.length, 1);
      const sample = pagLeads[0];
      rows.push({
        id: pageId,
        title: sample.pageTitle,
        slug: "",
        currentRank: 0,
        impressions: 0,
        clicks: 0,
        leadCount: pagLeads.length,
        wonCount: won,
        avgLeadScore: avgScore,
        conversionRate: 0,
      });
    }

    rows.sort((a, b) => b.leadCount - a.leadCount || b.impressions - a.impressions);

    const totals = {
      totalLeads: cleanLeads.length,
      totalWon: cleanLeads.filter((l) => l.status === "won").length,
      totalImpressions: trackedPages.reduce((a, p) => a + p.impressions, 0),
      totalClicks: trackedPages.reduce((a, p) => a + p.clicks, 0),
      pagesWithLeads: rows.filter((r) => r.leadCount > 0).length,
    };

    return { rows, totals };
  }

  /**
   * White-label PDF-ready HTML report.
   * Returns a fully self-contained HTML page styled for printing. The caller
   * (front-end or ops script) opens it in a new tab; the user hits Ctrl+P /
   * Save as PDF. No server-side headless Chrome needed.
   *
   * Customise: set REPORT_LOGO_URL and REPORT_BRAND_NAME env vars for white-labelling.
   * Query params:
   *   range  — 7d | 30d | 8w | quarter (default: 30d)
   *   title  — custom report title override
   */
  @Get("report")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header("Content-Disposition", "inline; filename=\"seo-report.html\"")
  async report(@Req() req: TenantRequest, @Query("range") range = "30d", @Query("title") titleOverride?: string) {
    const tenantId = resolveTenantId(req);
    const profile = this.settings.get().profile;
    const brandName = process.env.REPORT_BRAND_NAME ?? profile.workspaceName ?? "Citensity";
    const logoUrl = process.env.REPORT_LOGO_URL ?? "";
    const reportTitle = titleOverride ?? `SEO Performance Report`;
    const dateLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Collect data in parallel.
    const [overview, { rows, totals }] = await Promise.all([
      this.overview(req, range),
      this.roi(req),
    ]);

    const topRows = rows.slice(0, 10).map((r) =>
      `<tr><td>${esc(r.title)}</td><td>${r.currentRank > 0 ? `#${r.currentRank}` : "—"}</td><td>${r.impressions.toLocaleString()}</td><td>${r.clicks.toLocaleString()}</td><td>${r.leadCount}</td><td>${r.wonCount}</td><td>${r.conversionRate}%</td></tr>`
    ).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(reportTitle)} — ${esc(brandName)}</title>
<style>
  @page { margin: 20mm 18mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; line-height: 1.5; }
  .page { max-width: 860px; margin: 0 auto; padding: 40px 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0f172a; margin-bottom: 32px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { height: 36px; }
  .brand-name { font-size: 22px; font-weight: 800; color: #0f172a; }
  .report-meta { text-align: right; }
  .report-meta h1 { font-size: 16px; font-weight: 700; color: #0f172a; }
  .report-meta p { font-size: 12px; color: #64748b; margin-top: 2px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 32px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .kpi label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin-bottom: 6px; }
  .kpi .val { font-size: 24px; font-weight: 800; color: #0f172a; }
  .kpi .val.green { color: #16a34a; }
  .kpi .val.amber { color: #d97706; }
  h2 { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 12px; }
  thead th { background: #f8fafc; padding: 8px 10px; text-align: left; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  tbody td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
  @media print {
    .page { padding: 0; }
    .no-print { display: none; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="brand">
      ${logoUrl ? `<img src="${esc(logoUrl)}" alt="${esc(brandName)}">` : ""}
      <span class="brand-name">${esc(brandName)}</span>
    </div>
    <div class="report-meta">
      <h1>${esc(reportTitle)}</h1>
      <p>${esc(range.toUpperCase())} window · Generated ${esc(dateLabel)}</p>
    </div>
  </header>

  <div class="kpi-grid">
    <div class="kpi"><label>Avg rank</label><div class="val">${overview.avgRank > 0 ? `#${overview.avgRank}` : "—"}</div></div>
    <div class="kpi"><label>Impressions</label><div class="val">${totals.totalImpressions.toLocaleString()}</div></div>
    <div class="kpi"><label>Clicks</label><div class="val">${totals.totalClicks.toLocaleString()}</div></div>
    <div class="kpi"><label>Leads</label><div class="val green">${totals.totalLeads}</div></div>
    <div class="kpi"><label>Won</label><div class="val green">${totals.totalWon}</div></div>
  </div>

  <h2>Page Performance &amp; Conversion</h2>
  <table>
    <thead>
      <tr>
        <th style="width:35%">Page</th>
        <th>Rank</th>
        <th>Impressions</th>
        <th>Clicks</th>
        <th>Leads</th>
        <th>Won</th>
        <th>Conv %</th>
      </tr>
    </thead>
    <tbody>
      ${topRows || `<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:20px">No data yet — publish pages and capture leads to see conversion metrics.</td></tr>`}
    </tbody>
  </table>

  <div class="footer">
    <span>${esc(brandName)} · Citensity Platform</span>
    <span class="no-print"><button onclick="window.print()" style="background:#0f172a;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer">Save as PDF</button></span>
    <span>Page 1 of 1</span>
  </div>
</div>
</body>
</html>`;
  }
}

function esc(s: string | number): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
