import { Injectable, OnModuleInit } from "@nestjs/common";
import type { InternalLinkSuggestion, TrackedPage } from "@geoseo/types";
import { DocStore } from "../db/db";

type ContentState = { applied: string[]; refreshed: string[]; scanCount: number };

@Injectable()
export class ContentStore implements OnModuleInit {
  private applied = new Set<string>();
  private refreshed = new Set<string>();
  private scanCount = 0;
  private db = new DocStore<ContentState>("cx_content");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.applied = new Set(loaded.applied);
      this.refreshed = new Set(loaded.refreshed);
      this.scanCount = loaded.scanCount;
    });
  }

  private snapshot(): ContentState {
    return { applied: [...this.applied], refreshed: [...this.refreshed], scanCount: this.scanCount };
  }
  private persist() {
    this.db.save(this.snapshot());
  }

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
    this.persist();
    return { applied: ids };
  }

  refresh(pageIds: string[]) {
    pageIds.forEach((id) => this.refreshed.add(id));
    this.persist();
    return { queued: pageIds, refreshed: [...this.refreshed] };
  }

  rescan() {
    this.scanCount += 1;
    this.persist();
    return { scanCount: this.scanCount, scannedAt: new Date().toISOString() };
  }
}
