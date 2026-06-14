import { Body, Controller, Get, Inject, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { SiteThemeProfile } from "@geoseo/types";
import { SiteThemeStore } from "./site-theme.service";
import { JobsStore } from "./jobs.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";

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

  @Get()
  list() {
    return { profiles: this.themes.list() };
  }

  /** SSRF-guarded site scan → heuristic draft theme profile (PRD §7.1, §19). */
  @Post("scan")
  async scan(@Body(validateBody(ScanSchema)) body: { url: string }) {
    const profile = await this.themes.scan(body.url);
    this.audit.record("create", "brand", profile.id);
    return { profile, job: this.jobs.create("settings-sync", `Theme scan: ${body.url}`) };
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return { profile: this.themes.get(id) };
  }

  @Put(":id")
  update(@Param("id") id: string, @Body(validateBody(UpdateThemeSchema)) body: Partial<SiteThemeProfile>) {
    const profile = this.themes.update(id, body);
    this.audit.record("update", "brand", id);
    return { profile };
  }

  @Post(":id/confirm")
  confirm(@Param("id") id: string) {
    const profile = this.themes.confirm(id);
    this.audit.record("approve", "brand", id);
    return { profile };
  }
}
