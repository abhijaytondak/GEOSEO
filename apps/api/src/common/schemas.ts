import { v, type Schema } from "./validation";

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
