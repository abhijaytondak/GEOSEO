import { Controller, Get, Inject, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type { SeoDataProvider, TrackedPage, PerformanceOverview } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { paginate } from "../common/pagination";

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
  constructor(@Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider) {}

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
    const [ranks, impressions, signals, pages] = await Promise.all([
      this.seo.getRankSeries(),
      this.seo.getImpressionSeries(),
      this.seo.getAiVisibility(),
      this.seo.getTrackedPages(),
    ]);

    const window = ranks.slice(-days);
    const prior = ranks.slice(-days * 2, -days);
    const avg = (xs: { rank: number }[]) => (xs.length ? xs.reduce((a, p) => a + p.rank, 0) / xs.length : 0);
    const avgRank = round(avg(window), 1);
    const rankDelta = prior.length ? round(avg(prior) - avgRank, 1) : 0; // +ve ⇒ improved

    const impr = impressions.slice(-days);
    const totalImpr = impr.reduce((a, p) => a + p.impressions, 0);
    const totalClicks = impr.reduce((a, p) => a + p.clicks, 0);
    const ctr = totalImpr ? round((totalClicks / totalImpr) * 100, 1) : 0;

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
    };
  }

  @Get("domain-health")
  async domainHealth() {
    return this.seo.getDomainHealth();
  }

  @Get("rank-series")
  async rankSeries() {
    return { series: await this.seo.getRankSeries() };
  }

  @Get("impression-series")
  async impressionSeries() {
    return { series: await this.seo.getImpressionSeries() };
  }

  @Get("ai-visibility")
  async aiVisibility() {
    return { signals: await this.seo.getAiVisibility() };
  }

  @Get("pages/:id")
  async detail(@Param("id") id: string) {
    const page = (await this.seo.getTrackedPages()).find((p) => p.id === id);
    if (!page) throw new NotFoundException(`No tracked page '${id}'`);
    const aiVisibility = await this.seo.getAiVisibility();
    return { ...page, aiVisibility };
  }
}
