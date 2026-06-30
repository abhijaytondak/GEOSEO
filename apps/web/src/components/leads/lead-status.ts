import type { LeadStatus } from "@geoseo/types";

/** Lead lifecycle stages, in pipeline order — single source for the table + drawer controls. */
export const LEAD_STATUSES: LeadStatus[] = ["new", "qualified", "contacted", "won", "lost"];

/** Status → tint classes, shared by the table status pill and the drawer status control
 *  so the two surfaces can never drift apart. */
export const STATUS_TINT: Record<LeadStatus, string> = {
  new: "bg-info/12 text-info",
  qualified: "bg-brand/12 text-brand",
  contacted: "bg-warning/15 text-warning",
  won: "bg-positive/12 text-positive",
  lost: "bg-muted text-muted-foreground",
};
