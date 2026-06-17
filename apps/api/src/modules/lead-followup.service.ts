import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { BrandProfile, Lead } from "@geoseo/types";
import { DocStore } from "../db/db";
import { fetchWithTimeout } from "../common/http";
import { PageEngineStore } from "./page-engine.service";
import { BrandMemoryStore } from "./brand.service";

export interface FollowupDraft {
  leadId: string;
  subject: string;
  body: string;
  source: "ai" | "template";
  generatedAt: string;
}

type FollowupState = { byLead: Record<string, FollowupDraft> };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** Deterministic SDR follow-up when the LLM is unavailable (DeepSeek 402, no key). */
function templateDraft(lead: Lead, brand: BrandProfile, now: string): FollowupDraft {
  const company = brand.company || "our team";
  const topic = lead.pageTitle || brand.topics?.[0] || "what you're working on";
  return {
    leadId: lead.id,
    subject: `Following up on ${topic} — ${company}`,
    body: [
      `Hi ${firstName(lead.name || "")},`,
      ``,
      `Thanks for reaching out via "${lead.pageTitle || "our site"}". ${brand.valueProp || `${company} helps teams like ${lead.company || "yours"} move faster.`}`,
      ``,
      lead.message ? `You mentioned: "${lead.message.slice(0, 160)}" — happy to dig into that.` : `Would a quick 15-minute call this week be useful?`,
      ``,
      `Either way, I'll send over a short overview tailored to ${lead.company || "your team"}.`,
      ``,
      `Best,`,
      `${brand.contactName || "The " + company + " team"}`,
    ].join("\n"),
    source: "template",
    generatedAt: now,
  };
}

/** AI SDR follow-up generation (Lead Conversion). Uses DeepSeek (OpenAI-compatible)
 *  when configured + funded; falls back to a personalized template otherwise. */
@Injectable()
export class LeadFollowupStore implements OnModuleInit {
  private byLead: Record<string, FollowupDraft> = {};
  private db = new DocStore<FollowupState>("cx_lead_followup");

  constructor(
    @Inject(PageEngineStore) private readonly pages: PageEngineStore,
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
  ) {}

  async onModuleInit() {
    await this.db.init({ byLead: this.byLead }, (loaded) => {
      this.byLead = loaded.byLead ?? {};
    });
  }

  latest(leadId: string): FollowupDraft | null {
    return this.byLead[leadId] ?? null;
  }

  async generate(tenantId: string, leadId: string, now: string): Promise<FollowupDraft> {
    const lead = this.pages.getLead(tenantId, leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);
    const brand = this.brand.current();

    const draft = (await this.viaDeepseek(lead, brand, now)) ?? templateDraft(lead, brand, now);
    this.byLead[leadId] = draft;
    this.db.save({ byLead: this.byLead });
    return draft;
  }

  /** OpenAI-compatible chat call; returns null on any failure (caller falls back). */
  private async viaDeepseek(lead: Lead, brand: BrandProfile, now: string): Promise<FollowupDraft | null> {
    const key = process.env.DEEPSEEK_API_KEY;
    const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
    if (!key) return null;
    const prompt = [
      `You are an SDR for ${brand.company || "our company"} (${brand.valueProp || ""}, tone: ${brand.tone || "professional"}).`,
      `Write a short, warm follow-up email to ${lead.name || "the lead"}${lead.company ? ` at ${lead.company}` : ""}, who submitted this on the page "${lead.pageTitle || "our site"}": "${lead.message || "(no message)"}".`,
      `Keep it under 120 words, no fluff, one clear ask (a quick call). Reply as strict JSON: {"subject": "...", "body": "..."}.`,
    ].join("\n");
    try {
      const res = await fetchWithTimeout(`${base}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content;
      if (!content) return null;
      const parsed = JSON.parse(content) as { subject?: string; body?: string };
      if (!parsed.subject || !parsed.body) return null;
      return { leadId: lead.id, subject: parsed.subject, body: parsed.body, source: "ai", generatedAt: now };
    } catch {
      return null;
    }
  }
}
