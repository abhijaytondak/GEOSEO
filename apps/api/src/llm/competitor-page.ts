import type { CompetitorPageAnalysis, CompetitorPageStructure } from "@geoseo/types";
import { assertSafeUrl, safeFetchText } from "../common/ssrf";
import { fetchWithTimeout } from "../common/http";

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

const tagText = (html: string, re: RegExp): string[] => {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const t = decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    if (t) out.push(t);
  }
  return out;
};

/** Deterministic structural signals from raw HTML — no LLM needed. */
function extractStructure(html: string): { title: string; structure: CompetitorPageStructure; excerpt: string } {
  const title = decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").replace(/<[^>]+>/g, " ")).slice(0, 160);
  const metaDescription = decode(
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ??
      /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html)?.[1] ??
      "",
  ).slice(0, 300);
  const h2s = tagText(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).slice(0, 12);
  const headings = (html.match(/<h[1-3][^>]*>/gi) ?? []).length;
  const images = (html.match(/<img\b/gi) ?? []).length;
  const hasSchema = /application\/ld\+json/i.test(html);
  const hasFaq = /faqpage/i.test(html) || h2s.some((h) => /faq|frequently asked|questions?/i.test(h));
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const words = decode(text).split(/\s+/).filter(Boolean);
  return {
    title,
    structure: { wordCount: words.length, headings, sections: h2s, images, hasSchema, hasFaq, metaDescription },
    excerpt: words.slice(0, 350).join(" "),
  };
}

/** Heuristic vulnerabilities — derived purely from structure, always available. */
function heuristicVulns(s: CompetitorPageStructure): string[] {
  const v: string[] = [];
  if (!s.hasSchema) v.push("No structured data (JSON-LD) — add schema to win rich results and AI citations.");
  if (!s.hasFaq) v.push("No FAQ section — add one with FAQPage schema to capture question queries.");
  if (s.wordCount < 600) v.push(`Thin content (~${s.wordCount} words) — a more comprehensive page can outrank it.`);
  if (s.headings < 3) v.push("Shallow structure — few sections; a clearer H2 outline can win depth signals.");
  if (s.images === 0) v.push("No visuals — add diagrams/infographics for engagement and shareability.");
  if (!s.metaDescription) v.push("Missing meta description — weaker SERP snippet you can beat.");
  return v;
}

/**
 * Page-level competitor analysis (PRD Phase 5 — Competitor Tracking #3). Crawls a
 * competitor URL (SSRF-guarded), extracts structure deterministically, derives
 * heuristic vulnerabilities, then enriches with an LLM (Puter/DeepSeek via the
 * shared seam) for summary/strengths/recommendation when a key is present.
 * SSRF/invalid URLs throw (caller → 400); fetch failures degrade to crawled:false.
 */
export async function analyzeCompetitorPage(rawUrl: string): Promise<CompetitorPageAnalysis> {
  const url = await assertSafeUrl(rawUrl); // throws on unsafe/invalid → caller returns 400
  const now = new Date().toISOString();
  let html = "";
  try {
    html = (await safeFetchText(url, { maxBytes: 800_000, timeoutMs: 10_000 })).html;
  } catch {
    html = "";
  }

  if (!html || html.length < 200) {
    return {
      url,
      crawled: false,
      title: "",
      structure: { wordCount: 0, headings: 0, sections: [], images: 0, hasSchema: false, hasFaq: false, metaDescription: "" },
      summary: "Could not fetch this page (it may redirect, block crawlers, or be empty).",
      strengths: [],
      vulnerabilities: [],
      recommendation: "Try the canonical URL (e.g. the www/https version) or a specific article URL.",
      source: "heuristic",
      generatedAt: now,
    };
  }

  const { title, structure, excerpt } = extractStructure(html);
  const heur = heuristicVulns(structure);
  const enriched = await llmEnrich(url, title, structure, excerpt);

  return {
    url,
    crawled: true,
    title,
    structure,
    summary: enriched?.summary ?? `Page targeting "${title || url}" — ${structure.wordCount} words across ${structure.headings} headings.`,
    strengths:
      enriched?.strengths ??
      [
        structure.hasSchema ? "Uses structured data" : null,
        structure.wordCount >= 1200 ? "In-depth, comprehensive content" : null,
        structure.hasFaq ? "Has an FAQ section" : null,
      ].filter((x): x is string => Boolean(x)),
    // merge LLM + heuristic vulns, dedup, cap
    vulnerabilities: [...new Set([...(enriched?.vulnerabilities ?? []), ...heur])].slice(0, 8),
    recommendation:
      enriched?.recommendation ??
      "Publish a deeper, schema-rich page on the same intent with an FAQ and original visuals to outrank it.",
    source: enriched ? "llm" : "heuristic",
    generatedAt: now,
  };
}

interface Enriched {
  summary: string;
  strengths: string[];
  vulnerabilities: string[];
  recommendation: string;
}

async function llmEnrich(
  url: string,
  title: string,
  s: CompetitorPageStructure,
  excerpt: string,
): Promise<Enriched | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const user = `Analyse this competitor web page for SEO/content strategy.
URL: ${url}
Title: ${title}
Structure: ${s.wordCount} words, ${s.headings} headings, ${s.images} images, schema=${s.hasSchema}, faq=${s.hasFaq}
Section headings: ${s.sections.join(" | ")}
Content excerpt: ${excerpt}

Return JSON exactly: {"summary": string (1-2 sentences on what it targets), "strengths": string[] (2-4 why it ranks), "vulnerabilities": string[] (2-5 specific, exploitable weaknesses or content gaps), "recommendation": string (1 sentence: how to outrank it)}`;
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
          max_tokens: 900,
        }),
      },
      Number(process.env.LLM_TIMEOUT_MS) || 25_000,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const p = JSON.parse(content) as Partial<Enriched>;
    if (!p.summary || !Array.isArray(p.vulnerabilities)) return null;
    return {
      summary: String(p.summary),
      strengths: (p.strengths ?? []).map(String).slice(0, 4),
      vulnerabilities: p.vulnerabilities.map(String).slice(0, 5),
      recommendation: String(p.recommendation ?? ""),
    };
  } catch {
    return null;
  }
}
