import Link from "next/link";
import { ArrowRight, Flame, Zap, CircleDot } from "lucide-react";
import type { AuthorityAction } from "@geoseo/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const IMPACT_BADGE: Record<
  AuthorityAction["impact"],
  { label: string; variant: "brand" | "info" | "muted" }
> = {
  high: { label: "High impact", variant: "brand" },
  medium: { label: "Medium impact", variant: "info" },
  low: { label: "Low impact", variant: "muted" },
};

const URGENCY_ICON: Record<AuthorityAction["urgency"], typeof Flame> = {
  high: Flame,
  medium: Zap,
  low: CircleDot,
};

const URGENCY_TINT: Record<AuthorityAction["urgency"], string> = {
  high: "text-negative",
  medium: "text-warning",
  low: "text-muted-foreground",
};

/**
 * Action Center (Authority HQ PRD §10): prioritized, executable next-actions.
 * Every card links to a real workflow — no inert cards.
 */
export function ActionCenter({ actions }: { actions: AuthorityAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center">
        <p className="text-label font-medium text-foreground">You&apos;re all caught up.</p>
        <p className="mt-1 text-label text-muted-foreground">No actions need attention right now.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {actions.map((a) => {
        const impact = IMPACT_BADGE[a.impact];
        const UIcon = URGENCY_ICON[a.urgency];
        return (
          <li key={a.id}>
            <Link
              href={a.href}
              className="group block rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-brand/40 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <div className="flex items-start gap-2.5">
                <UIcon className={cn("mt-0.5 size-4 shrink-0", URGENCY_TINT[a.urgency])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-h-card text-foreground">{a.title}</span>
                    <Badge variant={impact.variant} className="shrink-0">
                      {impact.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-label leading-relaxed text-muted-foreground">{a.reason}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-label font-semibold text-brand">
                    {a.primaryAction.label}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
