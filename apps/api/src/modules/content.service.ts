import { Injectable } from "@nestjs/common";
import type { InternalLinkSuggestion, TrackedPage } from "@geoseo/types";

@Injectable()
export class ContentStore {
  private applied = new Set<string>();
  private refreshed = new Set<string>();
  private scanCount = 0;

  suggestions(pages: TrackedPage[]): InternalLinkSuggestion[] {
    return pages.slice(0, 5).map((page, index) => {
      const to = pages[(index + 2) % pages.length] ?? page;
      const id = `${page.id}-${to.id}`;
      return {
        id,
        fromPageId: page.id,
        toPageId: to.id,
        fromTitle: page.title,
        toPath: to.path,
        status: this.applied.has(id) ? "applied" : "suggested",
      };
    });
  }

  apply(ids: string[]) {
    ids.forEach((id) => this.applied.add(id));
    return { applied: ids };
  }

  refresh(pageIds: string[]) {
    pageIds.forEach((id) => this.refreshed.add(id));
    return { queued: pageIds, refreshed: [...this.refreshed] };
  }

  rescan() {
    this.scanCount += 1;
    return { scanCount: this.scanCount, scannedAt: new Date().toISOString() };
  }
}
