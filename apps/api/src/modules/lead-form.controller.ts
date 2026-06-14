import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadFormStore } from "./lead-form.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";

const CreateSchema = {
  name: v.string({ min: 1, max: 120 }),
  pageId: v.optional(v.string({ max: 128 })),
  ctaText: v.optional(v.string({ max: 120 })),
  consentRequired: v.optional(v.boolean()),
  styleMode: v.optional(v.enumOf(["geoseo_default", "match_page_theme"] as const)),
};
const PatchSchema = {
  name: v.optional(v.string({ min: 1, max: 120 })),
  ctaText: v.optional(v.string({ max: 120 })),
  thankYouTitle: v.optional(v.string({ max: 160 })),
  thankYouBody: v.optional(v.string({ max: 600 })),
  consentRequired: v.optional(v.boolean()),
  consentText: v.optional(v.string({ max: 600 })),
  styleMode: v.optional(v.enumOf(["geoseo_default", "match_page_theme"] as const)),
  spamProtection: v.optional(v.object()),
  fields: v.optional(v.arrayOf(v.object())),
};

@ApiTags("leads")
@Controller("lead-forms")
export class LeadFormController {
  constructor(
    @Inject(LeadFormStore) private readonly store: LeadFormStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  list() {
    return { forms: this.store.list() };
  }

  @Post()
  create(@Body(validateBody(CreateSchema)) body: { name: string }) {
    const form = this.store.create(body);
    this.audit.record("create", "settings", form.id);
    return { form };
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return { form: this.store.get(id) };
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body(validateBody(PatchSchema)) body: Record<string, unknown>) {
    const form = this.store.update(id, body);
    this.audit.record("update", "settings", id);
    return { form };
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    const result = this.store.remove(id);
    this.audit.record("delete", "settings", id);
    return result;
  }

  /** Returns the resolved form for preview (style flags + fields). */
  @Post(":id/preview")
  preview(@Param("id") id: string) {
    return { form: this.store.get(id) };
  }
}
