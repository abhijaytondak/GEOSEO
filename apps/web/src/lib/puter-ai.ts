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

export async function draftWithPuter(query: string, pageType: string): Promise<PuterDraft | null> {
  const chat = typeof window !== "undefined" ? window.puter?.ai?.chat : undefined;
  if (!chat) return null;

  const prompt = `You are an expert B2B SaaS SEO writer for Northwind Labs — warehouse-native product analytics with AI that explains why metrics move (audience: heads of product/growth at B2B SaaS).
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
