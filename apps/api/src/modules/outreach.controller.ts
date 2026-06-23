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
import { sendEmail } from "../common/email";

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
const OutreachSendSchema = {
  prospectId: v.string({ min: 1, max: 128 }),
  variant: v.optional(v.enumOf(VARIANTS)),
  to: v.optional(v.email({ max: 254 })),
};

@ApiTags("outreach")
@Controller("outreach")
export class OutreachController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(BRAND_SOURCE) private readonly brand: BrandProfileSource,
    @Inject(OUTREACH_DRAFTER) private readonly drafter: OutreachDrafter,
    @Inject(OutreachStore) private readonly store: OutreachStore,
    @Inject(OpportunitiesStore) private readonly opps: OpportunitiesStore,
  ) {}

  private async draftFor(prospectId: string): Promise<OutreachTemplate[]> {
    const base = await this.seo.getProspects();
    const prospect = this.opps.list(base).find((p) => p.id === prospectId);
    if (!prospect) throw new NotFoundException(`No backlink opportunity '${prospectId}'`);
    const brand = await this.brand.getBrandProfile();
    const variants = await this.drafter.draft(prospect, brand);
    return variants.map((v) => this.store.apply(v));
  }

  @Get("templates")
  @ApiQuery({ name: "prospectId", required: true })
  async list(@Query("prospectId") prospectId?: string) {
    if (!prospectId) throw new BadRequestException("prospectId is required");
    return { templates: await this.draftFor(prospectId) };
  }

  @Post("templates")
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

  @Put("templates/:id")
  update(@Param("id") id: string, @Body(validateBody(OutreachUpdateSchema)) body: { subject?: string; body?: string }) {
    const edit = this.store.saveEdit(id, { subject: body?.subject, body: body?.body });
    return { id, ...edit };
  }

  /**
   * Send an outreach email to a backlink prospect.
   * Drafts the email from the template, sends via Resend, marks prospect as "contacted".
   *
   * Required env vars: RESEND_API_KEY, EMAIL_FROM
   * Body: { prospectId, variant? (default: "cold"), to? (override contactEmail) }
   */
  @Post("send")
  async send(
    @Body(validateBody(OutreachSendSchema))
    body: { prospectId: string; variant?: Variant; to?: string },
  ) {
    if (!body?.prospectId) throw new BadRequestException("prospectId is required");

    const base = await this.seo.getProspects();
    const prospect = this.opps.list(base).find((p) => p.id === body.prospectId);
    if (!prospect) throw new NotFoundException(`No backlink opportunity '${body.prospectId}'`);

    const to = body.to ?? prospect.contactEmail;
    if (!to) throw new BadRequestException(`Prospect '${body.prospectId}' has no contactEmail — provide \`to\` in the request body`);

    const allTemplates = await this.draftFor(body.prospectId);
    const wantedVariant = body.variant ?? "cold";
    const template = allTemplates.find((t) => t.variantName.toLowerCase().includes(wantedVariant)) ?? allTemplates[0];
    if (!template) throw new NotFoundException(`No outreach template found for prospect '${body.prospectId}'`);

    // Send the email. sendEmail() no-ops when RESEND_API_KEY is absent and returns false.
    const sent = await sendEmail({
      to,
      subject: template.subject,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto">${template.body.replace(/\n/g, "<br>")}</div>`,
      replyTo: process.env.NOTIFY_EMAIL,
    });

    if (sent) {
      // Record in sent log + mark prospect as contacted.
      this.store.recordSent({
        prospectId: prospect.id,
        templateId: template.id,
        to,
        sentAt: new Date().toISOString(),
        subject: template.subject,
      });
      this.opps.update(prospect.id, { status: "contacted" }, base);
    }

    return {
      sent,
      prospectId: prospect.id,
      to,
      subject: template.subject,
      message: sent ? `Email sent to ${to}` : "RESEND_API_KEY not configured — email not sent",
    };
  }

  /** Outreach send history. */
  @Get("sent")
  sentLog() {
    return { sent: this.store.sentLog() };
  }
}
