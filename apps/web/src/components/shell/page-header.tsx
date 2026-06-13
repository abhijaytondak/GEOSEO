import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** Small eyebrow label above the title. */
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Signature aurora header — a low-saturation gradient banner sitting behind the
 * page title row (the distinguishing flourish from the Dribbble reference).
 */
export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.55]" />
      <div className="relative flex flex-col gap-4 px-6 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-[30px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
