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

export async function draftWithPuter(query: string, pageType: string, brandHint?: string): Promise<PuterDraft | null> {
  const chat = typeof window !== "undefined" ? window.puter?.ai?.chat : undefined;
  if (!chat) return null;

  const brand = brandHint?.trim() || "the customer's brand (no Brand Memory provided — write accurate, brand-neutral copy)";
  const prompt = `You are an expert B2B SaaS SEO writer for ${brand}.
Write a ${pageType} page targeting the search query "${query}".
Respond ONLY with minified JSON (no markdown, no code fences) matching exactly:
{"metaTitle":"<=60 chars","metaDescription":"<=155 chars","heroCopy":"1-2 sentences","sections":[{"heading":"","body":""}],"faqs":[{"q":"","a":""}]}
Use 3 sections and 2 faqs.`;

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
