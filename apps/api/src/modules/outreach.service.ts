import { Injectable } from "@nestjs/common";
import type { OutreachTemplate } from "@geoseo/types";

type Edit = { subject?: string; body?: string };
export interface SentRecord { prospectId: string; templateId: string; to: string; sentAt: string; subject: string }

@Injectable()
export class OutreachStore {
  private edits = new Map<string, Edit>();
  private sent: SentRecord[] = [];

  saveEdit(id: string, edit: Edit) {
    const prev = this.edits.get(id) ?? {};
    this.edits.set(id, { ...prev, ...edit });
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
  }

  sentLog(): SentRecord[] {
    return this.sent;
  }
}
