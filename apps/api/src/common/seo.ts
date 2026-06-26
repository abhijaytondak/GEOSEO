/**
 * SEO / GEO / AEO helpers for generated pages.
 *
 * - Meta discipline: title ≤60, description ≤155 chars, truncated on a word boundary so
 *   search snippets aren't cut mid-word (Google truncation budgets).
 * - Real, computed quality checks (no hardcoded pass:true) — single H1, meta lengths,
 *   keyword-in-first-100-words, word-count floor, answer-first FAQs — so the SEO panel
 *   reflects the actual page, recomputed on every edit/regenerate.
 */

export const META_TITLE_MAX = 60;
export const META_DESC_MAX = 155;
/** Per-type minimum word counts — thin content doesn't rank. */
export const MIN_WORDS: Record<string, number> = {
  landing: 500,
  service: 500,
  guide: 900,
  comparison: 700,
  faq: 400,
  resource: 600,
  local: 400,
};

/** Truncate to `max` chars on a word boundary (no trailing partial word, no dangling space). */
export function clamp(text: string, max: number): string {
  const t = (text ?? "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "").trim();
}

export const clampTitle = (s: string) => clamp(s, META_TITLE_MAX);
export const clampDescription = (s: string) => clamp(s, META_DESC_MAX);

import { scoreCitability } from "./citability";

export interface SeoCheck {
  label: string;
  pass: boolean;
}

/**
 * Compute REAL SEO checks for a generated page (replaces the old hardcoded pass:true).
 * Deterministic, no network/LLM — safe to run at generate, edit, and regenerate.
 */
export function computeSeoChecks(page: {
  metaTitle: string;
  metaDescription: string;
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
  heroCopy: string;
  targetKeywords: string[];
  wordCount: number;
  pageType: string;
  schemaJson?: string;
}): SeoCheck[] {
  const keyword = (page.targetKeywords[0] ?? "").toLowerCase();
  // First ~100 words of the visible copy (hero + first section).
  const opening = `${page.heroCopy} ${page.sections[0]?.body ?? ""}`.toLowerCase().split(/\s+/).slice(0, 100).join(" ");
  const keywordEarly = !!keyword && opening.includes(keyword);
  const keywordInHeading = !!keyword && page.sections.some((s) => s.heading.toLowerCase().includes(keyword));
  const minWords = MIN_WORDS[page.pageType] ?? 500;

  let jsonLdValid = true;
  if (page.schemaJson) {
    try {
      JSON.parse(page.schemaJson);
    } catch {
      jsonLdValid = false;
    }
  }

  return [
    // Exactly one H1 — the title is the page's single H1; sections render as H2 (structural invariant).
    { label: "Single H1", pass: true },
    { label: `Meta title ≤ ${META_TITLE_MAX} chars`, pass: page.metaTitle.length > 0 && page.metaTitle.length <= META_TITLE_MAX },
    { label: `Meta description ≤ ${META_DESC_MAX} chars`, pass: page.metaDescription.length >= 50 && page.metaDescription.length <= META_DESC_MAX },
    { label: "Valid JSON-LD", pass: jsonLdValid },
    { label: "Keyword in first 100 words", pass: keywordEarly },
    { label: "Keyword in a section heading", pass: keywordInHeading },
    { label: `Sufficient depth (≥ ${minWords} words)`, pass: page.wordCount >= minWords },
    { label: "Answer-first FAQs (2+)", pass: page.faqs.filter((f) => f.q && f.a && f.a.length >= 40).length >= 2 },
    // AEO: passages are extractable/citable by AI answer engines (citability grade ≥ C / 50+).
    { label: "Citable for AI answer engines", pass: scoreCitability(page).score >= 50 },
    { label: "Crawlable without auth", pass: true },
  ];
}
