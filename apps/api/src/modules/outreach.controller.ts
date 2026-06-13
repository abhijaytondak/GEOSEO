import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type {
  BrandProfileSource,
  OutreachDrafter,
  OutreachTemplate,
  SeoDataProvider,
} from "@geoseo/types";
import { SEO_PROVIDER, BRAND_SOURCE, OUTREACH_DRAFTER } from "../seo/seo.module";
import { OutreachStore } from "./outreach.service";

const VARIANTS = ["cold", "follow-up", "value-offer", "content-swap"] as const;
type Variant = (typeof VARIANTS)[number];

@ApiTags("outreach")
@Controller("outreach/templates")
export class OutreachController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(BRAND_SOURCE) private readonly brand: BrandProfileSource,
    @Inject(OUTREACH_DRAFTER) private readonly drafter: OutreachDrafter,
    @Inject(OutreachStore) private readonly store: OutreachStore,
  ) {}

  private async draftFor(prospectId: string): Promise<OutreachTemplate[]> {
    const prospect = (await this.seo.getProspects()).find((p) => p.id === prospectId);
    if (!prospect) throw new NotFoundException(`No backlink opportunity '${prospectId}'`);
    const brand = await this.brand.getBrandProfile();
    const variants = await this.drafter.draft(prospect, brand);
    return variants.map((v) => this.store.apply(v));
  }

  @Get()
  @ApiQuery({ name: "prospectId", required: true })
  async list(@Query("prospectId") prospectId?: string) {
    if (!prospectId) throw new NotFoundException("prospectId is required");
    return { templates: await this.draftFor(prospectId) };
  }

  @Post()
  async create(@Body() body: { prospectId: string; variant?: Variant }) {
    if (!body?.prospectId) throw new NotFoundException("prospectId is required");
    const all = await this.draftFor(body.prospectId);
    if (body.variant) {
      const match = all.find((t) => t.variantName.toLowerCase() === body.variant);
      if (!match) throw new NotFoundException(`Unknown variant '${body.variant}'`);
      return match;
    }
    return { templates: all };
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: { subject?: string; body?: string }) {
    const edit = this.store.saveEdit(id, { subject: body?.subject, body: body?.body });
    return { id, ...edit };
  }
}
