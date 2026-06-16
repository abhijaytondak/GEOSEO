import Link from "next/link";
import { cn } from "@/lib/utils";

export type PipelineStageId = "discover" | "plan" | "create" | "review" | "publish" | "refresh";

export interface PipelineStage {
  id: PipelineStageId;
  n: number;
  title: string;
  /** One-line "what to do in this stage" shown in the focus banner. */
  focus: string;
}

/** The six Pipeline stages (docs/PRD-workflow-navigation-optimization.md §6.2). */
export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "discover",
    n: 1,
    title: "Discover",
    focus: "Find and triage buyer-intent opportunities, then generate pages from the winners.",
  },
  {
    id: "plan",
    n: 2,
    title: "Plan",
    focus: "Review and approve blueprints — intent, structure, and theme fit — before drafting.",
  },
  {
    id: "create",
    n: 3,
    title: "Create",
    focus: "Draft and optimize page content, grounded in your Brand Memory.",
  },
  {
    id: "review",
    n: 4,
    title: "Review",
    focus: "Audit conversion readiness and fix blockers before publishing.",
  },
  {
    id: "publish",
    n: 5,
    title: "Publish",
    focus: "Publish approved pages to /feeds, sitemap, llms.txt, or your connected CMS.",
  },
  {
    id: "refresh",
    n: 6,
    title: "Refresh",
    focus: "Act on refresh recommendations to keep pages ranking as evidence arrives.",
  },
];

export function resolvePipelineStage(raw: string | undefined): PipelineStageId {
  return PIPELINE_STAGES.some((s) => s.id === raw) ? (raw as PipelineStageId) : "discover";
}

/** Horizontal stage switcher rendered under the Pipeline header. Each stage is a
 *  link to `/pipeline?stage=<id>` so deep links and aliases work without client state. */
export function PipelineStageNav({ active }: { active: PipelineStageId }) {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex gap-1 overflow-x-auto px-3 py-2.5 sm:px-6">
        {PIPELINE_STAGES.map((s) => {
          const isActive = s.id === active;
          return (
            <Link
              key={s.id}
              href={`/pipeline?stage=${s.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-[18px] items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                  isActive ? "bg-brand-foreground/20" : "bg-muted-foreground/15",
                )}
              >
                {s.n}
              </span>
              {s.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
