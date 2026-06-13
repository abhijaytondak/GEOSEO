import { CheckCircle2, MinusCircle, XCircle, Check, Ban } from "lucide-react";
import type { SolutionReadiness, CapabilityStatus, SolutionStatus } from "@geoseo/types";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<SolutionStatus, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-positive/12 text-positive" },
  partial: { label: "Partial — beta", cls: "bg-warning/15 text-warning" },
  planned: { label: "Planned", cls: "bg-muted text-muted-foreground" },
};

const CAP_ICON: Record<CapabilityStatus, { Icon: typeof CheckCircle2; cls: string }> = {
  built: { Icon: CheckCircle2, cls: "text-positive" },
  partial: { Icon: MinusCircle, cls: "text-warning" },
  gap: { Icon: XCircle, cls: "text-muted-foreground/50" },
};

function barColor(pct: number) {
  return pct >= 70 ? "bg-positive" : pct >= 40 ? "bg-warning" : "bg-muted-foreground/50";
}

export function SolutionsView({ solutions }: { solutions: SolutionReadiness[] }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-[13px] text-foreground">
        <span className="font-semibold">Internal readiness — sell honestly.</span> This page reflects what GEOSEO can
        actually do today so sales and marketing copy never overclaims. Statuses update as features ship.
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {solutions.map((s) => {
          const badge = STATUS_BADGE[s.status];
          return (
            <div key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-foreground">{s.name}</h3>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.cls)}>{badge.label}</span>
              </div>

              {/* completeness */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11.5px] text-muted-foreground">
                  <span>Capability coverage</span>
                  <span className="tnum font-semibold text-foreground">{s.completeness}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", barColor(s.completeness))} style={{ width: `${s.completeness}%` }} />
                </div>
              </div>

              <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{s.summary}</p>

              {/* capabilities */}
              <div className="mt-4 space-y-1.5">
                {s.capabilities.map((c) => {
                  const { Icon, cls } = CAP_ICON[c.status];
                  return (
                    <div key={c.label} className="flex items-start gap-2 text-[12.5px]">
                      <Icon className={cn("mt-0.5 size-3.5 shrink-0", cls)} />
                      <span className="text-foreground">
                        {c.label}
                        {c.note && <span className="text-muted-foreground"> — {c.note}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* claims */}
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-positive">
                    <Check className="size-3" /> Safe to claim
                  </div>
                  <ul className="mt-1 space-y-1 text-[12px] text-muted-foreground">
                    {s.safeClaims.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-negative">
                    <Ban className="size-3" /> Don&apos;t claim yet
                  </div>
                  <ul className="mt-1 space-y-1 text-[12px] text-muted-foreground">
                    {s.avoidClaims.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
