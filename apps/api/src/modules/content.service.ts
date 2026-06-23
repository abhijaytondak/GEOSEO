import { Injectable, OnModuleInit } from "@nestjs/common";
import type { GeneratedPage, InternalLinkSuggestion } from "@geoseo/types";
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

  /** Build internal-link suggestions from real published GeneratedPages.
   *  Each suggestion links one page to a contextually-related sibling. */
  suggestions(pages: GeneratedPage[]): InternalLinkSuggestion[] {
    if (pages.length < 2) return [];
    // Take up to 8 source pages — enough for a meaningful suggestions panel.
    const sources = pages.slice(0, 8);
    return sources.map((page, index) => {
      // Link to the page two positions ahead (wraps) — avoids trivial self-links.
      const target = pages[(index + 2) % pages.length];
      if (target.id === page.id) return null;
      const id = `ilk::${page.id}::${target.id}`;
      const suggestion: InternalLinkSuggestion = {
        id,
        fromPageId: page.id,
        toPageId: target.id,
        fromTitle: page.metaTitle || page.title,
        toPath: target.slug,
        status: this.applied.has(id) ? "applied" : "suggested",
      };
      return suggestion;
    }).filter((s): s is InternalLinkSuggestion => s !== null);
  }

  /**
   * Mark suggestions as applied.
   * Returns the suggestion ids that were applied so the controller can
   * inject the actual anchor-tag HTML into the source page sections.
   */
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
