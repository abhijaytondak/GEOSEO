import { Controller, Get, Inject, Logger } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  SeoDataProvider,
  Backlink,
  RankPoint,
  AuthorityOverview,
  BacklinkQuality,
  AuthorityMomentum,
  DomainHealth,
} from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { settled, degradeLogger } from "../common/async";

/** Neutral health used when the domain-health provider fails — keeps the aggregate 200. */
const NEUTRAL_HEALTH: DomainHealth = {
  score: 0,
  grade: "D",
  delta: { pct: 0, direction: "flat", goodWhen: "up" },
  factors: [],
  backlinksAcquired: 0,
  backlinksOpportunities: 0,
};

/** Per-status contribution to backlink quality (live links matter most). */
const STATUS_WEIGHT: Record<Backlink["status"], number> = {
  live: 1,
  pending: 0.4,
  lost: 0,
  broken: 0,
};

function gradeFor(score: number): "A" | "B" | "C" | "D" {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function computeBacklinkQuality(backlinks: Backlink[]): BacklinkQuality {
  const breakdown = { live: 0, pending: 0, lost: 0, broken: 0 };
  for (const b of backlinks) breakdown[b.status] += 1;

  const totalDA = backlinks.reduce((a, b) => a + b.domainAuthority, 0) || 1;
  const weightedDA = backlinks.reduce((a, b) => a + b.domainAuthority * STATUS_WEIGHT[b.status], 0);
  const score = round((weightedDA / totalDA) * 100);

  const live = backlinks.filter((b) => b.status === "live");
  const avgLiveAuthority = live.length
    ? round(live.reduce((a, b) => a + b.domainAuthority, 0) / live.length)
    : 0;

  return { score, grade: gradeFor(score), total: backlinks.length, breakdown, avgLiveAuthority };
}

function computeMomentum(ranks: RankPoint[], healthScore: number): AuthorityMomentum {
  // Rank is SERP position — lower is better. A drop in position = improving.
  const tail = ranks.slice(-30);
  if (tail.length < 2) {
    return { direction: "flat", pct: 0, projectedScore: healthScore, summary: "Not enough history to project a trend." };
  }
  const first = tail[0].rank;
  const last = tail[tail.length - 1].rank;
  const change = first - last; // positive ⇒ ranking improved
  const pct = round((change / (first || 1)) * 100, 1);
  const direction = change > 0.5 ? "up" : change < -0.5 ? "down" : "flat";
  // Extrapolate the same 30-day movement forward onto the health score.
  const projectedScore = Math.max(20, Math.min(99, round(healthScore + change)));
  const summary =
    direction === "up"
      ? `Rankings improving ${Math.abs(pct)}% — health projected to reach ${projectedScore}/100 in ~30 days.`
      : direction === "down"
        ? `Rankings slipping ${Math.abs(pct)}% — health projected at ${projectedScore}/100 in ~30 days without action.`
        : `Rankings holding steady — health projected near ${projectedScore}/100 in ~30 days.`;
  return { direction, pct, projectedScore, summary };
}

@ApiTags("overview")
@Controller("overview")
export class OverviewController {
  private readonly log = new Logger(OverviewController.name);

  constructor(@Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider) {}

  /** One aggregate round-trip for the Authority HQ landing (Authority HQ §Phase3).
   *  Each provider degrades independently (allSettled) so one failure can't 500 the dashboard. */
  @Get("authority")
  async authority(): Promise<AuthorityOverview> {
    const [healthR, backlinksR, alertsR, ranksR] = await Promise.allSettled([
      this.seo.getDomainHealth(),
      this.seo.getBacklinks(),
      this.seo.getAlerts(),
      this.seo.getRankSeries(),
    ]);
    const warn = degradeLogger(this.log, "overview/authority");
    const health = settled(healthR, NEUTRAL_HEALTH, warn("domain-health"));
    const backlinks = settled(backlinksR, [], warn("backlinks"));
    const alerts = settled(alertsR, [], warn("alerts"));
    const ranks = settled(ranksR, [], warn("rank-series"));

    const open = alerts.filter((a) => !a.resolved);
    return {
      health,
      backlinkQuality: computeBacklinkQuality(backlinks),
      alerts: {
        open: open.length,
        critical: open.filter((a) => a.severity === "critical").length,
        warning: open.filter((a) => a.severity === "warning").length,
      },
      momentum: computeMomentum(ranks, health.score),
    };
  }
}
