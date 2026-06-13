import { Injectable } from "@nestjs/common";
import type { OutreachTemplate } from "@geoseo/types";

type Edit = { subject?: string; body?: string };

/** In-memory store of user edits to drafted templates. Templates are
 *  regenerated fresh each request (deterministic from the mock drafter); this
 *  layer re-applies any saved edits on top. Swap for a DB table in production. */
@Injectable()
export class OutreachStore {
  private edits = new Map<string, Edit>();

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
}
