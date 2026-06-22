"use client";

import { useState } from "react";
import { Save, Tag, Sparkles, Check, Mail, Clock, type LucideIcon } from "lucide-react";
import type { BacklinkProspect, ProspectStatus } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { relativeTime } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";
import { PROSPECT_STATUSES } from "./status-pill";

interface Props {
  prospect: BacklinkProspect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the persisted prospect so the parent list can update in place. */
  onSaved: (updated: BacklinkProspect) => void;
}

const fieldClass =
  "w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-body outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:bg-card";

/** Edit a prospect's contact, status, tags, and notes — persisted via PATCH. */
export function ProspectEditDrawer({ prospect, open, onOpenChange, onSaved }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {prospect && (
          // Keyed by id so each prospect gets fresh form state from props — no effect.
          <EditForm key={prospect.id} prospect={prospect} onOpenChange={onOpenChange} onSaved={onSaved} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditForm({
  prospect,
  onOpenChange,
  onSaved,
}: {
  prospect: BacklinkProspect;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: BacklinkProspect) => void;
}) {
  const { notify } = useAppFeedback();
  const [status, setStatus] = useState<ProspectStatus>(prospect.status);
  const [contactEmail, setContactEmail] = useState(prospect.contactEmail ?? "");
  const [tags, setTags] = useState(prospect.tags.join(", "));
  const [notes, setNotes] = useState((prospect as BacklinkProspect & { notes?: string }).notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      const updated = await api.updateProspect(prospect.id, {
        status,
        contactEmail: contactEmail.trim() || undefined,
        tags: parsedTags,
        notes: notes.trim() || undefined,
      });
      onSaved(updated);
      notify({ kind: "success", title: "Prospect saved", message: `${prospect.domain} details updated.` });
      onOpenChange(false);
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  // Derived activity timeline (§10.4). Demo-mode: synthesized from the prospect's
  // current state; a persisted ProspectActivity feed lands with the API endpoints.
  const activity: { icon: LucideIcon; label: string; when?: string }[] = [
    { icon: Sparkles, label: "Discovered as an opportunity" },
    ...(prospect.status !== "new" ? [{ icon: Check, label: `Status set to ${prospect.status}` }] : []),
    ...(prospect.contactEmail ? [{ icon: Mail, label: "Contact email on file" }] : []),
    ...(prospect.lastInteraction
      ? [{ icon: Clock, label: "Last interaction", when: relativeTime(prospect.lastInteraction) }]
      : []),
  ];

  return (
    <>
      <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
        <SheetTitle className="text-lg">Edit prospect</SheetTitle>
        <SheetDescription>
          <span className="font-medium text-foreground">{prospect.domain}</span> · {prospect.industry}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {/* score breakdown (§10.2) — why this prospect is recommended */}
        <div className="rounded-xl border border-border bg-surface-sunken p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-micro font-semibold uppercase text-muted-foreground">
              Impact score
            </span>
            <span className="tnum text-title font-bold text-brand">{prospect.impactScore}</span>
          </div>
          <div className="mt-2.5 space-y-2">
            {[
              { label: "Domain authority", value: prospect.domainAuthority },
              { label: "Topical relevance", value: prospect.relevanceScore },
              { label: "Traffic reach", value: Math.min(100, Math.round((prospect.trafficEstimate / 1_000_000) * 100)) },
              { label: "Contact confidence", value: prospect.contactEmail ? 90 : 30 },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-0.5 flex items-center justify-between text-micro">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="tnum font-medium text-foreground">{r.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, r.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-label leading-relaxed text-muted-foreground">{prospect.rationale}</p>
        </div>

        {/* status */}
        <div>
          <label className="text-micro font-semibold uppercase text-muted-foreground">
            Status
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PROSPECT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-label font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  status === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* contact email */}
        <div>
          <label htmlFor="prospect-email" className="text-micro font-semibold uppercase text-muted-foreground">
            Contact email
          </label>
          <input
            id="prospect-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="editor@domain.com"
            className={cn(fieldClass, "mt-2 h-10")}
          />
        </div>

        {/* tags */}
        <div>
          <label htmlFor="prospect-tags" className="flex items-center gap-1.5 text-micro font-semibold uppercase text-muted-foreground">
            <Tag className="size-3" />
            Tags
          </label>
          <input
            id="prospect-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="saas, fintech, high-authority"
            className={cn(fieldClass, "mt-2 h-10")}
          />
          <p className="mt-1.5 text-micro text-muted-foreground">Comma-separated.</p>
        </div>

        {/* notes */}
        <div>
          <label htmlFor="prospect-notes" className="text-micro font-semibold uppercase text-muted-foreground">
            Notes
          </label>
          <textarea
            id="prospect-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Context for outreach — relationship, angle, past contact…"
            className={cn(fieldClass, "mt-2 resize-none leading-relaxed")}
          />
        </div>

        {/* activity history (§10.4) */}
        <div>
          <span className="text-micro font-semibold uppercase text-muted-foreground">Activity</span>
          <ul className="mt-2 space-y-2">
            {activity.map((ev) => (
              <li key={ev.label} className="flex items-center gap-2.5 text-label">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-muted-foreground">
                  <ev.icon className="size-3" />
                </span>
                <span className="flex-1 text-foreground">{ev.label}</span>
                {ev.when && <span className="text-micro text-muted-foreground">{ev.when}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancel
        </Button>
        <Button className="h-9 rounded-full px-4" onClick={save} loading={saving}>
          {!saving && <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </>
  );
}
