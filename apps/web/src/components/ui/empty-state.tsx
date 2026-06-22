import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One canonical empty state for the whole app: icon medallion + title +
 * description + an optional primary action. Replaces ~14 hand-rolled
 * dashed-border one-offs so every empty branch reads as intentional, not broken.
 *
 * Tone:
 *  - "default" — a real empty/zero state (no data yet, all clear).
 *  - "prompt"  — a call to connect/act (dashed border, brand-tinted icon).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
  children,
}: {
  icon?: ComponentType<LucideProps>;
  title: string;
  description?: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void };
  tone?: "default" | "prompt";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl px-6 py-10 text-center",
        tone === "prompt" ? "border border-dashed border-border bg-card" : "",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "mb-3 flex size-11 items-center justify-center rounded-xl",
            tone === "prompt" ? "bg-brand/12 text-brand" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-h-card font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-label leading-relaxed text-muted-foreground">{description}</p>
      )}
      {children}
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-label font-semibold text-background transition-colors ease-expo hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-label font-semibold text-background transition-colors ease-expo hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
