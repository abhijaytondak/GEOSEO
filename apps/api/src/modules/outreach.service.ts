import { Injectable, OnModuleInit } from "@nestjs/common";
import type { OutreachTemplate } from "@geoseo/types";
import { DocStore } from "../db/db";
import { DEFAULT_TENANT_ID } from "../common/tenant";

type Edit = { subject?: string; body?: string };
export interface SentRecord { prospectId: string; templateId: string; to: string; sentAt: string; subject: string }

interface OutreachState { edits: Record<string, Edit>; sent: SentRecord[] }

@Injectable()
export class OutreachStore implements OnModuleInit {
  private edits = new Map<string, Edit>();
  private sent: SentRecord[] = [];
  private db = new DocStore<OutreachState>("cx_outreach");

  /** Load persisted template edits + sent log so they survive restarts. Single-tenant
   *  (ws-default) like the rest of the not-yet-migrated stores. */
  async onModuleInit() {
    const s = await this.db.loadForTenant(DEFAULT_TENANT_ID);
    if (s) {
      this.edits = new Map(Object.entries(s.edits ?? {}));
      this.sent = Array.isArray(s.sent) ? s.sent : [];
    }
  }

  private persist() {
    this.db.saveForTenant(DEFAULT_TENANT_ID, { edits: Object.fromEntries(this.edits), sent: this.sent });
  }

  saveEdit(id: string, edit: Edit) {
    const prev = this.edits.get(id) ?? {};
    this.edits.set(id, { ...prev, ...edit });
    this.persist();
    return this.edits.get(id)!;
  }

  apply(template: OutreachTemplate): OutreachTemplate {
    const edit = this.edits.get(template.id);
    return edit ? { ...template, ...edit } : template;
  }

  hasEdit(id: string) {
    return this.edits.has(id);
  }

  recordSent(record: SentRecord) {
    this.sent.unshift(record);
    if (this.sent.length > 500) this.sent.length = 500;
    this.persist();
  }

  sentLog(): SentRecord[] {
    return this.sent;
  }
}
