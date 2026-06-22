import { fetchWithTimeout } from "../common/http";

/**
 * AI-search keyword sourcing (PRD Phase 5 — Keyword Research #1). Asks the LLM,
 * acting as an AI answer engine, for the real buyer-intent queries people put to
 * AI assistants about the seed topics — a tier Google/DataForSEO miss. Uses the
 * shared OpenAI-compatible seam (Puter/DeepSeek via the DEEPSEEK_* env). Returns
 * null on no-key/failure so the caller falls back to the keyless tiers — never throws.
 */
export async function aiSearchKeywords(seeds: string[], limit: number): Promise<string[] | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const user = `You are an AI search engine (like ChatGPT, Perplexity, or Gemini).
For these topics: ${seeds.join(", ")}
List up to ${limit} REAL buyer-intent search queries people actually ask AI assistants — a mix of research-stage ("how/what/best") and ready-to-buy ("pricing/vs/for [use-case]") phrasing. No numbering, no fluff.
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
          temperature: 0.5,
          max_tokens: 700,
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
