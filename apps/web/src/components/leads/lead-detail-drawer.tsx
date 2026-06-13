"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Send, TrendingUp, Sparkles, Route, MessageSquare, Globe } from "lucide-react";
import type { Lead, LeadActivity, LeadJourneyEvent, LeadJourneySummary, LeadScore } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Bar({ label, value }: { label: string; value: number }) {
  const tone = value >= 70 ? "bg-positive" : value >= 45 ? "bg-warning" : "bg-muted-foreground/60";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tnum font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function LeadDetailDrawer({ lead, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {lead && <Detail key={lead.id} lead={lead} />}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ lead }: { lead: Lead }) {
  const { notify } = useAppFeedback();
  const [score, setScore] = useState<LeadScore | null>(null);
  const [journey, setJourney] = useState<{ events: LeadJourneyEvent[]; summary: LeadJourneySummary } | null>(null);
  const [activity, setActivity] = useState<LeadActivity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      pageEngineApi.getLeadScore(lead.id),
      pageEngineApi.getLeadJourney(lead.id),
      pageEngineApi.getLeadActivity(lead.id),
    ]).then(([s, j, a]) => {
      if (cancelled) return;
      setScore(s);
      setJourney(j);
      setActivity(a);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  async function addNote() {
    const body = note.trim();
    if (!body) return;
    setSaving(true);
    try {
      const entry = await pageEngineApi.addLeadActivity(lead.id, "note", body);
      setActivity((a) => [entry, ...a]);
      setNote("");
      notify({ kind: "success", title: "Note added" });
    } catch (err) {
      notify({ kind: "error", title: "Could not add note", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
        <SheetTitle className="flex items-center gap-2 text-lg">
          {lead.name}
          {score && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums",
                score.total >= 75 ? "bg-positive/12 text-positive" : score.total >= 50 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
              )}
            >
              {score.total}
            </span>
          )}
        </SheetTitle>
        <SheetDescription>
          {lead.email}
          {lead.company ? ` · ${lead.company}` : ""}
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="overview"><Sparkles className="size-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="journey"><Route className="size-3.5" /> Journey</TabsTrigger>
            <TabsTrigger value="activity"><MessageSquare className="size-3.5" /> Activity</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {!loaded ? (
            <Loading />
          ) : (
            <>
              {score && (
                <div className="rounded-xl border border-brand/25 bg-brand/5 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand">
                    <TrendingUp className="size-3.5" /> Recommended action
                  </div>
                  <p className="mt-1 text-[13.5px] text-foreground">{score.recommendedAction}</p>
                </div>
              )}
              {score && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Bar label="Fit" value={score.fit} />
                    <Bar label="Intent" value={score.intent} />
                    <Bar label="Engagement" value={score.engagement} />
                    <Bar label="Spam risk" value={score.spamRisk} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Why this score</div>
                    {score.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12.5px]">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-4 min-w-7 items-center justify-center rounded px-1 text-[10px] font-bold tabular-nums",
                            r.impact === "positive" ? "bg-positive/12 text-positive" : r.impact === "negative" ? "bg-negative/12 text-negative" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {r.points > 0 ? `+${r.points}` : r.points}
                        </span>
                        <span className="text-muted-foreground"><span className="font-medium text-foreground">{r.label}</span> — {r.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {lead.message && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Message</div>
                  <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-border bg-surface-sunken p-3 text-[13px] text-foreground">{lead.message}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Globe className="size-3.5" /> Source: <span className="font-medium text-foreground">{lead.pageTitle}</span>
              </div>
            </>
          )}
        </TabsContent>

        {/* Journey */}
        <TabsContent value="journey" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {!loaded ? (
            <Loading />
          ) : journey && journey.events.length ? (
            <>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-sunken p-3 text-center">
                <Stat label="Touchpoints" value={journey.summary.touchpointCount} />
                <Stat label="Sessions" value={journey.summary.sessionCount} />
                <Stat label="Time to convert" value={journey.summary.timeToConvertSeconds != null ? `${Math.round(journey.summary.timeToConvertSeconds / 60)}m` : "—"} />
              </div>
              <ol className="relative space-y-3 border-l border-border pl-4">
                {journey.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-brand ring-2 ring-card" />
                    <div className="text-[13px] font-medium text-foreground">{e.title ?? e.url}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      <span className="capitalize">{e.type.replace(/_/g, " ")}</span> · {relativeTime(e.occurredAt)}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No journey events recorded for this lead.</p>
          )}
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="flex min-h-0 flex-1 flex-col px-6 py-4">
          <div className="flex items-start gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Log a note, call, or email…"
              className="flex-1 resize-none rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm outline-none focus:border-ring focus:bg-card"
            />
            <Button className="h-9" onClick={addNote} disabled={saving || !note.trim()}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
            {!loaded ? (
              <Loading />
            ) : activity.length ? (
              activity.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-surface-sunken p-2.5">
                  <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                    <span className="font-semibold capitalize text-foreground">{a.type.replace(/_/g, " ")}</span>
                    <span>{relativeTime(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-foreground">{a.body}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No activity yet. Add the first note above.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="tnum text-[15px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      <RefreshCw className="mr-2 size-4 animate-spin" /> Loading…
    </div>
  );
}
