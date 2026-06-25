/** A published resource article. Authored content only — the /resources/[slug] route
 *  builds from the CONTENT map, so a topic without real content is simply not published
 *  yet (no thin pages → no scaled-content-abuse risk). */
export interface Article {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  /** ISO date — drives "Updated" line + sitemap lastModified. */
  updated: string;
  readMins: number;
  /** Direct, answer-first opening (1–3 sentences) — what AI engines lift as the citation. */
  answer: string;
  /** Scannable TL;DR — 3–5 key points. */
  takeaways: string[];
  /** Body sections; each heading becomes an H2 + a TOC entry. */
  sections: { heading: string; body: string[]; bullets?: string[] }[];
  faqs: { q: string; a: string }[];
  /** Related links — internal resource slugs (`/resources/x`) or product paths (`/platform/x`). */
  related: { label: string; href: string }[];
}
