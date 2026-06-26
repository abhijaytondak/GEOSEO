import type { GeneratedPage } from "@geoseo/types";

/** First 1–2 sentences of a text block, trimmed — a standalone, quotable answer. */
function leadSentences(text: string, max = 2): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const parts = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  return parts.slice(0, max).join(" ").trim();
}

const READ_WPM = 220;

/**
 * Direct-answer block (AEO). Renders at the very top of a feed page a concise, self-contained
 * "Quick answer" plus a key-facts <dl> — the exact element LLM answer engines (ChatGPT,
 * Perplexity, Google AI Overviews) extract and cite. Derived from existing page fields, so it
 * works for every page with no generation change; semantic <section>/<dl> for crawlability and
 * matched by the page's `speakable` JSON-LD selector.
 */
export function DirectAnswer({ page }: { page: GeneratedPage }) {
  // Prefer the first FAQ answer (already a standalone answer); else lead with the hero copy.
  const answer = leadSentences(page.faqs?.[0]?.a || page.heroCopy || page.metaDescription, 3);
  if (!answer) return null;

  const keyword = page.targetKeywords?.[0] ?? page.title;
  const updated = page.lastRefreshedAt ?? page.updatedAt ?? page.publishedAt;
  const updatedLabel = updated
    ? new Date(updated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
    : null;
  const readMin = page.wordCount ? Math.max(1, Math.round(page.wordCount / READ_WPM)) : null;

  const facts: { label: string; value: string }[] = [
    { label: "Topic", value: keyword },
    ...(updatedLabel ? [{ label: "Last updated", value: updatedLabel }] : []),
    ...(readMin ? [{ label: "Read time", value: `${readMin} min` }] : []),
  ];

  return (
    <section
      aria-label="Quick answer"
      className="mb-6 rounded-2xl border border-border bg-surface-sunken p-5"
      data-aeo="direct-answer"
    >
      <p className="text-micro font-semibold uppercase tracking-wide text-brand">Quick answer</p>
      <p className="mt-2 text-[17px] leading-relaxed text-foreground">{answer}</p>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-3">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col">
            <dt className="text-micro font-medium uppercase tracking-wide text-muted-foreground">{f.label}</dt>
            <dd className="text-label font-semibold text-foreground">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
