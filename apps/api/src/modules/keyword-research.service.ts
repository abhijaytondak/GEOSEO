import { Injectable, Logger } from "@nestjs/common";
import { fetchWithTimeout } from "../common/http";
import { aiSearchKeywords } from "../llm/keywords";

/** A single keyword idea from the research provider (normalized across sources). */
export interface KeywordIdea {
  keyword: string;
  searchVolume: number;
  /** 0–100; higher = harder to rank. */
  difficulty: number;
  cpc: number;
  /** 0–1 paid competition. */
  competition: number;
}

/** Which provider actually produced the last result set. */
export type ResearchSource = "dataforseo" | "ai-search" | "autocomplete" | "mock";

interface DfsItem {
  keyword?: string;
  keyword_info?: { search_volume?: number; competition?: number; cpc?: number };
  keyword_properties?: { keyword_difficulty?: number };
}
interface DfsResponse {
  tasks?: { result?: { items?: DfsItem[] }[] }[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Stable pseudo-metric seed so estimated numbers are deterministic per keyword. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const COMMERCIAL =
  /\b(buy|price|pricing|cost|best|top|software|tool|tools|platform|service|services|vs|versus|alternative|alternatives|review|reviews|cheap|free|company|companies|solution|solutions|agency|vendor|quote|demo)\b/i;

/**
 * Buyer-intent keyword research with a tiered, env-gated provider chain — never throws:
 *   1. DataForSEO Labs (real volume/difficulty/CPC) when `DATAFORSEO_LOGIN`+`DATAFORSEO_PASSWORD` set.
 *   2. Google Autocomplete (FREE, no key) — real keyword *ideas* (what people actually type) with
 *      deterministic *estimated* metrics. Always on unless `KEYWORD_AUTOCOMPLETE=false`.
 *   3. `[]` → the caller falls back to its deterministic seed logic.
 * `source` reports which tier produced the last result so the UI can label real-vs-estimated data.
 */
@Injectable()
export class KeywordResearchService {
  private readonly log = new Logger(KeywordResearchService.name);
  private last: ResearchSource | null = null;

  /** DataForSEO configured — also drives the Settings "dataforseo" integration row. */
  get configured(): boolean {
    return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
  }

  get autocompleteEnabled(): boolean {
    return process.env.KEYWORD_AUTOCOMPLETE !== "false";
  }

  /** AI-search tier is available when the shared LLM seam has a key. */
  get aiSearchEnabled(): boolean {
    return Boolean(process.env.DEEPSEEK_API_KEY);
  }

  get source(): ResearchSource {
    return (
      this.last ??
      (this.configured ? "dataforseo" : this.aiSearchEnabled ? "ai-search" : this.autocompleteEnabled ? "autocomplete" : "mock")
    );
  }

  /** Expand seed terms into keyword ideas. Returns [] when no provider yields results. */
  async researchKeywords(
    seeds: string[],
    opts: { locationName?: string; languageCode?: string; limit?: number } = {},
  ): Promise<KeywordIdea[]> {
    const terms = seeds.map((s) => s.trim()).filter(Boolean).slice(0, 20);
    const limit = clamp(opts.limit ?? 24, 1, 100);
    if (terms.length === 0) {
      this.last = "mock";
      return [];
    }

    if (this.configured) {
      const dfs = await this.viaDataForSeo(terms, opts, limit);
      if (dfs.length) {
        this.last = "dataforseo";
        return dfs;
      }
    }

    // AI-search tier — real buyer queries from an LLM acting as an answer engine
    // (Gushwork parity: "keywords from Google AND AI search engines"). Metrics estimated.
    if (this.aiSearchEnabled) {
      const phrases = await aiSearchKeywords(terms, limit);
      if (phrases && phrases.length) {
        this.last = "ai-search";
        return phrases.map((kw) => ({ keyword: kw, ...this.estimateMetrics(kw) }));
      }
    }

    if (this.autocompleteEnabled) {
      const ac = await this.viaAutocomplete(terms, limit);
      if (ac.length) {
        this.last = "autocomplete";
        return ac;
      }
    }

    this.last = "mock";
    return [];
  }

  /** DataForSEO Labs keyword_ideas — real metrics. */
  private async viaDataForSeo(
    terms: string[],
    opts: { locationName?: string; languageCode?: string },
    limit: number,
  ): Promise<KeywordIdea[]> {
    const base = (process.env.DATAFORSEO_BASE_URL ?? "https://api.dataforseo.com").replace(/\/+$/, "");
    const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
    try {
      const res = await fetchWithTimeout(
        `${base}/v3/dataforseo_labs/google/keyword_ideas/live`,
        {
          method: "POST",
          headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
          body: JSON.stringify([
            {
              keywords: terms,
              location_name: opts.locationName ?? "United States",
              language_code: opts.languageCode ?? "en",
              limit,
            },
          ]),
        },
        15_000,
      );
      if (!res.ok) {
        this.log.warn(`DataForSEO ${res.status} — trying free providers`);
        return [];
      }
      const json = (await res.json()) as DfsResponse;
      const items = json.tasks?.[0]?.result?.[0]?.items ?? [];
      return items
        .map((it): KeywordIdea | null => {
          const keyword = (it.keyword ?? "").trim();
          if (!keyword) return null;
          const info = it.keyword_info ?? {};
          const competition = typeof info.competition === "number" ? info.competition : 0;
          const difficulty =
            typeof it.keyword_properties?.keyword_difficulty === "number"
              ? clamp(it.keyword_properties.keyword_difficulty, 1, 99)
              : clamp(competition * 100, 1, 99);
          return {
            keyword,
            searchVolume: Math.max(0, Math.round(info.search_volume ?? 0)),
            difficulty,
            cpc: Math.max(0, info.cpc ?? 0),
            competition: clamp(competition * 100, 0, 100) / 100,
          };
        })
        .filter((x): x is KeywordIdea => x !== null)
        .slice(0, limit);
    } catch (err) {
      this.log.warn(`DataForSEO request failed (${err instanceof Error ? err.message : "unknown"})`);
      return [];
    }
  }

  /** Google Autocomplete — free, keyless. Real suggestions; metrics are deterministic estimates. */
  private async viaAutocomplete(terms: string[], limit: number): Promise<KeywordIdea[]> {
    const out = new Map<string, KeywordIdea>();
    for (const term of terms.slice(0, 6)) {
      try {
        const res = await fetchWithTimeout(
          `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(term)}`,
          { headers: { accept: "application/json" } },
          6_000,
        );
        if (!res.ok) continue;
        const parsed = JSON.parse(await res.text()) as [string, string[]];
        const suggestions = Array.isArray(parsed?.[1]) ? parsed[1] : [];
        for (const raw of [term, ...suggestions]) {
          const kw = String(raw).trim().toLowerCase();
          if (!kw || out.has(kw)) continue;
          out.set(kw, { keyword: kw, ...this.estimateMetrics(kw) });
          if (out.size >= limit) break;
        }
      } catch {
        // skip this seed; other seeds / fallback still apply
      }
      if (out.size >= limit) break;
    }
    return [...out.values()].slice(0, limit);
  }

  /** Deterministic, plausible metric estimates for a keyword (used by the keyless autocomplete tier). */
  private estimateMetrics(keyword: string): Omit<KeywordIdea, "keyword"> {
    const words = keyword.split(/\s+/).filter(Boolean).length || 1;
    const h = hashStr(keyword);
    const commercial = COMMERCIAL.test(keyword);
    const searchVolume = clamp(Math.round(3200 / words + (h % 900) - 100), 10, 9900);
    const difficulty = clamp(64 - words * 9 + (commercial ? 8 : 0) + (h % 16), 4, 92);
    const cpc = Math.round(((commercial ? 2.2 : 0.5) + (h % 100) / 50) * 100) / 100;
    const competition = clamp(difficulty + (commercial ? 6 : -6), 0, 100) / 100;
    return { searchVolume, difficulty, cpc, competition };
  }
}
