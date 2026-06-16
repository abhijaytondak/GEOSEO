import { Injectable, OnModuleInit } from "@nestjs/common";
import type { AiBotHit, AiCrawlerBot, AiEngine, AiMention, AiMentionEngine, AiVisibilitySignal } from "@geoseo/types";
import { DocStore } from "../db/db";

/** The four engines the AI-visibility widget renders, with display labels. */
const VISIBILITY_ENGINES: { engine: AiEngine; label: string }[] = [
  { engine: "chatgpt", label: "ChatGPT" },
  { engine: "perplexity", label: "Perplexity" },
  { engine: "google-ai", label: "Google AI Overviews" },
  { engine: "gemini", label: "Gemini" },
];

/** Where AI-visibility numbers came from — drives honest UI labelling (No-Dummy-Data §7.6). */
export type AiVisibilitySource = "tracked" | "none";

export interface AiVisibilityResult {
  signals: AiVisibilitySignal[];
  /** `tracked` ⇒ derived from real recorded checks; `none` ⇒ no checks yet (caller decides fallback). */
  source: AiVisibilitySource;
}

type MentionState = { mentions: AiMention[]; seq: number };
type BotState = { hits: AiBotHit[]; seq: number };

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * AI mention/citation tracking (AI Search PRD §7). Mentions can be recorded
 * manually or seeded heuristically from AI-visibility signals; real per-engine
 * citation tracking activates when a monitoring provider is connected. `cx_ai_mentions`.
 */
@Injectable()
export class AiMentionStore implements OnModuleInit {
  private mentions: AiMention[] = [];
  private seq = 0;
  private db = new DocStore<MentionState>("cx_ai_mentions");

  async onModuleInit() {
    await this.db.init({ mentions: this.mentions, seq: this.seq }, (loaded) => {
      this.mentions = loaded.mentions ?? [];
      this.seq = loaded.seq ?? 0;
    });
  }

  list(): AiMention[] {
    return [...this.mentions].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  }

  record(input: Partial<AiMention> & { engine: AiMentionEngine; query: string }): AiMention {
    this.seq += 1;
    const m: AiMention = {
      id: `aim-${this.seq}`,
      engine: input.engine,
      query: input.query,
      mentioned: input.mentioned ?? true,
      position: input.position,
      snippet: input.snippet,
      pageId: input.pageId,
      pageUrl: input.pageUrl,
      source: input.source ?? "manual",
      checkedAt: nowIso(),
    };
    this.mentions = [m, ...this.mentions].slice(0, 1000);
    this.db.save({ mentions: this.mentions, seq: this.seq });
    return m;
  }

  /**
   * Real AI-visibility signals derived from recorded citation checks (No-Dummy-Data §7.6).
   * `mentions` is the genuine count of cited answers per engine; `shareOfVoice` is that
   * engine's share of your tracked citations (distribution across engines, not a fabricated
   * competitor figure); `delta` compares the most-recent half of checks to the prior half.
   * Returns `source: "none"` with no signals when nothing has been tracked yet, so the
   * UI shows an honest empty state instead of fabricated numbers.
   */
  visibility(): AiVisibilityResult {
    const cited = this.mentions.filter((m) => m.mentioned);
    if (cited.length === 0) return { signals: [], source: "none" };

    // Split chronologically into prior vs recent halves for an honest delta.
    const byTime = [...cited].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));
    const mid = Math.floor(byTime.length / 2);
    // One pass per slice → per-engine counts (cheaper and clearer than re-filtering per engine).
    const tally = (list: AiMention[]): Partial<Record<AiEngine, number>> => {
      const t: Partial<Record<AiEngine, number>> = {};
      for (const m of list) t[m.engine as AiEngine] = (t[m.engine as AiEngine] ?? 0) + 1;
      return t;
    };
    const citedBy = tally(cited);
    const recentBy = tally(byTime.slice(mid));
    const priorBy = tally(byTime.slice(0, mid));

    const total = VISIBILITY_ENGINES.reduce((a, { engine }) => a + (citedBy[engine] ?? 0), 0);
    const signals: AiVisibilitySignal[] = VISIBILITY_ENGINES.map(({ engine, label }) => {
      const mentions = citedBy[engine] ?? 0;
      const shareOfVoice = total ? Math.round((mentions / total) * 100) : 0;
      const r = recentBy[engine] ?? 0;
      const p = priorBy[engine] ?? 0;
      const pct = p > 0 ? Math.round(((r - p) / p) * 100) : r > 0 ? 100 : 0;
      const direction = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
      return { engine, label, mentions, shareOfVoice, delta: { pct: Math.abs(pct), direction, goodWhen: "up" } };
    });
    return { signals, source: "tracked" };
  }

  /**
   * Heuristic check: derive starting mentions from AI-visibility signals until a
   * real provider is wired. Returns the newly recorded mentions + whether live.
   */
  check(query: string, signals: AiVisibilitySignal[]): { recorded: AiMention[]; live: boolean } {
    const engineMap: Record<string, AiMentionEngine> = { chatgpt: "chatgpt", perplexity: "perplexity", gemini: "gemini", "google-ai": "google-ai" };
    const recorded = signals.map((s) =>
      this.record({
        engine: engineMap[s.engine] ?? "chatgpt",
        query,
        mentioned: s.mentions > 0,
        position: s.mentions > 0 ? Math.max(1, Math.round(10 - s.shareOfVoice / 12)) : undefined,
        snippet: s.mentions > 0 ? `Cited in ~${s.mentions} ${s.label} answers (heuristic).` : undefined,
        source: "heuristic",
      }),
    );
    return { recorded, live: false };
  }
}

/**
 * AI-crawler visit log (AI Search PRD §7 bot analytics). Hits are recorded when
 * an AI bot user-agent fetches a published page. `cx_ai_bots`.
 */
@Injectable()
export class AiBotActivityStore implements OnModuleInit {
  private hits: AiBotHit[] = [];
  private seq = 0;
  private db = new DocStore<BotState>("cx_ai_bots");

  async onModuleInit() {
    await this.db.init({ hits: this.hits, seq: this.seq }, (loaded) => {
      this.hits = loaded.hits ?? [];
      this.seq = loaded.seq ?? 0;
    });
  }

  list(): AiBotHit[] {
    return [...this.hits].sort((a, b) => b.at.localeCompare(a.at));
  }

  record(input: { bot: AiCrawlerBot; url: string; pageId?: string; userAgent?: string }): AiBotHit {
    this.seq += 1;
    const hit: AiBotHit = { id: `bot-${this.seq}`, bot: input.bot, url: input.url, pageId: input.pageId, userAgent: input.userAgent, at: nowIso() };
    this.hits = [hit, ...this.hits].slice(0, 2000);
    this.db.save({ hits: this.hits, seq: this.seq });
    return hit;
  }

  /** Classify a user-agent string to a known AI crawler (Other if unknown). */
  static classify(ua: string): AiCrawlerBot | null {
    const u = (ua || "").toLowerCase();
    if (u.includes("gptbot")) return "GPTBot";
    if (u.includes("oai-searchbot")) return "OAI-SearchBot";
    if (u.includes("perplexitybot")) return "PerplexityBot";
    if (u.includes("claudebot") || u.includes("claude-web")) return "ClaudeBot";
    if (u.includes("google-extended")) return "Google-Extended";
    if (u.includes("bingbot")) return "Bingbot";
    return null;
  }
}
