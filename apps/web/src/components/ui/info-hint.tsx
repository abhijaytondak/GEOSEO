import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Coaching tooltip — a small (i) that explains what a metric means / what to do.
 *  Matches the PRD's "smart tooltips with coaching guidance" UX principle. */
export function InfoHint({ children, label = "What this means" }: { children: string; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/60 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] text-[12px] leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
