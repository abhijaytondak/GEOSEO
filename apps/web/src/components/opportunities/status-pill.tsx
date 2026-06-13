import type { ProspectStatus } from "@geoseo/types";
import { cn } from "@/lib/utils";

const STYLE: Record<ProspectStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-info/12 text-info" },
  contacted: { label: "Contacted", cls: "bg-warning/15 text-warning" },
  replied: { label: "Replied", cls: "bg-brand/12 text-brand" },
  acquired: { label: "Acquired", cls: "bg-positive/12 text-positive" },
  rejected: { label: "Rejected", cls: "bg-muted text-muted-foreground" },
};

export function StatusPill({ status }: { status: ProspectStatus }) {
  const s = STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
        s.cls,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  );
}

export const PROSPECT_STATUSES: ProspectStatus[] = [
  "new",
  "contacted",
  "replied",
  "acquired",
  "rejected",
];
