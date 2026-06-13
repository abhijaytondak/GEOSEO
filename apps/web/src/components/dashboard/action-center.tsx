import Link from "next/link";
import { ArrowRight, Flame, Zap, CircleDot } from "lucide-react";
import type { AuthorityAction } from "@geoseo/types";
import { cn } from "@/lib/utils";

const IMPACT_STYLE: Record<AuthorityAction["impact"], { label: string; cls: string }> = {
  high: { label: "High impact", cls: "bg-brand/12 text-brand" },
  medium: { label: "Medium impact", cls: "bg-info/12 text-info" },
  low: { label: "Low impact", cls: "bg-muted text-muted-foreground" },
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
        <p className="text-[13px] font-medium text-foreground">You&apos;re all caught up.</p>
        <p className="mt-1 text-[12px] text-muted-foreground">No actions need attention right now.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {actions.map((a) => {
        const impact = IMPACT_STYLE[a.impact];
        const UIcon = URGENCY_ICON[a.urgency];
        return (
          <li key={a.id}>
            <Link
              href={a.href}
              className="group block rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-brand/40 hover:bg-surface-sunken"
            >
              <div className="flex items-start gap-2.5">
                <UIcon className={cn("mt-0.5 size-4 shrink-0", URGENCY_TINT[a.urgency])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-foreground">{a.title}</span>
                    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", impact.cls)}>
                      {impact.label}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{a.reason}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand">
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
