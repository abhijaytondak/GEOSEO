import { BadRequestException, Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BrandAnalysisStore } from "./brand-analysis.service";
import { AuditStore } from "./audit.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";
import { analyzeCompetitorPage } from "../llm/competitor-page";

/**
 * Brand auto-analysis surface — powers the dashboard Scorecard and the Competitors view.
 * GET endpoints never block on a fresh run (they return the cached analysis or a
 * `status:"pending"` stub); `POST /run` triggers the network-bound analysis explicitly
 * (the onboarding wizard awaits it so the dashboard is warm on first load).
 */
@ApiTags("brand-analysis")
@Controller("brand-analysis")
export class BrandAnalysisController {
  constructor(
    @Inject(BrandAnalysisStore) private readonly analysis: BrandAnalysisStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  async latest(@Req() req: TenantRequest) {
    return { analysis: await this.analysis.latest(resolveTenantId(req)) };
  }

  @Post("run")
  async run(@Req() req: TenantRequest) {
    const analysis = await this.analysis.run(resolveTenantId(req), new Date().toISOString());
    this.audit.record("discover", "brand", analysis.domain || "brand-analysis");
    return { analysis };
  }

  @Get("competitors")
  async competitors(@Req() req: TenantRequest) {
    return { competitor: await this.analysis.competitors(resolveTenantId(req), new Date().toISOString()) };
  }

  /**
   * Page-level competitor analysis (Competitor Tracking #3): crawl a competitor
   * URL and surface its structure + exploitable vulnerabilities. Stateless
   * (non-persisted) on-demand analysis. SSRF/invalid URLs → 400.
   */
  @Post("competitor-page")
  async competitorPage(@Body() body: { url?: string }) {
    const url = body?.url?.trim();
    if (!url) throw new BadRequestException("url is required");
    try {
      return { page: await analyzeCompetitorPage(url) };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : "Could not analyse this URL");
    }
  }
}
