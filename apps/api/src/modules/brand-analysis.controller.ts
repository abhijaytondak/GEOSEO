import { Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BrandAnalysisStore } from "./brand-analysis.service";
import { AuditStore } from "./audit.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

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
}
