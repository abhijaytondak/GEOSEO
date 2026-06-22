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
      ? "4-6 substantive paragraphs of specific, concrete body copy"
      : spec.depth === "short"
        ? "2-3 tight but specific sentences"
        : "2-4 substantive paragraphs";
  const system =
    "You are a world-class B2B SaaS SEO + GEO (generative engine optimization) content writer. You produce deeply researched, comprehensive content that ranks #1 on Google AND gets cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews). Respond ONLY with JSON.";
  const user = `Brand: ${brand}
Write a ${spec.label} (page type: ${pageType}) targeting the search query "${query}".
This page is ${spec.role}.

Content quality rules:
- Depth: write ${bodyLen} per section. Be specific and concrete — real mechanisms, concrete examples, numbers/benchmarks, step-by-step detail, trade-offs. No vague filler, no repetition, no marketing fluff.
- Answer-first: open each section with a direct, self-contained, quotable answer to its implied question (AI engines extract and cite these), then expand with evidence and detail.
- Structure for extraction: define key terms plainly; where it aids comprehension, embed lists or numbered steps INSIDE the body (use "- " bullets or "1. " steps on their own lines).
- Topical completeness: cover the closely-related sub-topics and entities a reader and search engine expect for this query.
- FAQs: each answer is a complete, standalone 2-4 sentence response (these power FAQPage rich results + AI answers).
- Accuracy: never invent statistics, customers, prices, or claims not grounded in the brand context.

Follow this section arc — adapt the exact wording to the brand and query, but keep the arc and order:
${spec.sectionPlan.map((s, i) => `${i + 1}. ${s}`).join("\n")}
Return JSON exactly matching:
{"metaTitle": string (compelling, <=60 chars), "metaDescription": string (benefit-led, <=155 chars), "heroCopy": string (2-3 sentences that hook the reader and state the core value), "sections": [{"heading": string, "body": string}] (${spec.sectionPlan.length} items, following the arc above; each body rich/multi-paragraph), "faqs": [{"q": string, "a": string}] (${spec.faqCount} items)}`;

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
          temperature: 0.7,
          // Per-type budget, but cap-able via LLM_MAX_TOKENS so a slow/host-limited
          // backend (e.g. Ollama behind Render's ~30s outbound window) can keep each
          // generation under the limit. Unset = full per-type budget (hosted/local-rich).
          max_tokens: Math.min(
            spec.depth === "long" ? 4096 : spec.depth === "short" ? 1400 : 2800,
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
