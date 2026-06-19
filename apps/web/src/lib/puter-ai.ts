/**
 * Browser-side AI via Puter.js (user-pays model — no API key/balance needed).
 * Drafts page content client-side; the result is persisted through our API.
 * Returns null if Puter isn't available or the call fails, so callers fall
 * back to the server (DeepSeek) → template path.
 */
export interface PuterDraft {
  metaTitle: string;
  metaDescription: string;
  heroCopy: string;
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
}

type PuterChat = (prompt: string, opts?: { model?: string }) => Promise<unknown>;
declare global {
  interface Window {
    puter?: { ai?: { chat?: PuterChat } };
  }
}

export function puterReady(): boolean {
  return typeof window !== "undefined" && typeof window.puter?.ai?.chat === "function";
}

/**
 * Per-page-type writing spec — MIRRORS apps/api/src/llm/page-type-spec.ts so the
 * browser (Puter) draft is as rich and structurally distinct as the server one.
 * Keep the two in sync (the arcs change rarely).
 */
const PAGE_SPEC: Record<string, { role: string; sections: string[]; faqs: number }> = {
  landing: { role: "a conversion-focused landing page that turns commercial-intent visitors into demos or signups", sections: ["The problem you're solving", "How it works", "Key capabilities", "Proof & outcomes", "Who it's for"], faqs: 4 },
  service: { role: "a benefit-focused service page for one specific service, conversion-ready and structured for AI comprehension", sections: ["What this service includes", "The benefits you get", "Our process", "Why choose us", "Plans & pricing"], faqs: 4 },
  guide: { role: "a long-form, genuinely useful, authoritative article structured for readability and for AI engines to cite", sections: ["What it is and why it matters", "How it works, step by step", "Best practices", "Common mistakes to avoid", "Real-world examples", "Key takeaways"], faqs: 6 },
  comparison: { role: "an honest buyer-evaluation comparison that helps a ready-to-decide reader pick the right option", sections: ["TL;DR — the verdict", "Feature-by-feature comparison", "Pricing comparison", "When to choose each", "Switching & migration"], faqs: 5 },
  faq: { role: "an answer-dense FAQ page that resolves buyer questions and is structured for AI answer engines", sections: ["Quick overview"], faqs: 10 },
  resource: { role: "a practical resource (template, checklist, or toolkit) the reader can act on immediately", sections: ["What's inside", "How to use it", "A worked example", "Tips to get the most from it"], faqs: 4 },
  local: { role: "a location-focused page that wins local intent and converts nearby buyers", sections: ["Services we offer locally", "Why choose a local provider", "Areas we cover", "What to expect"], faqs: 4 },
};

/** Rich-content + AI-search optimization rules shared by the browser and server drafters. */
export const RICH_CONTENT_RULES = `Write deeply researched, genuinely useful content — the kind that ranks #1 on Google AND gets cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews). Rules:
- Depth: 2-4 substantive paragraphs per section (long-form sections more). Be specific and concrete — real mechanisms, concrete examples, numbers/benchmarks, step-by-step detail, and trade-offs. No vague filler, no repetition, no marketing fluff.
- Answer-first: open each section with a direct, self-contained, quotable answer to its implied question (this is what AI engines extract and cite), then expand with evidence and detail.
- Structure for extraction: define key terms plainly; where it aids comprehension, embed lists or numbered steps INSIDE the body (use "- " bullets or "1. " steps on their own lines).
- Topical completeness: cover the closely-related sub-topics and entities a reader and a search engine expect for this query, so the page is comprehensive, not shallow.
- FAQs: each answer is a complete, standalone 2-4 sentence response (these power FAQPage rich results + AI answers).
- Accuracy: never invent statistics, customers, prices, or claims not grounded in the brand context. Truthful and useful over promotional.`;

export async function draftWithPuter(query: string, pageType: string, brandHint?: string): Promise<PuterDraft | null> {
  const chat = typeof window !== "undefined" ? window.puter?.ai?.chat : undefined;
  if (!chat) return null;

  const brand = brandHint?.trim() || "the customer's brand (no Brand Memory provided — write accurate, brand-neutral copy)";
  const spec = PAGE_SPEC[pageType] ?? PAGE_SPEC.landing;
  const arc = spec.sections.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const prompt = `You are a world-class B2B SaaS SEO + GEO (generative engine optimization) content writer for ${brand}.
Write ${spec.role}. The page targets the search query "${query}".

${RICH_CONTENT_RULES}

Follow this section arc — adapt the exact heading wording to the brand and query, but keep the arc and order:
${arc}

Respond ONLY with minified JSON (no markdown, no code fences) matching exactly:
{"metaTitle":"compelling, <=60 chars","metaDescription":"benefit-led, <=155 chars","heroCopy":"2-3 sentences that hook the reader and state the core value","sections":[{"heading":"","body":""}],"faqs":[{"q":"","a":""}]}
Produce exactly ${spec.sections.length} sections (following the arc) and ${spec.faqs} faqs. Each section body must be rich — multiple paragraphs.`;

  try {
    const resp = await chat(prompt, { model: "gpt-4o-mini" });
    const r = resp as { message?: { content?: string }; text?: string };
    let text = typeof resp === "string" ? resp : (r.message?.content ?? r.text ?? "");
    text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(text) as PuterDraft;
    if (!parsed.metaTitle || !Array.isArray(parsed.sections)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface PuterBrandLibrary {
  valueProp?: string;
  products: { name: string; description?: string; category?: string; pricing?: string }[];
  personas: { name: string; role?: string; painPoints?: string[]; goals?: string[]; buyingTriggers?: string[] }[];
  proofPoints: { type?: string; label: string; detail?: string }[];
  terminology: { preferred?: string[]; avoid?: string[] };
  voice: { tone?: string; traits?: string[]; guidance?: string };
}

/**
 * Browser-AI Brand Memory extraction via Puter (no server key — the signed-in Puter user
 * pays). Reads the crawled site text and returns real products / personas / proof / terminology /
 * tone of voice. Returns null if Puter is unavailable or the call fails, so callers keep the
 * server's heuristic draft. Mirrors `draftWithPuter` (same parse + fallback contract).
 */
export async function extractBrandLibraryWithPuter(
  siteText: string,
  ctx: { url: string; company?: string },
): Promise<PuterBrandLibrary | null> {
  const chat = typeof window !== "undefined" ? window.puter?.ai?.chat : undefined;
  if (!chat || !siteText.trim()) return null;

  const prompt = `You are a brand strategist extracting a company's real Brand Memory from its own website copy. Use ONLY facts present in the text — never invent products, prices, statistics, customers, or claims. If the text gives no basis for a field, use an empty array or empty string.
Website: ${ctx.url}
Company: ${ctx.company || "infer from the text"}

Website text (truncated):
"""${siteText.slice(0, 14000)}"""

Respond ONLY with minified JSON (no markdown, no code fences) matching exactly:
{"valueProp":"","products":[{"name":"","description":"","category":"","pricing":""}],"personas":[{"name":"","role":"","painPoints":[""],"goals":[""],"buyingTriggers":[""]}],"proofPoints":[{"type":"stat|testimonial|case-study|award|logo","label":"","detail":""}],"terminology":{"preferred":[""],"avoid":[""]},"voice":{"tone":"","traits":[""],"guidance":""}}`;

  try {
    const resp = await chat(prompt, { model: "gpt-4o-mini" });
    const r = resp as { message?: { content?: string }; text?: string };
    let text = typeof resp === "string" ? resp : (r.message?.content ?? r.text ?? "");
    text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    const p = JSON.parse(text) as Partial<PuterBrandLibrary>;
    if (typeof p !== "object" || p === null) return null;
    return {
      valueProp: typeof p.valueProp === "string" ? p.valueProp : undefined,
      products: Array.isArray(p.products) ? p.products : [],
      personas: Array.isArray(p.personas) ? p.personas : [],
      proofPoints: Array.isArray(p.proofPoints) ? p.proofPoints : [],
      terminology: p.terminology ?? {},
      voice: p.voice ?? {},
    };
  } catch {
    return null;
  }
}

export interface PuterCompetitor {
  name: string;
  domain: string;
}

/**
 * Dynamically discover a brand's direct competitors via browser AI (Puter) —
 * works for ANY company from its name / industry / value proposition, with no
 * server API key or balance. Returns [] if Puter is unavailable or the call
 * fails, so callers fall back to the server SERP / heuristic.
 */
export async function discoverCompetitorsWithPuter(ctx: {
  company?: string;
  industry?: string;
  valueProp?: string;
  domain?: string;
}): Promise<PuterCompetitor[]> {
  const chat = typeof window !== "undefined" ? window.puter?.ai?.chat : undefined;
  const company = ctx.company?.trim();
  if (!chat || !company) return [];

  const prompt = `You are a market-intelligence analyst. Identify the real, direct competitors of a company — actual companies in the same market a buyer would compare it against. Never invent companies.
Company: ${company}${ctx.domain ? ` (website: ${ctx.domain})` : ""}
Industry: ${ctx.industry?.trim() || "infer from the company and website"}
${ctx.valueProp?.trim() ? `What they do: ${ctx.valueProp.trim()}` : ""}
List the 8 most relevant DIRECT competitors${ctx.domain ? " (prefer the same country/region when the brand is regional)" : ""}.
Respond ONLY with minified JSON (no markdown, no code fences) matching exactly:
{"competitors":[{"name":"","domain":""}]}
where "domain" is the competitor's primary website host only (e.g. "voltas.com") — no protocol, path, or "www".`;

  try {
    const resp = await chat(prompt, { model: "gpt-4o-mini" });
    const r = resp as { message?: { content?: string }; text?: string };
    let text = typeof resp === "string" ? resp : (r.message?.content ?? r.text ?? "");
    text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(text) as { competitors?: { name?: string; domain?: string }[] };
    return (parsed.competitors ?? [])
      .map((c) => ({
        name: (c.name ?? "").trim(),
        domain: (c.domain ?? "")
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/.*$/, "")
          .trim(),
      }))
      .filter((c) => c.domain && c.domain.includes("."))
      .slice(0, 8);
  } catch {
    return [];
  }
}
