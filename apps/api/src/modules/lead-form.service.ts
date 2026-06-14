import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { LeadFormConfig } from "@geoseo/types";
import { DocStore } from "../db/db";

type FormState = { forms: Record<string, LeadFormConfig>; seq: number };

const DEFAULT_FORM: LeadFormConfig = {
  id: "form-default",
  workspaceId: "ws-default",
  name: "Workspace default form",
  fields: [
    { id: "name", type: "text", label: "Name", required: true },
    { id: "email", type: "email", label: "Work email", required: true },
    { id: "company", type: "text", label: "Company", required: false },
    { id: "message", type: "textarea", label: "How can we help?", required: false },
  ],
  ctaText: "Get in touch",
  thankYouTitle: "Thanks — we'll be in touch",
  thankYouBody: "A member of our team will reach out shortly.",
  consentRequired: false,
  spamProtection: { honeypot: true, rateLimit: true, disposableEmailCheck: true },
  styleMode: "match_page_theme",
};

/** Per-workspace / per-page lead form configuration (Leads PRD Gap 11) — `cx_lead_forms`. */
@Injectable()
export class LeadFormStore implements OnModuleInit {
  private forms: Record<string, LeadFormConfig> = { [DEFAULT_FORM.id]: { ...DEFAULT_FORM } };
  private seq = 0;
  private db = new DocStore<FormState>("cx_lead_forms");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.forms = loaded.forms && Object.keys(loaded.forms).length ? loaded.forms : { [DEFAULT_FORM.id]: { ...DEFAULT_FORM } };
      this.seq = loaded.seq ?? 0;
    });
  }

  private snapshot(): FormState {
    return { forms: this.forms, seq: this.seq };
  }

  list(): LeadFormConfig[] {
    return Object.values(this.forms);
  }
  get(id: string): LeadFormConfig {
    const f = this.forms[id];
    if (!f) throw new NotFoundException(`No lead form '${id}'`);
    return f;
  }

  create(input: Partial<LeadFormConfig> & { name: string }): LeadFormConfig {
    this.seq += 1;
    const form: LeadFormConfig = {
      ...DEFAULT_FORM,
      ...input,
      id: `form-${this.seq}`,
      workspaceId: "ws-default",
      fields: input.fields?.length ? input.fields : DEFAULT_FORM.fields,
      spamProtection: { ...DEFAULT_FORM.spamProtection, ...(input.spamProtection ?? {}) },
    };
    this.forms[form.id] = form;
    this.db.save(this.snapshot());
    return form;
  }

  update(id: string, patch: Partial<LeadFormConfig>): LeadFormConfig {
    const existing = this.get(id);
    this.forms[id] = {
      ...existing,
      ...patch,
      id: existing.id,
      fields: patch.fields ?? existing.fields,
      spamProtection: { ...existing.spamProtection, ...(patch.spamProtection ?? {}) },
    };
    this.db.save(this.snapshot());
    return this.forms[id];
  }

  remove(id: string): { id: string; deleted: boolean } {
    if (id === DEFAULT_FORM.id) throw new NotFoundException("The default form cannot be deleted");
    if (!this.forms[id]) throw new NotFoundException(`No lead form '${id}'`);
    delete this.forms[id];
    this.db.save(this.snapshot());
    return { id, deleted: true };
  }
}
