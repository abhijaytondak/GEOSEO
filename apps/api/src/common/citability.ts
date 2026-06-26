/**
 * Citability / AEO scorer — how readily an AI answer engine (ChatGPT, Perplexity, Google
 * AI Overviews) can extract and cite a passage.
 *
 * Clean-room TypeScript implementation of the scoring RUBRIC published in the MIT-licensed
 * geo-seo-claude project (github.com/zubair-trabzada/geo-seo-claude, scripts/citability_scorer.py)
 * — adapted to our GeneratedPage shape. No source was copied; the five weighted dimensions,
 * thresholds, and grade bands follow the documented algorithm.
 *
 * A "passage" is a self-contained answer block — for a generated page, each section body and
 * each FAQ answer is scored independently, then aggregated to a page-level 0–100 score.
 */

export interface PassageScore {
  score: number; // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  words: number;
  breakdown: {
    answerBlock: number; // /30
    selfContainment: number; // /25
    readability: number; // /20
    statisticalDensity: number; // /15
    uniqueness: number; // /10
  };
}

export interface CitabilityResult {
  score: number; // page-level 0–100 (mean of passages)
  grade: "A" | "B" | "C" | "D" | "F";
  passages: number;
  /** Concrete, actionable suggestions for the weakest dimensions. */
  suggestions: string[];
}

const STOP_PRONOUNS = /\b(it|this|that|these|those|they|them|he|she|him|her|his|its|their)\b/gi;
const DEFINITION = /\b(is|are|refers to|means|defined as|describes)\b/i;
const TRANSITIONS = /\b(however|therefore|for example|in addition|because|as a result|in contrast|specifically|notably|moreover)\b/i;
const RECENT_YEAR = /\b(20(1[3-9]|2[0-6]))\b/g; // 2013–2026
const NAMED_SOURCE = /\b(according to|research by|study|survey|report|data from|per [A-Z])/i;
const ORIGINAL = /\b(our (research|data|analysis|study)|we (found|tested|measured|analyzed)|in our experience)\b/i;
const CASE_STUDY = /\b(case study|for instance|in one (case|example)|a client|customer example)\b/i;
const TOOL_MENTION = /\b(tool|platform|software|framework|api|dashboard|integration)\b/i;
const NUMBERED = /(^|\n)\s*\d+[.)]\s/;
const BULLET = /(^|\n)\s*[-*•]\s/;

const grade = (s: number): PassageScore["grade"] => (s >= 80 ? "A" : s >= 65 ? "B" : s >= 50 ? "C" : s >= 35 ? "D" : "F");

function countNamedEntities(text: string): number {
  // Proper-noun heuristic: capitalized words not at sentence start, deduped.
  const caps = text.match(/(?<![.!?]\s)(?<!^)\b[A-Z][a-zA-Z]{2,}\b/g) ?? [];
  return new Set(caps.map((w) => w.toLowerCase())).size;
}

/** Score one self-contained passage (a section body or FAQ answer) 0–100. */
export function scorePassage(text: string): PassageScore {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const sentences = clean.split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  const first60 = clean.split(/\s+/).slice(0, 60).join(" ");

  // 1. Answer Block Quality (30) — definition pattern, early/direct answer, quotable claim.
  let answerBlock = 0;
  if (DEFINITION.test(first60)) answerBlock += 12; // direct definition up front
  if (sentences[0] && sentences[0].split(/\s+/).length <= 30) answerBlock += 10; // crisp opening answer
  if (/\b(\d|%|\$)/.test(first60)) answerBlock += 4; // a concrete fact early
  if (clean.length > 80) answerBlock += 4; // substantive enough to quote
  answerBlock = Math.min(30, answerBlock);

  // 2. Self-Containment (25) — optimal length, low pronoun density, named entities.
  let selfContainment = 0;
  if (words >= 134 && words <= 167) selfContainment += 10;
  else if (words >= 100 && words <= 200) selfContainment += 7;
  else if (words >= 60) selfContainment += 4;
  const pronouns = (clean.match(STOP_PRONOUNS) ?? []).length;
  if (words > 0 && pronouns / words < 0.02) selfContainment += 8;
  else if (words > 0 && pronouns / words < 0.04) selfContainment += 4;
  if (countNamedEntities(clean) >= 3) selfContainment += 7;
  selfContainment = Math.min(25, selfContainment);

  // 3. Structural Readability (20) — sentence length, transitions, lists.
  let readability = 0;
  const avgLen = sentences.length ? words / sentences.length : words;
  if (avgLen >= 10 && avgLen <= 20) readability += 8;
  else if (avgLen >= 8 && avgLen <= 25) readability += 5;
  if (TRANSITIONS.test(clean)) readability += 4;
  if (NUMBERED.test(text ?? "")) readability += 4;
  if (BULLET.test(text ?? "")) readability += 4;
  readability = Math.min(20, readability);

  // 4. Statistical Density (15) — %, $, recent years, named sources.
  let stat = 0;
  stat += Math.min(6, (clean.match(/\d+(\.\d+)?\s?%/g) ?? []).length * 3);
  stat += Math.min(5, (clean.match(/[$€£]\s?\d/g) ?? []).length * 3);
  if (RECENT_YEAR.test(clean)) stat += 2;
  if (NAMED_SOURCE.test(clean)) stat += 2;
  stat = Math.min(15, stat);

  // 5. Uniqueness (10) — original research, case studies, tool mentions.
  let uniqueness = 0;
  if (ORIGINAL.test(clean)) uniqueness += 5;
  if (CASE_STUDY.test(clean)) uniqueness += 3;
  if (TOOL_MENTION.test(clean)) uniqueness += 2;
  uniqueness = Math.min(10, uniqueness);

  const score = Math.round(answerBlock + selfContainment + readability + stat + uniqueness);
  return { score, grade: grade(score), words, breakdown: { answerBlock, selfContainment, readability, statisticalDensity: stat, uniqueness } };
}

/**
 * Page-level citability: score each section body + FAQ answer as a passage, average them,
 * and surface the most impactful improvements. Deterministic, no network/LLM.
 */
export function scoreCitability(page: {
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
  heroCopy: string;
}): CitabilityResult {
  const passages: PassageScore[] = [
    ...page.sections.map((s) => scorePassage(s.body)),
    ...page.faqs.map((f) => scorePassage(f.a)),
  ].filter((p) => p.words >= 20); // ignore stubs

  if (passages.length === 0) {
    return { score: 0, grade: "F", passages: 0, suggestions: ["Add substantive section and FAQ content (each passage 130–170 words, answer-first)."] };
  }

  const score = Math.round(passages.reduce((a, p) => a + p.score, 0) / passages.length);
  const avg = (sel: (b: PassageScore["breakdown"]) => number) => passages.reduce((a, p) => a + sel(p.breakdown), 0) / passages.length;

  // Suggestions for whichever dimensions are furthest below their ceiling.
  const gaps: { msg: string; gap: number }[] = [
    { msg: "Open each section/FAQ with a direct, self-contained answer (definition or crisp claim) in the first sentence — AI engines quote it verbatim.", gap: 30 - avg((b) => b.answerBlock) },
    { msg: "Target 130–170 words per passage, reduce pronouns, and name concrete entities so each block stands alone.", gap: 25 - avg((b) => b.selfContainment) },
    { msg: "Use 10–20-word sentences and add bullet/numbered lists for scannable structure.", gap: 20 - avg((b) => b.readability) },
    { msg: "Add brand-grounded specifics (figures, dates, named sources) — never fabricated.", gap: 15 - avg((b) => b.statisticalDensity) },
    { msg: "Include a differentiator: original data, a case study, or a named tool/process.", gap: 10 - avg((b) => b.uniqueness) },
  ];
  const suggestions = gaps.sort((a, b) => b.gap - a.gap).slice(0, 3).filter((g) => g.gap > 2).map((g) => g.msg);

  return { score, grade: grade(score), passages: passages.length, suggestions };
}
