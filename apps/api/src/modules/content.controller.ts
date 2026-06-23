import { Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { validateBody } from "../common/validation";
import { IdListSchema, PageIdListSchema } from "../common/schemas";
import { ContentStore } from "./content.service";
import { JobsStore } from "./jobs.service";
import { PageEngineStore } from "./page-engine.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

@ApiTags("content")
@Controller("content")
export class ContentController {
  constructor(
    @Inject(ContentStore) private readonly content: ContentStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
    @Inject(PageEngineStore) private readonly pages: PageEngineStore,
  ) {}

  @Get("internal-links")
  internalLinks(@Req() req: TenantRequest) {
    const published = this.pages.listPages(resolveTenantId(req)).filter((p) => p.status === "published");
    return { suggestions: this.content.suggestions(published) };
  }

  @Post("rescan")
  rescan() {
    return { ...this.content.rescan(), job: this.jobs.create("content-rescan") };
  }

  @Post("refresh")
  refresh(@Body(validateBody(PageIdListSchema)) body: { pageIds?: string[] }) {
    const pageIds = Array.isArray(body?.pageIds) ? body.pageIds.filter(Boolean) : [];
    return { ...this.content.refresh(pageIds), job: this.jobs.create("content-refresh") };
  }

  @Post("internal-links/apply")
  applyInternalLinks(
    @Req() req: TenantRequest,
    @Body(validateBody(IdListSchema)) body: { ids?: string[] },
  ) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    const tenantId = resolveTenantId(req);
    const result = this.content.apply(ids);

    // Inject anchor tags into the source page's first section body for each applied suggestion.
    // Suggestion id format: `ilk-{fromPageId}-{toPageId}`.
    const injected: string[] = [];
    const published = this.pages.listPages(tenantId).filter((p) => p.status === "published");
    for (const id of ids) {
      const [, fromId, toId] = id.split("::"); // `ilk`, fromPageId, toPageId
      const from = published.find((p) => p.id === fromId);
      const to = published.find((p) => p.id === toId);
      if (!from || !to || !from.sections?.length) continue;
      const anchor = `<a href="${to.slug}">${to.metaTitle || to.title}</a>`;
      // Only inject once — skip if anchor already present.
      if (from.sections[0].body.includes(anchor)) continue;
      from.sections[0].body = `${from.sections[0].body} See also: ${anchor}.`;
      this.pages.updatePage(tenantId, from.id, { sections: from.sections });
      injected.push(fromId);
    }

    return { ...result, injected, job: this.jobs.create("internal-links") };
  }
}
