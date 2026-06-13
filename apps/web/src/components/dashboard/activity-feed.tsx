import {
  Link2,
  Send,
  TrendingUp,
  FileEdit,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { ActivityEvent, ActivityKind } from "@geoseo/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND: Record<ActivityKind, { icon: LucideIcon; tint: string }> = {
  "backlink-acquired": { icon: Link2, tint: "bg-positive/10 text-positive" },
  "outreach-sent": { icon: Send, tint: "bg-info/10 text-info" },
  "rank-improved": { icon: TrendingUp, tint: "bg-brand/10 text-brand" },
  "page-optimized": { icon: FileEdit, tint: "bg-warning/10 text-warning" },
  "alert-resolved": { icon: CheckCircle2, tint: "bg-muted text-muted-foreground" },
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <ol className="relative space-y-4">
      {events.map((e, i) => {
        const { icon: Icon, tint } = KIND[e.kind];
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-3">
            {!last && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-border" />
            )}
            <div className={cn("z-10 flex size-8 shrink-0 items-center justify-center rounded-full", tint)}>
              <Icon className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[13px] leading-snug text-foreground">{e.message}</p>
              <span className="text-[11px] text-muted-foreground/70">
                {relativeTime(e.at)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
