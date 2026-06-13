import { Injectable, OnModuleInit } from "@nestjs/common";
import type { Lead, LeadScore, LeadScoreReason, LeadJourneySummary } from "@geoseo/types";
import { DocStore } from "../db/db";

type ScoreState = { byLead: Record<string, LeadScore> };

const FREE_EMAIL = ["gmail.", "yahoo.", "hotmail.", "outlook.", "icloud.", "proton.", "aol.", "live.", "me.com"];
const BUYING_INTENT = ["demo", "pricing", "price", "quote", "buy", "trial", "purchase", "cost", "plan", "contact sales"];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Explainable lead scoring (Leads PRD Gap 7). Computes fit/intent/engagement/spam-risk
 * from the lead + its visitor journey, with human-readable reasons. Additive store
 * (`cx_lead_score`) — does not mutate the core Lead record.
 */
export function computeLeadScore(lead: Lead, journey?: LeadJourneySummary): LeadScore {
  const reasons: LeadScoreReason[] = [];
  const email = (lead.email ?? "").toLowerCase();
  const domain = email.split("@")[1] ?? "";
  const message = (lead.message ?? "").toLowerCase();

  // --- Fit: is this the kind of buyer we want? ---
  let fit = 40;
  if (lead.company) {
    fit += 20;
    reasons.push({ label: "Company provided", impact: "positive", points: 20, explanation: `Identified company: ${lead.company}.` });
  } else {
    reasons.push({ label: "No company", impact: "negative", points: -10, explanation: "No company name — harder to qualify." });
    fit -= 10;
  }
  const isBusinessEmail = !!domain && !FREE_EMAIL.some((f) => domain.startsWith(f) || domain.includes(f));
  if (isBusinessEmail) {
    fit += 25;
    reasons.push({ label: "Business email", impact: "positive", points: 25, explanation: `${domain} looks like a company domain.` });
  } else if (domain) {
    reasons.push({ label: "Free email domain", impact: "negative", points: -10, explanation: `${domain} is a consumer email provider.` });
    fit -= 10;
  }

  // --- Intent: how ready are they to buy? ---
  let intent = 30;
  const intentHits = BUYING_INTENT.filter((k) => message.includes(k));
  if (intentHits.length) {
    const pts = Math.min(30, intentHits.length * 12);
    intent += pts;
    reasons.push({ label: "Buying-intent language", impact: "positive", points: pts, explanation: `Message mentions: ${intentHits.join(", ")}.` });
  }
  if (journey?.convertedAt) {
    intent += 15;
    reasons.push({ label: "Completed a form", impact: "positive", points: 15, explanation: "Submitted a lead form during the journey." });
  }
  const pricingViewed = (journey?.topPages ?? []).some((p) => /pric|demo|quote|contact/i.test(p.url + p.title));
  if (pricingViewed) {
    intent += 15;
    reasons.push({ label: "Viewed a decision page", impact: "positive", points: 15, explanation: "Visited a pricing/demo/contact page before converting." });
  }

  // --- Engagement: depth of interaction ---
  const touch = journey?.touchpointCount ?? 0;
  const sessions = journey?.sessionCount ?? 0;
  let engagement = clamp(touch * 12 + sessions * 8);
  if (touch === 0) {
    reasons.push({ label: "No tracked journey", impact: "neutral", points: 0, explanation: "No page events recorded for this lead yet." });
  } else {
    reasons.push({ label: "Multi-touch journey", impact: "positive", points: Math.min(20, touch * 4), explanation: `${touch} touchpoints across ${sessions} session(s).` });
  }

  // --- Spam risk ---
  let spamRisk = 5;
  if (lead.spamStatus === "spam") {
    spamRisk = 90;
    reasons.push({ label: "Flagged as spam", impact: "negative", points: -40, explanation: "Ingest flagged this submission as spam." });
  } else if (lead.spamStatus === "duplicate") {
    spamRisk = 45;
    reasons.push({ label: "Duplicate", impact: "negative", points: -15, explanation: "A lead with this email already exists for the page." });
  } else if (message.length < 8) {
    spamRisk = 30;
    reasons.push({ label: "Very short message", impact: "negative", points: -8, explanation: "Little detail provided." });
  }

  fit = clamp(fit);
  intent = clamp(intent);
  engagement = clamp(engagement);
  spamRisk = clamp(spamRisk);

  const total = clamp(fit * 0.3 + intent * 0.4 + engagement * 0.2 + (100 - spamRisk) * 0.1);
  const confidence = clamp(40 + (lead.company ? 15 : 0) + (journey?.touchpointCount ? 25 : 0) + (isBusinessEmail ? 20 : 0));

  let recommendedAction: string;
  if (spamRisk >= 70) recommendedAction = "Review in spam queue before contacting.";
  else if (total >= 75) recommendedAction = "High-fit lead — assign an owner and follow up within the hour.";
  else if (total >= 55) recommendedAction = "Qualified — add to outreach and confirm fit.";
  else recommendedAction = "Nurture — send relevant content and re-evaluate.";

  return { total, fit, intent, engagement, spamRisk, confidence, reasons, recommendedAction };
}

@Injectable()
export class LeadScoreStore implements OnModuleInit {
  private byLead: Record<string, LeadScore> = {};
  private db = new DocStore<ScoreState>("cx_lead_score");

  async onModuleInit() {
    await this.db.init({ byLead: this.byLead }, (loaded) => {
      this.byLead = loaded.byLead ?? {};
    });
  }

  get(leadId: string): LeadScore | undefined {
    return this.byLead[leadId];
  }

  set(leadId: string, score: LeadScore): LeadScore {
    this.byLead[leadId] = score;
    this.db.save({ byLead: this.byLead });
    return score;
  }
}
