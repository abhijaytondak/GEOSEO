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
      <div className="pointer-events-none absolute inset-0 bg-aurora" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.5]" />
      {/* soft fade so the aurora dissolves into the canvas rather than hard-cutting */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-background" />
      <div className="relative flex flex-col gap-4 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-2 inline-flex items-center gap-1.5 text-micro font-semibold uppercase text-brand">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-display font-heading text-foreground">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-body leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
