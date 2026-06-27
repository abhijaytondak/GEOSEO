import { Body, Controller, Get, Inject, Param, Post, Put, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { SiteThemeProfile } from "@geoseo/types";
import { SiteThemeStore, computeThemeFidelity, summarizeThemeProfile } from "./site-theme.service";
import { JobsStore } from "./jobs.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const ScanSchema = { url: v.string({ min: 3, max: 2048 }) };

const hex = v.string({ max: 64 });
const ColorsSchema = v.shape({
  background: v.optional(hex),
  foreground: v.optional(hex),
  primary: v.optional(hex),
  secondary: v.optional(hex),
  accent: v.optional(hex),
  muted: v.optional(hex),
  border: v.optional(hex),
});
const LayoutSchema = v.shape({
  maxWidth: v.optional(v.number({ min: 0, max: 10000 })),
  sectionSpacing: v.optional(v.number({ min: 0, max: 2000 })),
  gridGap: v.optional(v.number({ min: 0, max: 500 })),
  headerStyle: v.optional(v.enumOf(["centered", "split", "minimal", "editorial", "custom"] as const)),
  radius: v.optional(v.number({ min: 0, max: 200 })),
});
// Whitelisted, deeply-validated patch — strips unknown keys; nested colors/layout validated via v.shape.
const UpdateThemeSchema = {
  status: v.optional(v.enumOf(["draft", "confirmed", "needs-review"] as const)),
  colors: v.optional(ColorsSchema),
  layout: v.optional(LayoutSchema),
  typography: v.optional(v.object()),
  components: v.optional(v.object()),
  sourceUrls: v.optional(v.arrayOf(v.string({ max: 2048 }))),
};

@ApiTags("site-theme")
@Controller("site-theme")
export class SiteThemeController {
  constructor(
    @Inject(SiteThemeStore) private readonly themes: SiteThemeStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  /** List theme profiles as lightweight SUMMARIES — heavy `assets.sampleImages` and any
   *  base64 data: asset URIs are dropped so the list stays small (was ~66KB — perf audit
   *  P1). Full assets remain available via `GET /site-theme/:id`. List consumers (feeds,
   *  brand cards, theme editor) only use colors/typography/layout/status, never sampleImages. */
  @Get()
  async list(@Req() req: TenantRequest) {
    const profiles = await this.themes.list(resolveTenantId(req));
    return { profiles: profiles.map(summarizeThemeProfile) };
  }

  /** SSRF-guarded site scan → heuristic draft theme profile (PRD §7.1, §19). */
  @Post("scan")
  async scan(@Req() req: TenantRequest, @Body(validateBody(ScanSchema)) body: { url: string }) {
    const profile = await this.themes.scan(resolveTenantId(req), body.url);
    this.audit.record("create", "brand", profile.id);
    return { profile, job: this.jobs.create("settings-sync", `Theme scan: ${body.url}`) };
  }

  /** Theme-fidelity score for the active (latest confirmed) profile — for the page-list badge (PRD §13). */
  @Get("fidelity")
  async workspaceFidelity(@Req() req: TenantRequest) {
    const theme = await this.themes.latest(resolveTenantId(req));
    return { themeId: theme?.id ?? null, fidelity: computeThemeFidelity(theme) };
  }

  @Get(":id")
  async get(@Req() req: TenantRequest, @Param("id") id: string) {
    return { profile: await this.themes.get(resolveTenantId(req), id) };
  }

  /** Theme-fidelity score for a specific profile — how natively pages render to the site (PRD §13). */
  @Get(":id/fidelity")
  async fidelity(@Req() req: TenantRequest, @Param("id") id: string) {
    const theme = await this.themes.get(resolveTenantId(req), id);
    return { themeId: id, fidelity: computeThemeFidelity(theme) };
  }

  @Put(":id")
  async update(
    @Req() req: TenantRequest,
    @Param("id") id: string,
    @Body(validateBody(UpdateThemeSchema)) body: Partial<SiteThemeProfile>,
  ) {
    const profile = await this.themes.update(resolveTenantId(req), id, body);
    this.audit.record("update", "brand", id);
    return { profile };
  }

  @Post(":id/confirm")
  async confirm(@Req() req: TenantRequest, @Param("id") id: string) {
    const profile = await this.themes.confirm(resolveTenantId(req), id);
    this.audit.record("approve", "brand", id);
    return { profile };
  }
}
