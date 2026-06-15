import {
  BadRequestException,
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
import { validateBody, v } from "../common/validation";
import { OutreachStore } from "./outreach.service";
import { OpportunitiesStore } from "./opportunities.service";

const VARIANTS = ["cold", "follow-up", "value-offer", "content-swap"] as const;
type Variant = (typeof VARIANTS)[number];

const OutreachCreateSchema = {
  prospectId: v.string({ min: 1, max: 128 }),
  variant: v.optional(v.enumOf(VARIANTS)),
};
const OutreachUpdateSchema = {
  subject: v.optional(v.string({ max: 400 })),
  body: v.optional(v.string({ max: 20000 })),
};

@ApiTags("outreach")
@Controller("outreach/templates")
export class OutreachController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(BRAND_SOURCE) private readonly brand: BrandProfileSource,
    @Inject(OUTREACH_DRAFTER) private readonly drafter: OutreachDrafter,
    @Inject(OutreachStore) private readonly store: OutreachStore,
    @Inject(OpportunitiesStore) private readonly opps: OpportunitiesStore,
  ) {}

  private async draftFor(prospectId: string): Promise<OutreachTemplate[]> {
    // Resolve through OpportunitiesStore so newly *discovered* prospects (which
    // live there, not in the seo mock) also draft correctly.
    const base = await this.seo.getProspects();
    const prospect = this.opps.list(base).find((p) => p.id === prospectId);
    if (!prospect) throw new NotFoundException(`No backlink opportunity '${prospectId}'`);
    const brand = await this.brand.getBrandProfile();
    const variants = await this.drafter.draft(prospect, brand);
    return variants.map((v) => this.store.apply(v));
  }

  @Get()
  @ApiQuery({ name: "prospectId", required: true })
  async list(@Query("prospectId") prospectId?: string) {
    if (!prospectId) throw new BadRequestException("prospectId is required");
    return { templates: await this.draftFor(prospectId) };
  }

  @Post()
  async create(@Body(validateBody(OutreachCreateSchema)) body: { prospectId: string; variant?: Variant }) {
    if (!body?.prospectId) throw new BadRequestException("prospectId is required");
    const all = await this.draftFor(body.prospectId);
    if (body.variant) {
      const match = all.find((t) => t.variantName.toLowerCase() === body.variant);
      if (!match) throw new NotFoundException(`Unknown variant '${body.variant}'`);
      return match;
    }
    return { templates: all };
  }

  @Put(":id")
  update(@Param("id") id: string, @Body(validateBody(OutreachUpdateSchema)) body: { subject?: string; body?: string }) {
    const edit = this.store.saveEdit(id, { subject: body?.subject, body: body?.body });
    return { id, ...edit };
  }
}
