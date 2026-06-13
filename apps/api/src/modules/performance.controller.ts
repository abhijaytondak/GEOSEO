import { Controller, Get, Inject, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type { SeoDataProvider, TrackedPage } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { paginate } from "../common/pagination";

type SortKey = "rankChange" | "impressions" | "clicks" | "rank";

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
