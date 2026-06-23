import { BadRequestException, Body, Controller, Get, Inject, NotFoundException, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BrandAnalysisStore } from "./brand-analysis.service";
import { AuditStore } from "./audit.service";
import { CompetitorAnalysisService } from "./competitor-analysis.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";
import { analyzeCompetitorPage } from "../llm/competitor-page";
import { assertSafeUrl } from "../common/ssrf";

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
    @Inject(CompetitorAnalysisService) private readonly competitorSvc: CompetitorAnalysisService,
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

  @Post("run-async")
  startRun(@Req() req: TenantRequest) {
    return { job: this.analysis.startRun(resolveTenantId(req), new Date().toISOString()) };
  }

  @Get("run-async/:jobId")
  runStatus(@Req() req: TenantRequest, @Param("jobId") jobId: string) {
    const job = this.analysis.getRunJob(resolveTenantId(req), jobId);
    if (!job) throw new NotFoundException(`Analysis job ${jobId} not found`);
    return { job };
  }

  @Get("competitors")
  async competitors(@Req() req: TenantRequest) {
    return { competitor: await this.analysis.competitors(resolveTenantId(req), new Date().toISOString()) };
  }

  /**
   * Per-page competitive breakdown: for every published page, how does it rank
   * vs. the declared competitor for its target keyword? Returns wins, losses,
   * and actionable suggestions. Always returns data (heuristic fallback when no
   * real rank data is available).
   */
  @Get("page-insights")
  pageInsights(@Req() req: TenantRequest) {
    const insights = this.competitorSvc.pageInsights(resolveTenantId(req));
    return { insights };
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

  /** Async variant for the UI — the LLM crawl (~25s) exceeds the BFF request budget,
   *  so start a job and poll. SSRF/invalid URL is rejected up-front (400). */
  @Post("competitor-page-async")
  async startCompetitorPage(@Body() body: { url?: string }) {
    const url = body?.url?.trim();
    if (!url) throw new BadRequestException("url is required");
    try {
      await assertSafeUrl(url); // reject SSRF/invalid before queueing
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : "Invalid URL");
    }
    return this.analysis.startCompetitorPage(url);
  }

  @Get("competitor-page-async/:jobId")
  competitorPageStatus(@Param("jobId") jobId: string) {
    const job = this.analysis.getCompetitorPageJob(jobId);
    if (!job) throw new NotFoundException(`Analysis job ${jobId} not found`);
    return job;
  }
}
