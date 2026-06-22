"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Embeddable failure state for a panel/section whose data didn't load — so a
 * failed fetch shows "couldn't load + Retry" instead of an empty box or a
 * spinner that never resolves. Pair with a per-panel try/catch.
 */
export function ErrorState({
  title = "Couldn't load this",
  description = "Something went wrong fetching this data.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-9 text-center",
        className,
      )}
    >
      <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-warning/12 text-warning">
        <AlertTriangle className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3 className="text-h-card font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-label leading-relaxed text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-label font-semibold text-foreground transition-colors ease-expo hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
