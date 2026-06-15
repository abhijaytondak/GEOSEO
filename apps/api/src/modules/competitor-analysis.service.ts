import { Injectable, Logger } from "@nestjs/common";
import type {
  CompetitorAnalysis,
  CompetitorEntry,
  CompetitorSource,
  KeywordGap,
  SearchIntent,
} from "@geoseo/types";
import { fetchWithTimeout } from "../common/http";

/** A target keyword with its estimated metrics, fed in by the orchestrator. */
export interface KeywordSeed {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: SearchIntent;
}

/** One organic result: a ranked domain at a SERP position (1-based). */
interface SerpHit {
  domain: string;
  position: number;
}

const TOP_N = 10; // organic depth we consider "ranking"
const DEFAULT_KEYWORD_CAP = 8;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/** hash → deterministic pseudo-value, so the keyless heuristic is stable per input. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Normalize "https://www.Zomato.com/path" → "zomato.com". */
function normDomain(d: string): string {
  return d
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}

/** Hostname → registrable-ish domain (drops protocol/www/path). Null if unparseable. */
function hostToDomain(url: string): string | null {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return h || null;
  } catch {
    return null;
  }
}

/** Run `fn` over `items` with bounded concurrency (keeps SERP latency/usage sane). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Competitor intelligence over a **100% free, tiered SERP chain** — never throws:
 *   1. **Brave Search API** (`BRAVE_SEARCH_API_KEY`) — free tier, reliable from a datacenter IP.
 *   2. **DuckDuckGo HTML** — keyless, zero-config; best-effort (datacenter IPs may be throttled).
 *   3. **Heuristic** — declared competitors + deterministic estimates (always succeeds, labelled "Estimated").
 *
 * Given the brand domain + its target keywords, it finds who ranks for those keywords,
 * the keyword gaps (competitor ranks, you don't), and the brand's own visibility share.
 * `source` reports which tier produced the data so the UI can label real-vs-estimated.
 */
@Injectable()
export class CompetitorAnalysisService {
  private readonly log = new Logger(CompetitorAnalysisService.name);
  private last: CompetitorSource | null = null;

  /** Brave key present — also drives any future "competitor SERP" Settings row. */
  get configured(): boolean {
    return Boolean(process.env.BRAVE_SEARCH_API_KEY);
  }

  get source(): CompetitorSource {
    return this.last ?? this.preferred();
  }

  private get keywordCap(): number {
    const n = Number(process.env.COMPETITOR_SERP_KEYWORDS);
    return Number.isFinite(n) && n > 0 ? clamp(n, 1, 20) : DEFAULT_KEYWORD_CAP;
  }

  /** Which tier we try first (env override → key presence → keyless DDG). */
  private preferred(): CompetitorSource {
    const forced = (process.env.COMPETITOR_SERP_PROVIDER ?? "").toLowerCase();
    if (forced === "brave" || forced === "duckduckgo" || forced === "heuristic") return forced;
    return this.configured ? "brave" : "duckduckgo";
  }

  /**
   * Analyze competitor visibility for `domain` across `keywords`.
   * `declaredCompetitors` (from Brand Memory) seed the keyless heuristic fallback.
   */
  async analyze(
    domain: string,
    keywords: KeywordSeed[],
    declaredCompetitors: string[],
    now: string,
  ): Promise<CompetitorAnalysis> {
    const target = normDomain(domain);
    const ks = keywords.filter((k) => k.keyword?.trim()).slice(0, this.keywordCap);
    const provider = this.preferred();

    if (provider !== "heuristic" && ks.length) {
      const serp = await this.gatherSerp(provider, ks);
      if (serp.some((s) => s.hits.length)) {
        this.last = provider;
        return this.fromSerp(target, ks, serp, provider, now);
      }
      this.log.warn(`${provider} SERP returned nothing — falling back to heuristic`);
    }

    this.last = "heuristic";
    return this.heuristic(target, ks, declaredCompetitors, now);
  }

  /* ----------------------------------------------------------------- SERP gathering */

  private async gatherSerp(
    provider: CompetitorSource,
    ks: KeywordSeed[],
  ): Promise<{ kw: KeywordSeed; hits: SerpHit[] }[]> {
    // Brave is rate-limit-friendly with an API key → small concurrency; DDG is fragile → serial.
    const limit = provider === "brave" ? 3 : 1;
    return mapLimit(ks, limit, async (kw) => {
      const hits = provider === "brave" ? await this.viaBrave(kw.keyword) : await this.viaDuckDuckGo(kw.keyword);
      return { kw, hits };
    });
  }

  /** Brave Search API — real organic results. */
  private async viaBrave(query: string): Promise<SerpHit[]> {
    const base = (process.env.BRAVE_SEARCH_BASE_URL ?? "https://api.search.brave.com/res/v1").replace(/\/+$/, "");
    try {
      const res = await fetchWithTimeout(
        `${base}/web/search?q=${encodeURIComponent(query)}&count=20&result_filter=web`,
        {
          headers: {
            accept: "application/json",
            "accept-encoding": "gzip",
            "x-subscription-token": process.env.BRAVE_SEARCH_API_KEY ?? "",
          },
        },
        8_000,
      );
      if (!res.ok) {
        this.log.warn(`Brave ${res.status} for "${query}"`);
        return [];
      }
      const json = (await res.json()) as { web?: { results?: { url?: string }[] } };
      return this.rank(json.web?.results?.map((r) => r.url ?? "") ?? []);
    } catch (err) {
      this.log.warn(`Brave request failed (${err instanceof Error ? err.message : "unknown"})`);
      return [];
    }
  }

  /** DuckDuckGo HTML endpoint — keyless. Parses the redirect (`uddg=`) + direct organic links. */
  private async viaDuckDuckGo(query: string): Promise<SerpHit[]> {
    const base = (process.env.COMPETITOR_SERP_DDG_URL ?? "https://html.duckduckgo.com/html/").replace(/\/+$/, "/");
    try {
      const res = await fetchWithTimeout(
        `${base}?q=${encodeURIComponent(query)}`,
        { headers: { "user-agent": BROWSER_UA, accept: "text/html" } },
        8_000,
      );
      if (!res.ok) {
        this.log.warn(`DuckDuckGo ${res.status} for "${query}"`);
        return [];
      }
      const html = await res.text();
      const urls: string[] = [];
      // DDG wraps organic links as /l/?uddg=<encoded real url> — pull them in document order.
      for (const m of html.matchAll(/uddg=([^&"']+)/g)) {
        try {
          urls.push(decodeURIComponent(m[1]));
        } catch {
          /* skip malformed */
        }
      }
      // Some DDG variants emit direct https links on result anchors.
      if (urls.length === 0) {
        for (const m of html.matchAll(/class="result__a"[^>]*href="(https?:\/\/[^"]+)"/g)) urls.push(m[1]);
      }
      return this.rank(urls);
    } catch (err) {
      this.log.warn(`DuckDuckGo request failed (${err instanceof Error ? err.message : "unknown"})`);
      return [];
    }
  }

  /** Ordered URLs → first-seen domain per position, capped at TOP_N. */
  private rank(urls: string[]): SerpHit[] {
    const seen = new Set<string>();
    const hits: SerpHit[] = [];
    for (const url of urls) {
      const domain = hostToDomain(url);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      hits.push({ domain, position: hits.length + 1 });
      if (hits.length >= TOP_N) break;
    }
    return hits;
  }

  /* ----------------------------------------------------------------- Aggregation */

  private fromSerp(
    target: string,
    ks: KeywordSeed[],
    serp: { kw: KeywordSeed; hits: SerpHit[] }[],
    source: CompetitorSource,
    now: string,
  ): CompetitorAnalysis {
    const byDomain = new Map<string, { positions: number[]; keywords: Set<string> }>();
    const yourPositions: number[] = [];
    const gaps: KeywordGap[] = [];

    for (const { kw, hits } of serp) {
      if (!hits.length) continue;
      const mine = hits.find((h) => h.domain === target);
      if (mine) yourPositions.push(mine.position);

      for (const hit of hits) {
        if (hit.domain === target) continue;
        const entry = byDomain.get(hit.domain) ?? { positions: [], keywords: new Set<string>() };
        entry.positions.push(hit.position);
        entry.keywords.add(kw.keyword);
        byDomain.set(hit.domain, entry);
      }

      // Gap: we don't rank (or rank below TOP_N) but a competitor does.
      if (!mine) {
        const topComp = hits[0];
        if (topComp) {
          gaps.push({
            keyword: kw.keyword,
            volume: kw.volume,
            difficulty: kw.difficulty,
            intent: kw.intent,
            yourRank: null,
            topCompetitor: topComp.domain,
            competitorRank: topComp.position,
          });
        }
      }
    }

    const nKw = serp.filter((s) => s.hits.length).length || 1;
    const competitors: CompetitorEntry[] = [...byDomain.entries()]
      .map(([domain, e]) => ({
        domain,
        appearances: e.keywords.size,
        avgPosition: Math.round((e.positions.reduce((a, p) => a + p, 0) / e.positions.length) * 10) / 10,
        overlapKeywords: [...e.keywords],
        visibilityScore: clamp((e.positions.reduce((a, p) => a + (TOP_N + 1 - p), 0) / (nKw * TOP_N)) * 100, 0, 100),
      }))
      .sort((a, b) => b.visibilityScore - a.visibilityScore)
      .slice(0, 8);

    const yourVisibility = clamp(
      (yourPositions.reduce((a, p) => a + (TOP_N + 1 - p), 0) / (nKw * TOP_N)) * 100,
      0,
      100,
    );

    return {
      domain: target,
      keywords: ks.map((k) => k.keyword),
      competitors,
      gaps: gaps.sort((a, b) => b.volume - a.volume).slice(0, 12),
      yourVisibility,
      source,
      generatedAt: now,
    };
  }

  /** Keyless estimate from declared competitors — clearly labelled "heuristic" in the UI. */
  private heuristic(
    target: string,
    ks: KeywordSeed[],
    declaredCompetitors: string[],
    now: string,
  ): CompetitorAnalysis {
    const rivals = [...new Set(declaredCompetitors.map(normDomain).filter((d) => d && d !== target))].slice(0, 6);

    const competitors: CompetitorEntry[] = rivals.map((domain, i) => {
      const h = hashStr(domain);
      const appearances = clamp(ks.length - (i + (h % 2)), 1, ks.length || 1);
      return {
        domain,
        appearances,
        avgPosition: clamp(2 + i + (h % 4), 1, TOP_N),
        overlapKeywords: ks.slice(0, appearances).map((k) => k.keyword),
        visibilityScore: clamp(70 - i * 12 - (h % 8), 5, 95),
      };
    });

    // With no declared rivals we can't say who ranks → empty (the UI prompts to add competitors).
    const gaps: KeywordGap[] = rivals.length
      ? ks
          .map((k) => {
            const rival = rivals[hashStr(k.keyword) % rivals.length];
            return {
              keyword: k.keyword,
              volume: k.volume,
              difficulty: k.difficulty,
              intent: k.intent,
              yourRank: null,
              topCompetitor: rival,
              competitorRank: clamp(1 + (hashStr(k.keyword + rival) % 5), 1, TOP_N),
            };
          })
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 12)
      : [];

    return {
      domain: target,
      keywords: ks.map((k) => k.keyword),
      competitors,
      gaps,
      yourVisibility: rivals.length ? clamp(20 + (hashStr(target) % 20), 0, 100) : 0,
      source: "heuristic",
      generatedAt: now,
    };
  }
}
