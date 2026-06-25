import { Injectable, Logger, OnModuleInit, Inject } from "@nestjs/common";
import type { SeoDataProvider } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { PageEngineStore } from "./page-engine.service";
import { AlertsStore } from "./alerts.service";

/** How often the monitor runs once the server is up (6 hours). */
const POLL_MS = 6 * 60 * 60_000;
/** Delay after startup before the first scan — lets SEO providers finish initialising. */
const BOOT_DELAY_MS = 45_000;

/**
 * Background content-health monitor.
 *
 * On every poll it fetches the latest TrackedPage rank data from the SEO
 * provider, compares currentRank vs prevRank, and flags any published page
 * whose rank has dropped by ≥ threshold positions.  The flag is the standard
 * `needs-refresh` status that the "Needs Attention" panel already surfaces —
 * no new data model needed.
 *
 * Fans out over every hydrated tenant (PageEngineStore.tenantIds()). The tracked-rank
 * source (SeoDataProvider) is still global — it has no tenant param yet — so the same
 * tracked list is matched against each tenant's published slugs; for a single tenant this
 * is identical to before. Per-tenant rank data lands once SeoDataProvider is tenant-aware.
 */
@Injectable()
export class ContentMonitorService implements OnModuleInit {
  private readonly log = new Logger(ContentMonitorService.name);

  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(PageEngineStore) private readonly pages: PageEngineStore,
    @Inject(AlertsStore) private readonly alerts: AlertsStore,
  ) {}

  onModuleInit() {
    // Boot delay so the SEO provider's async init completes before we query it.
    setTimeout(() => void this.scan("boot"), BOOT_DELAY_MS);
    setInterval(() => void this.scan("poll"), POLL_MS);
  }

  /** Public so tests and the manual-trigger endpoint can call it. */
  async scan(trigger: "boot" | "poll" | "manual" = "manual"): Promise<{ flagged: number; checked: number }> {
    try {
      return await this.runScan();
    } catch (err) {
      this.log.warn(`[content-monitor/${trigger}] scan failed: ${err instanceof Error ? err.message : String(err)}`);
      return { flagged: 0, checked: 0 };
    }
  }

  private async runScan(): Promise<{ flagged: number; checked: number }> {
    const threshold = this.alerts.getThresholds().rankDrop;

    const tracked = await this.seo.getTrackedPages();
    if (!tracked.length) return { flagged: 0, checked: 0 };

    let flagged = 0;
    // Fan out over every tenant. The tracked-rank list is global (SeoDataProvider has no
    // tenant param yet), so it's matched against each tenant's published slugs — for a
    // single tenant this is exactly the previous behavior.
    for (const tenantId of this.pages.tenantIds()) {
      const published = this.pages.listPages(tenantId).filter((p) => p.status === "published");
      if (!published.length) continue;

      // slug→page lookup for O(1) matching within this tenant.
      const slugMap = new Map(published.map((p) => [p.slug.replace(/^\//, ""), p]));

      for (const tp of tracked) {
        if (tp.currentRank <= 0 || tp.prevRank <= 0) continue;
        const drop = tp.currentRank - tp.prevRank; // positive = worse rank
        if (drop < threshold) continue;

        const page = slugMap.get(tp.path.replace(/^\//, ""));
        if (!page) continue;

        const didFlag = this.pages.markNeedsRefresh(
          tenantId,
          page.id,
          `Rank dropped ${drop} positions (now #${tp.currentRank}, was #${tp.prevRank})`,
        );
        if (didFlag) flagged++;
      }
    }

    if (flagged) {
      this.log.log(
        `[content-monitor] flagged ${flagged} page${flagged > 1 ? "s" : ""} for refresh (threshold: ${threshold} positions)`,
      );
    }

    return { flagged, checked: tracked.length };
  }
}
