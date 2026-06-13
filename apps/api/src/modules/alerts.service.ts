import { Injectable, OnModuleInit } from "@nestjs/common";
import { DocStore } from "../db/db";

type Thresholds = {
  rankDrop: number;
  trafficDrop: number;
  brokenBacklinks: boolean;
  aiVisibilityDrop: number;
};
type AlertState = {
  read: string[];
  resolved: string[];
  thresholds: Thresholds;
  /** id → ISO timestamp the snooze expires. */
  snoozed?: Record<string, string>;
};

/** Alert read-state — persisted to Supabase (cx_alerts). */
@Injectable()
export class AlertsStore implements OnModuleInit {
  private read = new Set<string>();
  private resolved = new Set<string>();
  private snoozed = new Map<string, string>();
  private thresholds: Thresholds = {
    rankDrop: 5,
    trafficDrop: 8,
    brokenBacklinks: true,
    aiVisibilityDrop: 10,
  };
  private db = new DocStore<AlertState>("cx_alerts");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.read = new Set(loaded.read);
      this.resolved = new Set(loaded.resolved);
      this.thresholds = loaded.thresholds;
      this.snoozed = new Map(Object.entries(loaded.snoozed ?? {})); // backfill: field added later
    });
  }

  private snapshot(): AlertState {
    return {
      read: [...this.read],
      resolved: [...this.resolved],
      thresholds: this.thresholds,
      snoozed: Object.fromEntries(this.snoozed),
    };
  }
  private persist() {
    this.db.save(this.snapshot());
  }

  markRead(id: string) {
    this.read.add(id);
    this.persist();
  }
  markAllRead(ids: string[]) {
    ids.forEach((id) => this.read.add(id));
    this.persist();
    return ids;
  }
  isRead(id: string) {
    return this.read.has(id);
  }
  resolve(id: string) {
    this.resolved.add(id);
    this.read.add(id);
    this.persist();
  }
  isResolved(id: string) {
    return this.resolved.has(id);
  }
  /** Snooze an alert until `until` (defaults to 7 days out). */
  snooze(id: string, until?: string) {
    const ts = until ?? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    this.snoozed.set(id, ts);
    this.persist();
    return ts;
  }
  /** Returns the active snooze expiry, or undefined if not snoozed / expired. */
  snoozedUntil(id: string): string | undefined {
    const ts = this.snoozed.get(id);
    if (!ts) return undefined;
    if (new Date(ts).getTime() <= Date.now()) {
      this.snoozed.delete(id);
      this.persist();
      return undefined;
    }
    return ts;
  }
  getThresholds() {
    return this.thresholds;
  }
  updateThresholds(update: Partial<Thresholds>) {
    this.thresholds = { ...this.thresholds, ...update };
    this.persist();
    return this.thresholds;
  }
}
