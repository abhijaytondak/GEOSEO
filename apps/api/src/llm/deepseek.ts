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

const BRAND_HINT =
  "Northwind Labs — warehouse-native product analytics with AI that explains why metrics move. Audience: heads of product/growth at B2B SaaS.";

export async function draftPageContent(
  query: string,
  pageType: string,
): Promise<DraftContent | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const system =
    "You are an expert B2B SaaS SEO content writer. Write clear, specific, non-generic copy with no unsupported claims. Respond ONLY with JSON.";
  const user = `Brand: ${BRAND_HINT}
Write a ${pageType} page targeting the search query "${query}".
Return JSON exactly matching:
{"metaTitle": string (<=60 chars), "metaDescription": string (<=155 chars), "heroCopy": string (1-2 sentences), "sections": [{"heading": string, "body": string}] (3 items), "faqs": [{"q": string, "a": string}] (2 items)}`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
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
        max_tokens: 1200,
      }),
    });
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
