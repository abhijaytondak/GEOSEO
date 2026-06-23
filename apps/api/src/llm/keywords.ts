import { fetchWithTimeout } from "../common/http";

/**
 * AI-search keyword sourcing (PRD Phase 5 — Keyword Research #1). Generates real
 * buyer-intent queries people ask AI assistants about the seed topics — a tier
 * Google/DataForSEO miss. Optional brand context (industry + audience) focuses
 * output toward the actual business type. Returns null on no-key/failure so the
 * caller falls back to the keyless tiers — never throws.
 */
export async function aiSearchKeywords(
  seeds: string[],
  limit: number,
  context?: { industry?: string; audience?: string },
): Promise<string[] | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const businessCtx = [context?.industry, context?.audience].filter(Boolean).join(", ");
  const ctxLine = businessCtx ? `Business context: ${businessCtx}.` : "";

  const user = `Generate up to ${limit} buyer-intent search queries for these topics: ${seeds.join(", ")}.
${ctxLine}
Mix question-form queries (how to, what is, best, guide) with commercial queries (vs, pricing, near me, services, hire, cost). Prioritise longer-tail phrases (3-6 words) that show clear purchase or research intent. Real phrases people actually search — no generic titles.
Return JSON exactly: {"keywords": string[]}`;

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: user }],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 500,
        }),
      },
      Number(process.env.LLM_TIMEOUT_MS) || 20_000,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { keywords?: unknown } | unknown[];
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { keywords?: unknown }).keywords)
        ? ((parsed as { keywords: unknown[] }).keywords)
        : null;
    if (!arr) return null;
    return [...new Set(arr.map((k) => String(k).trim().toLowerCase()).filter(Boolean))].slice(0, limit);
  } catch {
    return null;
  }
}
