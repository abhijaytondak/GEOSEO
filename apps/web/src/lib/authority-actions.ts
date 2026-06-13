import type { Alert, AuthorityAction, Backlink, BacklinkProspect, DomainHealth } from "@geoseo/types";

const RANK: Record<"low" | "medium" | "high", number> = { low: 0, medium: 1, high: 2 };

/**
 * Derive the Authority HQ Action Center cards (PRD §10) from current dashboard
 * state — what to do next, ranked by urgency then impact. Pure + deterministic
 * so it renders on the server. Every action points at a real workflow route.
 */
export function deriveAuthorityActions(input: {
  alerts: Alert[];
  backlinks: Backlink[];
  prospects: BacklinkProspect[];
  health: DomainHealth;
}): AuthorityAction[] {
  const { alerts, backlinks, prospects } = input;
  const actions: AuthorityAction[] = [];

  // 1. Critical alerts → resolve each (highest urgency).
  for (const a of alerts.filter((x) => x.severity === "critical" && !x.resolved).slice(0, 2)) {
    actions.push({
      id: `act-alert-${a.id}`,
      title: a.recommendedAction?.label ?? "Resolve critical alert",
      reason: a.title,
      impact: "high",
      urgency: "high",
      status: "new",
      href: a.recommendedAction?.href ?? "/alerts",
      primaryAction: { label: a.recommendedAction?.label ?? "Resolve", kind: "navigate" },
    });
  }

  // 2. High-impact prospects ready for outreach.
  const ready = prospects.filter((p) => p.status === "new" && p.impactScore >= 80).length;
  if (ready > 0) {
    actions.push({
      id: "act-prospects",
      title: `Contact ${ready} high-impact prospect${ready > 1 ? "s" : ""}`,
      reason: "New prospects with DA + relevance above your outreach threshold.",
      impact: "high",
      urgency: ready >= 3 ? "high" : "medium",
      status: "new",
      href: "/opportunities",
      primaryAction: { label: "Start outreach", kind: "navigate" },
    });
  }

  // 3. Broken / lost backlinks → recover.
  const fragile = backlinks.filter((b) => b.status === "broken" || b.status === "lost").length;
  if (fragile > 0) {
    actions.push({
      id: "act-backlinks",
      title: `Recover ${fragile} broken or lost backlink${fragile > 1 ? "s" : ""}`,
      reason: "Links that dropped off can drag ranking — re-outreach usually recovers them.",
      impact: "medium",
      urgency: "medium",
      status: "new",
      href: "/opportunities",
      primaryAction: { label: "Review links", kind: "navigate" },
    });
  }

  // 4. Rank/traffic-drop alerts → refresh affected pages.
  const decay = alerts.filter(
    (a) => (a.type === "rank-drop" || a.type === "traffic-drop") && a.severity !== "critical" && !a.resolved,
  ).length;
  if (decay > 0) {
    actions.push({
      id: "act-refresh",
      title: `Refresh ${decay} page${decay > 1 ? "s" : ""} losing ground`,
      reason: "Pages slipping on rank or traffic respond well to a content refresh.",
      impact: "medium",
      urgency: "medium",
      status: "new",
      href: "/performance",
      primaryAction: { label: "Open performance", kind: "navigate" },
    });
  }

  // 5. Warnings still open → review (lower priority).
  const warnings = alerts.filter((a) => a.severity === "warning" && !a.resolved).length;
  if (warnings > 0 && actions.length < 5) {
    actions.push({
      id: "act-warnings",
      title: `Review ${warnings} open warning${warnings > 1 ? "s" : ""}`,
      reason: "Non-critical alerts worth a look before they escalate.",
      impact: "low",
      urgency: "low",
      status: "new",
      href: "/alerts",
      primaryAction: { label: "Open alerts", kind: "navigate" },
    });
  }

  return actions
    .sort((a, b) => RANK[b.urgency] - RANK[a.urgency] || RANK[b.impact] - RANK[a.impact])
    .slice(0, 5);
}
