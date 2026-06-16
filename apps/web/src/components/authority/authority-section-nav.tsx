import Link from "next/link";
import { Swords, Link2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthorityViewId = "competitors" | "opportunities";

export interface AuthoritySection {
  id: AuthorityViewId;
  title: string;
  /** One-line "what this section is for" shown in the focus banner. */
  focus: string;
  icon: LucideIcon;
}

/** Authority workspace sections (docs/PRD-workflow-navigation-optimization.md §6.3).
 *  Competitor intelligence and backlink/citation work are siblings here instead of
 *  two separate sidebar destinations. */
export const AUTHORITY_SECTIONS: AuthoritySection[] = [
  {
    id: "opportunities",
    title: "Opportunities",
    focus: "Backlink and citation targets ranked by impact — with outreach drafts and archived-prospect restore.",
    icon: Link2,
  },
  {
    id: "competitors",
    title: "Competitors",
    focus: "See who outranks you for target keywords and where the visibility and keyword gaps are.",
    icon: Swords,
  },
];

// Default to Opportunities — it always has prospect data, whereas Competitors is
// empty until a Brave Search key or declared competitors exist (so it won't land
// the user on an empty screen).
export function resolveAuthorityView(raw: string | undefined): AuthorityViewId {
  return AUTHORITY_SECTIONS.some((s) => s.id === raw) ? (raw as AuthorityViewId) : "opportunities";
}

/** Section switcher rendered under the Authority header. Each section links to
 *  `/authority?view=<id>` so deep links work without client state. */
export function AuthoritySectionNav({ active }: { active: AuthorityViewId }) {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex gap-1 overflow-x-auto px-3 py-2.5 sm:px-6">
        {AUTHORITY_SECTIONS.map((s) => {
          const isActive = s.id === active;
          const Icon = s.icon;
          return (
            <Link
              key={s.id}
              href={`/authority?view=${s.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={2} />
              {s.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
