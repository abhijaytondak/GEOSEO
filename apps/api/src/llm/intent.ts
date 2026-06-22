import { fetchWithTimeout } from "../common/http";
import type { FunnelStage, SearchIntent } from "@geoseo/types";

export interface ClassifiedIntent {
  intent: SearchIntent;
  stage: FunnelStage;
}

const INTENTS: SearchIntent[] = ["informational", "commercial", "transactional", "navigational", "local", "comparison"];
const STAGES: FunnelStage[] = ["research", "consideration", "ready-to-buy"];

/**
 * LLM intent refinement (PRD Phase 5 — Intent Mapping #2). Classifies a batch of
 * keywords by search intent AND buyer funnel stage (research vs ready-to-buy) in
 * ONE call. Uses the shared OpenAI-compatible seam (Puter/DeepSeek via DEEPSEEK_*).
 * Returns a keyword→{intent,stage} map, or null on no-key/failure so the caller
 * falls back to the regex heuristic — never throws.
 */
export async function classifyIntents(keywords: string[]): Promise<Record<string, ClassifiedIntent> | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  const terms = [...new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))].slice(0, 40);
  if (!key || terms.length === 0) return null;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const user = `Classify each search keyword by intent and buyer funnel stage.
intent ∈ ${JSON.stringify(INTENTS)}
stage ∈ ${JSON.stringify(STAGES)} ("research" = early/learning, "consideration" = comparing options, "ready-to-buy" = high purchase intent)
Keywords:
${terms.map((t) => `- ${t}`).join("\n")}
Return JSON exactly: {"results":[{"keyword":string,"intent":string,"stage":string}]}`;

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
          temperature: 0,
          max_tokens: 1400,
        }),
      },
      Number(process.env.LLM_TIMEOUT_MS) || 25_000,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { results?: { keyword?: string; intent?: string; stage?: string }[] };
    if (!Array.isArray(parsed.results)) return null;
    const map: Record<string, ClassifiedIntent> = {};
    for (const r of parsed.results) {
      const kw = String(r.keyword ?? "").trim().toLowerCase();
      const intent = r.intent as SearchIntent;
      const stage = r.stage as FunnelStage;
      if (kw && INTENTS.includes(intent) && STAGES.includes(stage)) map[kw] = { intent, stage };
    }
    return Object.keys(map).length ? map : null;
  } catch {
    return null;
  }
}
