import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GeneratedPage } from "@geoseo/types";

const STOPWORDS = new Set([
  "the", "a", "an", "to", "for", "of", "in", "on", "and", "or", "vs", "with", "best", "top", "how",
  "what", "why", "is", "are", "near", "me", "your", "you", "guide", "tips", "cost", "pricing", "buy",
  "hire", "page", "pages",
]);

/** Significant tokens of a page (title + target keywords), for topic-pillar matching. */
function pageTokens(p: GeneratedPage): Set<string> {
  const text = `${p.title} ${(p.targetKeywords ?? []).join(" ")}`.toLowerCase();
  return new Set(
    text
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

/**
 * Topic-cluster internal linking (SEO + GEO). Surfaces other published pages in the same
 * pillar — ranked by shared significant tokens — as real <a> links at the foot of the article.
 * Internal links between topically-related pages are what build the topical-authority graph
 * Google and AI engines reward; deriving the cluster from title+keywords means it works for
 * every page with no extra data.
 */
export function RelatedPages({ current, all }: { current: GeneratedPage; all: GeneratedPage[] }) {
  const mine = pageTokens(current);
  if (mine.size === 0) return null;

  const related = all
    .filter((p) => p.id !== current.id && p.slug !== current.slug)
    .map((p) => {
      const theirs = pageTokens(p);
      let overlap = 0;
      for (const t of theirs) if (mine.has(t)) overlap++;
      return { page: p, overlap };
    })
    .filter((r) => r.overlap >= 1)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section aria-label="Related pages" className="mt-12 border-t border-border pt-6">
      <h2 className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Related in this topic</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {related.map(({ page }) => (
          <li key={page.id}>
            <Link
              href={`/feeds${page.slug}`}
              className="group flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-brand/40"
            >
              <span className="min-w-0">
                <span className="block truncate text-label font-semibold text-foreground group-hover:text-brand">
                  {page.title}
                </span>
                {page.metaDescription && (
                  <span className="mt-0.5 line-clamp-1 text-micro text-muted-foreground">{page.metaDescription}</span>
                )}
              </span>
              <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
