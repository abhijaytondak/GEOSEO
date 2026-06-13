import { Injectable, OnModuleInit } from "@nestjs/common";
import type { AuditEntry } from "@geoseo/types";
import { DocStore } from "../db/db";

type AuditState = { events: AuditEntry[]; seq: number };

/**
 * Workspace audit log for core (backlinking/SEO) workflows — persisted to `cx_audit`
 * (PRD §10 "audit logging for create/update/delete/export/publish/integration").
 * Page-engine keeps its own `pe_audit` trail; this covers prospects/alerts/settings/jobs.
 */
@Injectable()
export class AuditStore implements OnModuleInit {
  private events: AuditEntry[] = [];
  private seq = 0;
  private db = new DocStore<AuditState>("cx_audit");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.events = loaded.events ?? [];
      this.seq = loaded.seq ?? this.events.length;
    });
  }

  private snapshot(): AuditState {
    return { events: this.events, seq: this.seq };
  }

  /** Append an audit event (most-recent-first). Fire-and-forget persistence. */
  record(
    action: AuditEntry["action"],
    entity: AuditEntry["entity"],
    entityId: string,
    actor = "you",
    workspaceId = "ws-default",
  ): AuditEntry {
    this.seq += 1;
    const entry: AuditEntry = {
      id: `cxa-${this.seq}`,
      action,
      entity,
      entityId,
      actor,
      workspaceId,
      at: new Date().toISOString(),
    };
    this.events.unshift(entry);
    if (this.events.length > 500) this.events.length = 500; // bound the log
    this.db.save(this.snapshot());
    return entry;
  }

  list(limit = 100): AuditEntry[] {
    return this.events.slice(0, limit);
  }
}
