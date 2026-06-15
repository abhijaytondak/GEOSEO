import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { SeoDataProvider } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { validateBody } from "../common/validation";
import { IdListSchema, PageIdListSchema } from "../common/schemas";
import { ContentStore } from "./content.service";
import { JobsStore } from "./jobs.service";

@ApiTags("content")
@Controller("content")
export class ContentController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(ContentStore) private readonly content: ContentStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
  ) {}

  @Get("internal-links")
  async internalLinks() {
    return { suggestions: this.content.suggestions(await this.seo.getTrackedPages()) };
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
  applyInternalLinks(@Body(validateBody(IdListSchema)) body: { ids?: string[] }) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    return { ...this.content.apply(ids), job: this.jobs.create("internal-links") };
  }
}
