import { fetchWithTimeout } from "../common/http";

export interface DiscoveredCompetitor {
  name: string;
  domain: string;
}

/**
 * Dynamically discover a brand's direct competitors via the LLM
 * (OpenAI-compatible chat completions). Works for ANY company from its
 * name / industry / value proposition — no per-industry hardcoding.
 *
 * Returns [] on any failure (missing key, 402 balance, parse error) so the
 * caller falls back to SERP / declared-competitor heuristics. It's wired and
 * ready, and flips to live discovery the moment the LLM account has balance
 * (or any OpenAI-compatible `DEEPSEEK_*` endpoint is configured).
 */
export async function discoverCompetitors(ctx: {
  company?: string;
  industry?: string;
  valueProp?: string;
  domain?: string;
}): Promise<DiscoveredCompetitor[]> {
  const key = process.env.DEEPSEEK_API_KEY;
  const company = ctx.company?.trim();
  if (!key || !company) return [];

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const system =
    "You are a market-intelligence analyst. Given a company, identify its real, direct competitors — actual companies in the same market that a buyer would compare it against. Never invent companies. Respond ONLY with JSON.";
  const user = `Company: ${company}${ctx.domain ? ` (website: ${ctx.domain})` : ""}
Industry: ${ctx.industry?.trim() || "infer from the company and website"}
${ctx.valueProp?.trim() ? `What they do: ${ctx.valueProp.trim()}` : ""}

List the 8 most relevant DIRECT competitors — real, well-known companies in the same market${ctx.domain ? " (prefer the same country/region when the brand is regional)" : ""}.
Return JSON exactly matching:
{"competitors": [{"name": string, "domain": string}]}
where "domain" is the competitor's primary website host only (e.g. "voltas.com") — no protocol, no path, no "www".`;

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
          temperature: 0.4,
          max_tokens: 700,
        }),
      },
      30_000,
    );
    if (!res.ok) return []; // 402 insufficient balance, etc. → fallback
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { competitors?: { name?: string; domain?: string }[] };
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
