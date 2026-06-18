import { fetchWithTimeout } from "../common/http";

/**
 * DeepSeek-backed Brand Memory extractor (OpenAI-compatible). Reads a company's
 * own website copy and returns its real products, buyer personas, proof points,
 * terminology, and tone of voice — using ONLY facts present in the text, never
 * invented ones. Returns null on any failure (no key, 402 balance, parse error)
 * so the caller falls back to the heuristic crawl draft. Mirrors `deepseek.ts`.
 */
export interface ExtractedBrandLibrary {
  valueProp?: string;
  industry?: string;
  audience?: string;
  products: { name: string; description?: string; category?: string; pricing?: string }[];
  personas: { name: string; role?: string; painPoints?: string[]; goals?: string[]; buyingTriggers?: string[] }[];
  proofPoints: { type?: string; label: string; detail?: string }[];
  terminology: { preferred?: string[]; avoid?: string[] };
  voice: { tone?: string; traits?: string[]; guidance?: string };
}

export async function extractBrandLibrary(
  siteText: string,
  ctx: { url: string; company?: string },
): Promise<ExtractedBrandLibrary | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key || !siteText.trim()) return null;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const system =
    "You are a brand strategist extracting a company's real Brand Memory from its own website copy. " +
    "Use ONLY facts that appear in the provided text — never invent products, prices, statistics, customers, or claims. " +
    "If the text gives no basis for a field, return an empty array or empty string for it. Respond ONLY with JSON.";
  const user = `Website: ${ctx.url}
Company${ctx.company ? `: ${ctx.company}` : " (infer from the text)"}

Website text (between the triple quotes):
"""
${siteText.slice(0, 12000)}
"""

Return JSON exactly matching this shape:
{
  "valueProp": string (one sentence, what the company does — only from the text),
  "industry": string (short, e.g. "B2B SaaS · Analytics"),
  "audience": string (who they sell to, one sentence),
  "products": [{"name": string, "description": string, "category": string, "pricing": string}] (only real products/services found; omit pricing if not stated),
  "personas": [{"name": string, "role": string, "painPoints": [string], "goals": [string], "buyingTriggers": [string]}] (inferred buyer types the copy speaks to),
  "proofPoints": [{"type": "stat"|"testimonial"|"case-study"|"award"|"logo", "label": string, "detail": string}] (only real numbers/quotes/awards in the text),
  "terminology": {"preferred": [string], "avoid": [string]} (brand-specific terms the copy uses; avoid = [] unless clearly stated),
  "voice": {"tone": string (e.g. "professional", "friendly, confident"), "traits": [string] (adjectives), "guidance": string (1 sentence on how to write for this brand)}
}`;

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
          temperature: 0.3,
          max_tokens: 1800,
        }),
      },
      30_000,
    );
    if (!res.ok) return null; // 402 insufficient balance, etc. → heuristic fallback
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Partial<ExtractedBrandLibrary>;
    if (typeof parsed !== "object" || parsed === null) return null;
    // Normalize to the full shape so callers never deal with missing arrays.
    return {
      valueProp: typeof parsed.valueProp === "string" ? parsed.valueProp : undefined,
      industry: typeof parsed.industry === "string" ? parsed.industry : undefined,
      audience: typeof parsed.audience === "string" ? parsed.audience : undefined,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      personas: Array.isArray(parsed.personas) ? parsed.personas : [],
      proofPoints: Array.isArray(parsed.proofPoints) ? parsed.proofPoints : [],
      terminology: parsed.terminology ?? {},
      voice: parsed.voice ?? {},
    };
  } catch {
    return null;
  }
}
