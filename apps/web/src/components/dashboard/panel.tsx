import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InfoHint } from "@/components/ui/info-hint";

interface PanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  /** Optional coaching tooltip shown as an (i) next to the title. */
  hint?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Standard dashboard surface: white card, hairline border, whisper shadow. */
export function Panel({
  title,
  description,
  action,
  hint,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-card",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-foreground">
                {title}
                {hint && <InfoHint>{hint}</InfoHint>}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
