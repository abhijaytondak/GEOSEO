import { Injectable, OnModuleInit } from "@nestjs/common";
import type { AiBotHit, AiCrawlerBot, AiMention, AiMentionEngine, AiVisibilitySignal } from "@geoseo/types";
import { DocStore } from "../db/db";

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
