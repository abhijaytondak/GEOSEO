import { Injectable, NotFoundException } from "@nestjs/common";
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

/** Per-tenant lead form configuration (Leads PRD Gap 11; P0-6) — `cx_lead_forms`. */
@Injectable()
export class LeadFormStore {
  private cache = new Map<string, FormState>();
  private db = new DocStore<FormState>("cx_lead_forms");

  private async state(tenantId: string): Promise<FormState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = await this.db.loadForTenant(tenantId);
    const s: FormState =
      loaded && loaded.forms && Object.keys(loaded.forms).length
        ? { forms: loaded.forms, seq: loaded.seq ?? 0 }
        : { forms: { [DEFAULT_FORM.id]: { ...DEFAULT_FORM } }, seq: 0 };
    this.cache.set(tenantId, s);
    return s;
  }
  private persist(tenantId: string, s: FormState) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async list(tenantId: string): Promise<LeadFormConfig[]> {
    return Object.values((await this.state(tenantId)).forms);
  }
  async get(tenantId: string, id: string): Promise<LeadFormConfig> {
    const f = (await this.state(tenantId)).forms[id];
    if (!f) throw new NotFoundException(`No lead form '${id}'`);
    return f;
  }

  async create(tenantId: string, input: Partial<LeadFormConfig> & { name: string }): Promise<LeadFormConfig> {
    const s = await this.state(tenantId);
    s.seq += 1;
    const form: LeadFormConfig = {
      ...DEFAULT_FORM,
      ...input,
      id: `form-${s.seq}`,
      workspaceId: tenantId,
      fields: input.fields?.length ? input.fields : DEFAULT_FORM.fields,
      spamProtection: { ...DEFAULT_FORM.spamProtection, ...(input.spamProtection ?? {}) },
    };
    s.forms[form.id] = form;
    this.persist(tenantId, s);
    return form;
  }

  async update(tenantId: string, id: string, patch: Partial<LeadFormConfig>): Promise<LeadFormConfig> {
    const s = await this.state(tenantId);
    const existing = s.forms[id];
    if (!existing) throw new NotFoundException(`No lead form '${id}'`);
    s.forms[id] = {
      ...existing,
      ...patch,
      id: existing.id,
      fields: patch.fields ?? existing.fields,
      spamProtection: { ...existing.spamProtection, ...(patch.spamProtection ?? {}) },
    };
    this.persist(tenantId, s);
    return s.forms[id];
  }

  async remove(tenantId: string, id: string): Promise<{ id: string; deleted: boolean }> {
    if (id === DEFAULT_FORM.id) throw new NotFoundException("The default form cannot be deleted");
    const s = await this.state(tenantId);
    if (!s.forms[id]) throw new NotFoundException(`No lead form '${id}'`);
    delete s.forms[id];
    this.persist(tenantId, s);
    return { id, deleted: true };
  }
}
