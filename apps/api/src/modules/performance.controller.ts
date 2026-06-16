import { Controller, Get, Inject, Logger, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type { SeoDataProvider, TrackedPage, PerformanceOverview } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { paginate } from "../common/pagination";
import { settled, degradeLogger } from "../common/async";
import { AiMentionStore } from "./ai-search.service";
import { GscService } from "./gsc.service";

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
  async overview(@Query("range") range = "8w"): Promise<PerformanceOverview> {
    const days = RANGE_DAYS[range] ?? RANGE_DAYS["8w"];
    // Degrade per-provider (allSettled) so one failure can't 500 the whole overview.
    const [ranksR, impressionsR, signalsR, pagesR] = await Promise.allSettled([
      this.seo.getRankSeries(),
      this.seo.getImpressionSeries(),
      Promise.resolve(this.mentions.visibility().signals), // real recorded citation checks (never the mock sample)
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
  aiVisibility() {
    // Real recorded citation checks (source: "tracked"), or an empty "none" set — never the mock sample.
    return this.mentions.visibility();
  }

  @Get("pages/:id")
  async detail(@Param("id") id: string) {
    const page = (await this.seo.getTrackedPages()).find((p) => p.id === id);
    if (!page) throw new NotFoundException(`No tracked page '${id}'`);
    const { signals: aiVisibility } = this.mentions.visibility();
    return { ...page, aiVisibility };
  }
}
