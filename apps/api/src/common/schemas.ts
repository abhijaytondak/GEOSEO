import { v, type Schema } from "./validation";
import type {
  BlueprintStatus,
  IntegrationStatus,
  LeadStatus,
  PageBlueprint,
  PageType,
  TeamMember,
  Workspace,
  WorkspaceSettings,
} from "@geoseo/types";

/** Request DTO schemas (PRD §7). Field-level only; cross-field rules stay inline. */

export const JOB_TYPES = [
  "audit",
  "discover",
  "acquire-backlinks",
  "export",
  "content-rescan",
  "content-refresh",
  "internal-links",
  "settings-sync",
] as const;

export const PROSPECT_STATUSES = ["new", "contacted", "replied", "acquired", "rejected"] as const;

export const CreateJobSchema: Schema = {
  type: v.optional(v.enumOf(JOB_TYPES)),
  description: v.optional(v.string({ max: 280 })),
};

export const AlertThresholdsSchema: Schema = {
  rankDrop: v.optional(v.number({ int: true, min: 0, max: 100 })),
  trafficDrop: v.optional(v.number({ min: 0, max: 100 })),
  brokenBacklinks: v.optional(v.boolean()),
  aiVisibilityDrop: v.optional(v.number({ min: 0, max: 100 })),
};

export const AlertSnoozeSchema: Schema = {
  until: v.optional(v.isoDate()),
};

export const ProspectUpdateSchema: Schema = {
  status: v.optional(v.enumOf(PROSPECT_STATUSES)),
  contactEmail: v.optional(v.string({ max: 320 })),
  tags: v.optional(v.arrayOf(v.string({ max: 60 }))),
  notes: v.optional(v.string({ max: 4000 })),
  archived: v.optional(v.boolean()),
};

export const BulkProspectsSchema: Schema = {
  ids: v.arrayOf(v.string({ min: 1 })),
  action: v.enumOf(["archive", "restore", "status"] as const),
  status: v.optional(v.enumOf(PROSPECT_STATUSES)),
};

/* ----------------------------------------------------------------- enums */

// `satisfies` ties each runtime tuple to its @geoseo/types union — drift becomes a
// compile error instead of a silent runtime 400. (TS unions can't be iterated at
// runtime, so the tuple must exist; this keeps it honest against the source type.)
export const TEAM_ROLES = ["owner", "admin", "marketer", "analyst"] as const satisfies readonly TeamMember["role"][];
export const INTEGRATION_STATUSES = ["connected", "needs-attention", "disabled"] as const satisfies readonly IntegrationStatus[];
export const BILLING_PLANS = ["Launch", "Grow", "Scale"] as const satisfies readonly WorkspaceSettings["billing"]["plan"][];
export const BILLING_STATUSES = ["trial", "active", "past-due"] as const satisfies readonly WorkspaceSettings["billing"]["status"][];
export const WORKSPACE_STATUSES = ["active", "paused", "archived"] as const satisfies readonly Workspace["status"][];
export const PAGE_TYPES = ["landing", "guide", "faq", "comparison", "resource", "service", "local"] as const satisfies readonly PageType[];
export const CHANGE_KINDS = ["net-new", "refresh", "merge"] as const satisfies readonly PageBlueprint["changeKind"][];
export const BLUEPRINT_STATUSES = ["draft", "approved", "rejected"] as const satisfies readonly BlueprintStatus[];
export const LEAD_STATUSES = ["new", "qualified", "contacted", "won", "lost"] as const satisfies readonly LeadStatus[];
export const PROOF_TYPES = ["stat", "testimonial", "case-study", "award", "logo"] as const;

/* --------------------------------------------------- settings (Partial<WorkspaceSettings>) */
// All nested fields optional so a partial PUT only updates what it sends (the validator
// strips unlisted keys, so omitting `v.optional` would drop them — see site-theme).
// `integrations`/`team` are owned by their dedicated endpoints; accepted but not deep-validated.
export const WorkspaceSettingsSchema: Schema = {
  profile: v.optional(
    v.shape({
      workspaceName: v.optional(v.string({ max: 200 })),
      domain: v.optional(v.string({ max: 2048 })),
      defaultPublishPath: v.optional(v.string({ max: 200 })),
      timezone: v.optional(v.string({ max: 80 })),
      allowedDomains: v.optional(v.arrayOf(v.string({ max: 256 }))),
    }),
  ),
  notifications: v.optional(
    v.shape({
      weeklyDigest: v.optional(v.boolean()),
      criticalAlerts: v.optional(v.boolean()),
      publishFailures: v.optional(v.boolean()),
      leadAlerts: v.optional(v.boolean()),
    }),
  ),
  billing: v.optional(
    v.shape({
      plan: v.optional(v.enumOf(BILLING_PLANS)),
      status: v.optional(v.enumOf(BILLING_STATUSES)),
      seatsUsed: v.optional(v.number({ int: true, min: 0, max: 100000 })),
      seatsLimit: v.optional(v.number({ int: true, min: 0, max: 100000 })),
    }),
  ),
  publishing: v.optional(
    v.shape({
      requireApproval: v.optional(v.boolean()),
      autoSitemap: v.optional(v.boolean()),
      autoLlms: v.optional(v.boolean()),
    }),
  ),
  integrations: v.optional(v.arrayOf(v.object())),
  team: v.optional(v.arrayOf(v.object())),
};

export const TeamMemberCreateSchema: Schema = {
  name: v.string({ min: 1, max: 160 }),
  email: v.email({ max: 254 }),
  role: v.enumOf(TEAM_ROLES),
};
export const TeamMemberPatchSchema: Schema = {
  name: v.optional(v.string({ min: 1, max: 160 })),
  email: v.optional(v.email({ max: 254 })),
  role: v.optional(v.enumOf(TEAM_ROLES)),
};

/** Shared by PATCH /settings/integrations/:id and POST /publishing/integrations. */
export const IntegrationWriteSchema: Schema = {
  id: v.optional(v.string({ max: 64 })),
  label: v.optional(v.string({ max: 160 })),
  description: v.optional(v.string({ max: 600 })),
  status: v.optional(v.enumOf(INTEGRATION_STATUSES)),
  lastSyncAt: v.optional(v.isoDate()),
};

/* --------------------------------------------------- workspaces */
export const WorkspaceCreateSchema: Schema = {
  name: v.string({ min: 1, max: 200 }),
  domain: v.string({ min: 1, max: 2048 }),
  industry: v.optional(v.string({ max: 120 })),
};
export const WorkspaceUpdateSchema: Schema = {
  name: v.optional(v.string({ min: 1, max: 200 })),
  domain: v.optional(v.string({ min: 1, max: 2048 })),
  industry: v.optional(v.string({ max: 120 })),
  status: v.optional(v.enumOf(WORKSPACE_STATUSES)),
};

/* --------------------------------------------------- page engine (Partial<PageBlueprint> / PageEdit) */
export const BlueprintUpdateSchema: Schema = {
  title: v.optional(v.string({ max: 300 })),
  slug: v.optional(v.string({ max: 320 })),
  pageType: v.optional(v.enumOf(PAGE_TYPES)),
  targetKeywords: v.optional(v.arrayOf(v.string({ max: 200 }))),
  intentSummary: v.optional(v.string({ max: 2000 })),
  audience: v.optional(v.string({ max: 600 })),
  outline: v.optional(
    v.arrayOf(v.shape({ heading: v.string({ max: 300 }), summary: v.optional(v.string({ max: 2000 })) })),
  ),
  ctaPlan: v.optional(v.string({ max: 1000 })),
  internalLinkPlan: v.optional(v.arrayOf(v.string({ max: 320 }))),
  schemaPlan: v.optional(v.arrayOf(v.string({ max: 200 }))),
  differentiationNotes: v.optional(v.string({ max: 2000 })),
  changeKind: v.optional(v.enumOf(CHANGE_KINDS)),
  status: v.optional(v.enumOf(BLUEPRINT_STATUSES)),
};

export const LeadStatusUpdateSchema: Schema = {
  status: v.enumOf(LEAD_STATUSES),
};

export const PageEditSchema: Schema = {
  title: v.optional(v.string({ max: 300 })),
  metaTitle: v.optional(v.string({ max: 300 })),
  metaDescription: v.optional(v.string({ max: 600 })),
  heroCopy: v.optional(v.string({ max: 4000 })),
  sections: v.optional(v.arrayOf(v.shape({ heading: v.string({ max: 300 }), body: v.string({ max: 20000 }) }))),
  faqs: v.optional(v.arrayOf(v.shape({ q: v.string({ max: 600 }), a: v.string({ max: 4000 }) }))),
  cta: v.optional(v.shape({ label: v.string({ max: 160 }), href: v.string({ max: 2048 }) })),
};

/* --------------------------------------------------- id lists (content / alerts) */
export const IdListSchema: Schema = { ids: v.optional(v.arrayOf(v.string({ max: 128 }))) };
export const PageIdListSchema: Schema = { pageIds: v.optional(v.arrayOf(v.string({ max: 128 }))) };

/* --------------------------------------------------- brand library (defense-in-depth; store also sanitizes) */
export const BrandLibrarySchema: Schema = {
  products: v.optional(
    v.arrayOf(
      v.shape({
        id: v.optional(v.string({ max: 64 })),
        name: v.string({ max: 160 }),
        description: v.optional(v.string({ max: 1200 })),
        category: v.optional(v.string({ max: 80 })),
        pricing: v.optional(v.string({ max: 200 })),
        url: v.optional(v.string({ max: 2048 })),
      }),
    ),
  ),
  personas: v.optional(
    v.arrayOf(
      v.shape({
        id: v.optional(v.string({ max: 64 })),
        name: v.string({ max: 160 }),
        role: v.optional(v.string({ max: 160 })),
        painPoints: v.optional(v.arrayOf(v.string({ max: 200 }))),
        goals: v.optional(v.arrayOf(v.string({ max: 200 }))),
        buyingTriggers: v.optional(v.arrayOf(v.string({ max: 200 }))),
      }),
    ),
  ),
  terminology: v.optional(
    v.shape({
      preferred: v.optional(v.arrayOf(v.string({ max: 200 }))),
      avoid: v.optional(v.arrayOf(v.string({ max: 200 }))),
    }),
  ),
  proofPoints: v.optional(
    v.arrayOf(
      v.shape({
        id: v.optional(v.string({ max: 64 })),
        type: v.optional(v.enumOf(PROOF_TYPES)),
        label: v.string({ max: 240 }),
        detail: v.optional(v.string({ max: 600 })),
        source: v.optional(v.string({ max: 2048 })),
      }),
    ),
  ),
};
