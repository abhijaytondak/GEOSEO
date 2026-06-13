import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { Delta } from "@geoseo/types";
import { cn } from "@/lib/utils";

/** A movement chip whose color reflects whether the move was good, not its sign. */
export function DeltaChip({
  delta,
  className,
}: {
  delta: Delta;
  className?: string;
}) {
  const isGood =
    delta.direction === "flat" ? null : delta.direction === delta.goodWhen;
  const Icon =
    delta.direction === "up"
      ? ArrowUpRight
      : delta.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums",
        isGood === null && "bg-muted text-muted-foreground",
        isGood === true && "bg-positive/12 text-positive",
        isGood === false && "bg-negative/12 text-negative",
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {Math.abs(delta.pct).toFixed(1)}%
    </span>
  );
}
