import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AiCrawlerBot, AiMentionEngine, AiSearchOverview, SeoDataProvider } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { AiMentionStore, AiBotActivityStore } from "./ai-search.service";
import { PageEngineStore } from "./page-engine.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";

const ENGINES: AiMentionEngine[] = ["chatgpt", "perplexity", "gemini", "claude", "copilot", "grok", "google-ai"];
const BOTS: AiCrawlerBot[] = ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot", "Other"];

const MentionSchema = {
  engine: v.enumOf(ENGINES),
  query: v.string({ min: 1, max: 300 }),
  mentioned: v.optional(v.boolean()),
  position: v.optional(v.number({ min: 1, max: 100 })),
  snippet: v.optional(v.string({ max: 600 })),
  pageId: v.optional(v.string({ max: 128 })),
};
const CheckSchema = { query: v.string({ min: 1, max: 300 }) };
const BotSchema = { bot: v.enumOf(BOTS), url: v.string({ min: 1, max: 2048 }), pageId: v.optional(v.string({ max: 128 })) };

@ApiTags("ai-search")
@Controller("ai-search")
export class AiSearchController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(AiMentionStore) private readonly mentions: AiMentionStore,
    @Inject(AiBotActivityStore) private readonly bots: AiBotActivityStore,
    @Inject(PageEngineStore) private readonly pageEngine: PageEngineStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get("mentions")
  listMentions() {
    return { mentions: this.mentions.list() };
  }

  @Post("mentions")
  recordMention(@Body(validateBody(MentionSchema)) body: { engine: AiMentionEngine; query: string }) {
    return { mention: this.mentions.record(body) };
  }

  /** Heuristic citation check (provider tracking activates with a key). */
  @Post("mentions/check")
  async check(@Body(validateBody(CheckSchema)) body: { query: string }) {
    const result = this.mentions.check(body.query, await this.seo.getAiVisibility());
    this.audit.record("update", "content", "ai-mentions");
    return result;
  }

  @Get("bot-activity")
  botActivity() {
    const hits = this.bots.list();
    const byBot = BOTS.map((bot) => ({ bot, hits: hits.filter((h) => h.bot === bot).length })).filter((b) => b.hits > 0);
    return { hits, byBot };
  }

  @Post("bot-activity")
  recordBot(@Body(validateBody(BotSchema)) body: { bot: AiCrawlerBot; url: string; pageId?: string }) {
    return { hit: this.bots.record(body) };
  }

  @Get("overview")
  async overview(): Promise<AiSearchOverview> {
    const [backlinks, mentions, hits, pages, leads] = [
      await this.seo.getBacklinks(),
      this.mentions.list(),
      this.bots.list(),
      this.pageEngine.listPublishedPages(),
      this.pageEngine.listLeads(),
    ];
    const cited = mentions.filter((m) => m.mentioned);
    const byEngine = ENGINES.map((engine) => ({ engine, mentions: cited.filter((m) => m.engine === engine).length })).filter((e) => e.mentions > 0);
    const byBot = BOTS.map((bot) => ({ bot, hits: hits.filter((h) => h.bot === bot).length })).filter((b) => b.hits > 0);
    return {
      activePages: pages.length,
      aiMentions: cited.length,
      botCrawls: hits.length,
      pagesIndexed: pages.length,
      qualifiedLeads: leads.filter((l) => l.status === "qualified" || l.status === "won").length,
      authorityLinks: backlinks.filter((b) => b.status === "live").length,
      byEngine,
      byBot,
    };
  }
}
