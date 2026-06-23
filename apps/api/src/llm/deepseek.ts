import { fetchWithTimeout } from "../common/http";
import { specFor } from "./page-type-spec";

/**
 * DeepSeek content drafter (OpenAI-compatible). Generates real page drafts.
 * Returns null on any failure (missing key, 402 balance, parse error) so the
 * caller falls back to the deterministic template — i.e. it's wired and ready,
 * and flips to live AI the moment the account has balance.
 */
export interface DraftContent {
  metaTitle: string;
  metaDescription: string;
  heroCopy: string;
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
}

/** Neutral fallback when no Brand Memory is supplied — never a hardcoded brand. */
const NEUTRAL_BRAND_HINT =
  "the customer's brand (no Brand Memory provided — write accurate, brand-neutral copy and avoid inventing claims)";

export async function draftPageContent(
  query: string,
  pageType: string,
  brandHint?: string,
): Promise<DraftContent | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const brand = brandHint?.trim() || NEUTRAL_BRAND_HINT;
  const spec = specFor(pageType);
  const bodyLen =
    spec.depth === "long"
      ? "3-4 focused paragraphs with concrete specifics, real mechanisms, and numbers"
      : spec.depth === "short"
        ? "2 direct paragraphs — dense with specifics, no filler"
        : "2-3 substantive paragraphs";
  const system =
    "You are a world-class SEO + GEO (generative engine optimization) content writer. You produce accurate, specific content that ranks on Google AND gets cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews). Respond ONLY with JSON.";
  const user = `Brand: ${brand}
Write a ${spec.label} (page type: ${pageType}) targeting the search query "${query}".
This page is ${spec.role}.

SEO + quality rules:
- Keyword placement: use "${query}" naturally within the first 100 words and in at least one section heading.
- Depth: write ${bodyLen} per section. Real mechanisms, concrete examples, specific numbers — no vague filler, no repetition.
- Semantic coverage: naturally include related terms and entities a search engine expects for this topic (LSI keywords, subtopics, named concepts).
- Answer-first: open each section with a direct, self-contained, quotable answer to its implied question. AI engines extract and cite these — make them standalone.
- E-E-A-T signals: demonstrate experience and expertise through specific processes, real outcomes, and authoritative details. Cite plausible benchmarks where appropriate.
- Structure: where it aids comprehension, embed lists or numbered steps inside the body (use "- " bullets or "1. " steps on their own lines).
- FAQs: each answer is a complete, standalone 2-3 sentence response that directly answers the question.
- Accuracy: never invent statistics, customers, or claims not grounded in the brand context.

Section arc (adapt wording to brand + query; keep arc and order):
${spec.sectionPlan.map((s, i) => `${i + 1}. ${s}`).join("\n")}
Return JSON exactly matching:
{"metaTitle": string (include "${query}", <=60 chars), "metaDescription": string (benefit-led, includes the keyword, <=155 chars), "heroCopy": string (2-3 sentences hooking the reader with the core value), "sections": [{"heading": string, "body": string}] (${spec.sectionPlan.length} items; each heading uses the keyword or a close variant when natural), "faqs": [{"q": string, "a": string}] (${spec.faqCount} items — questions people actually search)}`;

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
          // Per-type budget, but cap-able via LLM_MAX_TOKENS so a slow/host-limited
          // backend (e.g. Ollama behind Render's ~30s outbound window) can keep each
          // generation under the limit. Unset = full per-type budget (hosted/local-rich).
          max_tokens: Math.min(
            spec.depth === "long" ? 2400 : spec.depth === "short" ? 900 : 1600,
            Number(process.env.LLM_MAX_TOKENS) || Infinity,
          ),
        }),
      },
      // Local models (Ollama) are far slower than hosted APIs — make the budget configurable.
      Number(process.env.LLM_TIMEOUT_MS) || 30_000,
    );
    if (!res.ok) return null; // 402 insufficient balance, etc. → fallback
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as DraftContent;
    if (!parsed.metaTitle || !Array.isArray(parsed.sections)) return null;
    return parsed;
  } catch {
    return null;
  }
}
