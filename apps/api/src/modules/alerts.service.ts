import { Injectable } from "@nestjs/common";

/** In-memory alert read-state. Swap for a per-user table in production. */
@Injectable()
export class AlertsStore {
  private read = new Set<string>();
  private resolved = new Set<string>();
  private thresholds = {
    rankDrop: 5,
    trafficDrop: 8,
    brokenBacklinks: true,
    aiVisibilityDrop: 10,
  };

  markRead(id: string) {
    this.read.add(id);
  }
  markAllRead(ids: string[]) {
    ids.forEach((id) => this.read.add(id));
    return ids;
  }
  isRead(id: string) {
    return this.read.has(id);
  }
  resolve(id: string) {
    this.resolved.add(id);
    this.read.add(id);
  }
  isResolved(id: string) {
    return this.resolved.has(id);
  }
  getThresholds() {
    return this.thresholds;
  }
  updateThresholds(update: Partial<typeof this.thresholds>) {
    this.thresholds = { ...this.thresholds, ...update };
    return this.thresholds;
  }
}
