import { Injectable, Logger } from "@nestjs/common";

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

interface DfsItem {
  keyword?: string;
  keyword_info?: { search_volume?: number; competition?: number; cpc?: number };
  keyword_properties?: { keyword_difficulty?: number };
}
interface DfsResponse {
  tasks?: { result?: { items?: DfsItem[] }[] }[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/**
 * Buyer-intent keyword research. **Seam wired, key-gated:** when DataForSEO Basic-auth
 * creds (`DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`) are present it returns real keyword
 * ideas (volume/difficulty/CPC) from DataForSEO Labs; otherwise `researchKeywords` returns
 * `[]` and the caller falls back to its deterministic seed logic — so the product runs
 * today and flips to real data the moment a key is added (no code change). Never throws.
 */
@Injectable()
export class KeywordResearchService {
  private readonly log = new Logger(KeywordResearchService.name);

  get configured(): boolean {
    return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
  }

  get source(): "dataforseo" | "mock" {
    return this.configured ? "dataforseo" : "mock";
  }

  /** Expand seed terms into keyword ideas. Returns [] when unconfigured or on any failure. */
  async researchKeywords(
    seeds: string[],
    opts: { locationName?: string; languageCode?: string; limit?: number } = {},
  ): Promise<KeywordIdea[]> {
    const terms = seeds.map((s) => s.trim()).filter(Boolean).slice(0, 20);
    if (!this.configured || terms.length === 0) return [];

    const base = (process.env.DATAFORSEO_BASE_URL ?? "https://api.dataforseo.com").replace(/\/+$/, "");
    const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
    const limit = clamp(opts.limit ?? 24, 1, 100);

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(`${base}/v3/dataforseo_labs/google/keyword_ideas/live`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
        body: JSON.stringify([
          {
            keywords: terms,
            location_name: opts.locationName ?? "United States",
            language_code: opts.languageCode ?? "en",
            limit,
          },
        ]),
      });
      clearTimeout(timer);
      if (!res.ok) {
        this.log.warn(`DataForSEO ${res.status} — falling back to seed discovery`);
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
      this.log.warn(`DataForSEO request failed (${err instanceof Error ? err.message : "unknown"}) — seed fallback`);
      return [];
    }
  }
}
