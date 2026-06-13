/**
 * Page Creation & Publishing Engine domain model
 * (PRD: Automatic Page Creation and Publishing Engine).
 *
 * Distinct from the backlinking surface: here an "Opportunity" is a buyer-intent
 * KEYWORD opportunity (not a backlink prospect). Kept in a separate module so the
 * page-engine can evolve independently of the authority/backlinking types.
 */
import type { ISODate } from "./index";

export type PageType =
  | "landing"
  | "guide"
  | "faq"
  | "comparison"
  | "resource"
  | "service"
  | "local";

export type SearchIntent =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational"
  | "local"
  | "comparison";

/* ----------------------------------------------- Research → Opportunity */

export type OpportunityStatus = "new" | "approved" | "rejected" | "deferred";

export interface KeywordOpportunity {
  id: string;
  query: string;
  clusterId: string;
  clusterLabel: string;
  intent: SearchIntent;
  /** Estimated monthly search volume. */
  volume: number;
  /** 0–100 keyword difficulty. */
  difficulty: number;
  /** 0–100 commercial value. */
  commercialValue: number;
  /** 0–100 model confidence in the recommendation. */
  confidence: number;
  recommendedPageType: PageType;
  competitorUrls: string[];
  /** One-line "why this is recommended" evidence (PRD acceptance criteria). */
  evidence: string;
  status: OpportunityStatus;
  /** Flagged when it cannibalizes an existing page (PRD §7.2 dedupe). */
  duplicate?: boolean;
  createdAt: ISODate;
}

/* ----------------------------------------------- Strategy → Blueprint */

export type BlueprintStatus = "draft" | "approved" | "rejected";

export interface OutlineSection {
  heading: string;
  summary: string;
}

export interface PageBlueprint {
  id: string;
  opportunityId: string;
  title: string;
  slug: string;
  pageType: PageType;
  targetKeywords: string[];
  intentSummary: string;
  audience: string;
  outline: OutlineSection[];
  ctaPlan: string;
  internalLinkPlan: string[];
  schemaPlan: string[];
  differentiationNotes: string;
  /** net-new vs refresh vs merge candidate (PRD §7.3 acceptance). */
  changeKind: "net-new" | "refresh" | "merge";
  status: BlueprintStatus;
  createdAt: ISODate;
  approvedAt?: ISODate;
}

/* ----------------------------------------------- Content → GeneratedPage */

export type PageStatus =
  | "draft"
  | "in-review"
  | "approved"
  | "published"
  | "needs-refresh";

export interface PageSection {
  heading: string;
  body: string;
}

export interface PageFaq {
  q: string;
  a: string;
}

export interface SeoCheck {
  label: string;
  pass: boolean;
}

export interface GeneratedPage {
  id: string;
  blueprintId: string;
  opportunityId: string;
  title: string;
  slug: string;
  pageType: PageType;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  heroCopy: string;
  sections: PageSection[];
  faqs: PageFaq[];
  cta: { label: string; href: string };
  /** JSON-LD structured data (stringified). */
  schemaJson: string;
  targetKeywords: string[];
  wordCount: number;
  brandMemoryVersion: number;
  seoChecks: SeoCheck[];
  /** Content QA: similarity / readability / policy (PRD §7.4). */
  qualityChecks?: SeoCheck[];
  publishedUrl?: string;
  publishedAt?: ISODate;
  lastRefreshedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** An immutable snapshot of a page's content + metadata (PRD §11.6). */
export interface PageVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroCopy: string;
  sections: PageSection[];
  faqs: PageFaq[];
  cta: { label: string; href: string };
  changeSummary: string;
  authorType: "ai" | "human" | "system";
  createdAt: ISODate;
}

/** Partial page edit payload (PRD §9.4 page editor). */
export interface PageEdit {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  heroCopy?: string;
  sections?: PageSection[];
  faqs?: PageFaq[];
  cta?: { label: string; href: string };
}

/* ----------------------------------------------- Leads */

export type LeadStatus = "new" | "qualified" | "contacted" | "won" | "lost";
export type SpamStatus = "clean" | "spam" | "duplicate";

export interface Lead {
  id: string;
  pageId: string;
  pageTitle: string;
  name: string;
  email: string;
  company: string;
  message: string;
  sourceUrl: string;
  utm?: string;
  /** 0–100 lead score. */
  score: number;
  status: LeadStatus;
  spamStatus: SpamStatus;
  crmSyncStatus?: "none" | "pending" | "synced";
  createdAt: ISODate;
}

/** Audit trail entry for sensitive actions (PRD §10.1/§15.2). */
export interface AuditEntry {
  id: string;
  /** Page-engine actions plus the core-workflow actions (PRD §10 audit logging). */
  action:
    | "generate" | "edit" | "publish" | "approve" | "reject" | "defer" | "rollback" | "delete"
    | "create" | "update" | "discover" | "archive" | "restore" | "resolve" | "snooze"
    | "export" | "integration" | "bulk";
  entity: "page" | "opportunity" | "blueprint" | "lead" | "prospect" | "alert" | "settings" | "job" | "brand" | "content";
  entityId: string;
  actor: string;
  workspaceId: string;
  at: ISODate;
}

/* ----------------------------------------------- Provider seam */

/** Page-engine data source — mock today; real research/LLM/CMS behind this later. */
export interface PageEngineSource {
  getOpportunities(): Promise<KeywordOpportunity[]>;
  getBlueprints(): Promise<PageBlueprint[]>;
  getPages(): Promise<GeneratedPage[]>;
  getPage(id: string): Promise<GeneratedPage | undefined>;
  getLeads(): Promise<Lead[]>;
}
