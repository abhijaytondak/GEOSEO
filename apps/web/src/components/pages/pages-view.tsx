"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Eye,
  CheckCircle2,
  RefreshCw,
  Rocket,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Loader2,
  ExternalLink,
  Pencil,
  Save,
  History,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  GitCompare,
  Palette,
} from "lucide-react";
import type {
  GeneratedPage,
  KeywordOpportunity,
  PageBlueprint,
  PageEdit,
  PageStatus,
  PageVersion,
  ThemeFidelity,
} from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Panel } from "@/components/dashboard/panel";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";
import { pageEngineApi, type RefreshRec } from "@/lib/page-engine-client";
import { draftWithPuter } from "@/lib/puter-ai";

const STATUS: Record<PageStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
  "in-review": { label: "In review", cls: "bg-warning/15 text-warning" },
  approved: { label: "Approved", cls: "bg-info/12 text-info" },
  published: { label: "Published", cls: "bg-positive/12 text-positive" },
  "needs-refresh": { label: "Needs refresh", cls: "bg-negative/12 text-negative" },
};

const INTENT_CLS: Record<string, string> = {
  commercial: "bg-brand/12 text-brand",
  transactional: "bg-positive/12 text-positive",
  comparison: "bg-info/12 text-info",
  informational: "bg-muted text-muted-foreground",
  local: "bg-warning/15 text-warning",
  navigational: "bg-muted text-muted-foreground",
};

function seoScore(p: GeneratedPage): { pass: number; total: number } {
  const checks = p.seoChecks ?? [];
  return { pass: checks.filter((c) => c.pass).length, total: checks.length };
}

// Theme-fidelity grade → label + chip tones (PRD §13).
const FIDELITY_GRADE: Record<ThemeFidelity["grade"], { label: string; cls: string; dot: string }> = {
  "native-fit": { label: "Native fit", cls: "bg-positive/12 text-positive", dot: "bg-positive" },
  acceptable: { label: "Acceptable", cls: "bg-warning/15 text-warning", dot: "bg-warning" },
  "needs-review": { label: "Needs review", cls: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
};

export function PagesView({
  pages: initialPages,
  opportunities,
  blueprints: initialBlueprints,
  recommendations = [],
}: {
  pages: GeneratedPage[];
  opportunities: KeywordOpportunity[];
  blueprints: PageBlueprint[];
  recommendations?: RefreshRec[];
}) {
  const { notify, confirm } = useAppFeedback();
  const [pages, setPages] = useState(initialPages);
  const [opps, setOpps] = useState(opportunities);
  const [blueprints, setBlueprints] = useState(initialBlueprints);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [seeds, setSeeds] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PageEdit>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [diffId, setDiffId] = useState<string | null>(null);
  const [fidelity, setFidelity] = useState<ThemeFidelity | null>(null);

  // Workspace theme-fidelity score — how natively published pages render to the customer site (PRD §13).
  useEffect(() => {
    let cancelled = false;
    api.getThemeFidelity().then((res) => {
      if (!cancelled) setFidelity(res.fidelity);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // load version history whenever the drawer opens a page (no sync setState here)
  useEffect(() => {
    if (!openId) return;
    let cancelled = false;
    pageEngineApi.getPageVersions(openId).then((v) => {
      if (!cancelled) setVersions(v);
    });
    return () => {
      cancelled = true;
    };
  }, [openId]);

  function openPage(id: string) {
    setEditing(false);
    setOpenId(id);
  }
  function closePage() {
    setEditing(false);
    setOpenId(null);
  }

  function startEdit(p: GeneratedPage) {
    setDraft({
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      heroCopy: p.heroCopy,
      cta: p.cta,
      sections: p.sections.map((s) => ({ ...s })),
      faqs: p.faqs.map((f) => ({ ...f })),
    });
    setEditing(true);
  }

  function setSection(i: number, patch: Partial<{ heading: string; body: string }>) {
    setDraft((d) => ({
      ...d,
      sections: (d.sections ?? []).map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }
  function addSection() {
    setDraft((d) => ({ ...d, sections: [...(d.sections ?? []), { heading: "New section", body: "" }] }));
  }
  function removeSection(i: number) {
    setDraft((d) => ({ ...d, sections: (d.sections ?? []).filter((_, idx) => idx !== i) }));
  }
  function setFaq(i: number, patch: Partial<{ q: string; a: string }>) {
    setDraft((d) => ({
      ...d,
      faqs: (d.faqs ?? []).map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    }));
  }
  function addFaq() {
    setDraft((d) => ({ ...d, faqs: [...(d.faqs ?? []), { q: "New question?", a: "" }] }));
  }
  function removeFaq(i: number) {
    setDraft((d) => ({ ...d, faqs: (d.faqs ?? []).filter((_, idx) => idx !== i) }));
  }

  async function saveEdit(id: string) {
    setSavingEdit(true);
    try {
      const updated = await pageEngineApi.updatePage(id, draft);
      setPages((arr) => arr.map((p) => (p.id === id ? updated : p)));
      setVersions(await pageEngineApi.getPageVersions(id));
      setEditing(false);
      notify({ kind: "success", title: "Page updated" });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSavingEdit(false);
    }
  }

  async function rollback(id: string, versionId: string) {
    const ok = await confirm({
      title: "Roll back this page?",
      message: "The live page will be replaced with this earlier version.",
      confirmLabel: "Roll back",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const updated = await pageEngineApi.rollbackPage(id, versionId);
      setPages((arr) => arr.map((p) => (p.id === id ? updated : p)));
      setVersions(await pageEngineApi.getPageVersions(id));
      notify({ kind: "success", title: "Page rolled back" });
    } catch (err) {
      notify({ kind: "error", title: "Rollback failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function runDiscover() {
    const list = seeds.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) return;
    setDiscovering(true);
    try {
      const { created } = await pageEngineApi.discoverOpportunities(list);
      setOpps((arr) => [...created, ...arr]);
      setSeeds("");
      notify({
        kind: "success",
        title: "Opportunities discovered",
        message: `${created.length} new keyword ${created.length === 1 ? "opportunity" : "opportunities"} added.`,
      });
    } catch (err) {
      notify({ kind: "error", title: "Discovery failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setDiscovering(false);
    }
  }

  async function approveBlueprint(id: string) {
    try {
      const updated = await pageEngineApi.approveBlueprint(id);
      setBlueprints((arr) => arr.map((b) => (b.id === id ? updated : b)));
      notify({ kind: "success", title: "Blueprint approved" });
    } catch (err) {
      notify({ kind: "error", title: "Approve failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  const current = pages.find((p) => p.id === openId) ?? null;
  const blueprintFor = (p: GeneratedPage | null) =>
    p ? blueprints.find((b) => b.id === p.blueprintId) : undefined;

  const counts = useMemo(() => {
    const by = (s: PageStatus) => pages.filter((p) => p.status === s).length;
    return {
      published: by("published"),
      review: by("in-review") + by("approved"),
      drafts: by("draft"),
      refresh: by("needs-refresh"),
    };
  }, [pages]);

  async function transition(id: string, to: PageStatus, label: string) {
    if (to === "published") {
      const ok = await confirm({
        title: "Publish this page?",
        message: "It will go live on your domain and become crawlable by search engines and AI answers.",
        confirmLabel: "Publish",
      });
      if (!ok) return;
    }
    setBusy(id);
    try {
      const updated =
        to === "published"
          ? await pageEngineApi.publishPage(id)
          : to === "approved"
            ? await pageEngineApi.approvePage(id)
            : await pageEngineApi.submitPage(id);
      setPages((arr) => arr.map((p) => (p.id === id ? updated : p)));
      notify({ kind: "success", title: label });
    } catch (err) {
      notify({
        kind: "error",
        title: "Action failed",
        message: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function generateFromOpportunity(opp: KeywordOpportunity) {
    setBusy(opp.id);
    try {
      // Draft in-browser with Puter AI (user-pays). Null → server falls back.
      const content = await draftWithPuter(opp.query, opp.recommendedPageType);
      const page = await pageEngineApi.generatePage(opp.id, content ?? undefined);
      setPages((arr) => [page, ...arr]);
      setOpps((arr) => arr.map((o) => (o.id === opp.id ? { ...o, status: "approved" } : o)));
      openPage(page.id);
      notify({
        kind: "success",
        title: content ? "AI draft generated" : "Draft generated",
        message: `"${opp.query}" → a new page draft is ready to review.`,
      });
    } catch (err) {
      notify({
        kind: "error",
        title: "Generation failed",
        message: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  const newOpps = opps.filter((o) => o.status === "new");

  return (
    <div className="space-y-5">
      {/* Theme-fidelity badge (PRD §13) — how natively published pages match the customer site */}
      {fidelity && (
        <a
          href="/theme"
          title={fidelity.recommendedAction}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Palette className="size-3.5 text-muted-foreground" />
          Theme fidelity
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", FIDELITY_GRADE[fidelity.grade].cls)}>
            <span className={cn("size-1.5 rounded-full", FIDELITY_GRADE[fidelity.grade].dot)} />
            <span className="tabular-nums">{fidelity.score}</span> · {FIDELITY_GRADE[fidelity.grade].label}
          </span>
        </a>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Published", value: counts.published, icon: Rocket },
          { label: "In review", value: counts.review, icon: Eye },
          { label: "Drafts", value: counts.drafts, icon: FileText },
          { label: "Needs refresh", value: counts.refresh, icon: RefreshCw },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {s.label}
                </span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="tnum mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-foreground">
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* refresh recommendations (monitoring · PRD §7.8 / §9.1) */}
      {recommendations.length > 0 && (
        <Panel
          title="Needs Attention"
          description="Monitoring flagged these published pages"
          bodyClassName="p-0"
        >
          <div className="divide-y divide-border">
            {recommendations.map((r) => (
              <div key={r.pageId} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize",
                    r.action === "rebuild" ? "bg-negative/12 text-negative" : "bg-warning/15 text-warning",
                  )}
                >
                  {r.action}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-foreground">{r.title}</div>
                  <div className="truncate text-[12px] text-muted-foreground">{r.reason}</div>
                </div>
                <Button size="sm" variant="outline" className="h-8 rounded-full px-3" onClick={() => openPage(r.pageId)}>
                  <RefreshCw className="size-3.5" />
                  Review
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* generated pages */}
        <Panel
          title="Generated Pages"
          description="Research → blueprint → draft → publish"
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="divide-y divide-border">
            {pages.map((p) => {
              const s = seoScore(p);
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-foreground">{p.title}</span>
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold", (STATUS[p.status] ?? STATUS.draft).cls)}>
                        {(STATUS[p.status] ?? STATUS.draft).label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-muted-foreground">
                      <span className="capitalize">{p.pageType}</span>
                      <span>·</span>
                      <span className="truncate">{p.slug}</span>
                      <span>·</span>
                      <span className={cn(s.pass === s.total ? "text-positive" : "text-warning")}>
                        SEO {s.pass}/{s.total}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 rounded-full px-3" onClick={() => openPage(p.id)}>
                    <Eye className="size-3.5" />
                    Review
                  </Button>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* opportunity backlog → generate */}
        <Panel title="Opportunity Backlog" description="Discover buyer-intent keywords, then draft">
          {/* seed-driven discovery */}
          <div className="mb-3 flex gap-2">
            <input
              value={seeds}
              onChange={(e) => setSeeds(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runDiscover()}
              placeholder="Seed topics, comma-separated…"
              className="h-9 flex-1 rounded-lg border border-border bg-surface-sunken px-3 text-[13px] outline-none focus:border-ring focus:bg-card"
            />
            <Button size="sm" className="h-9 shrink-0 rounded-full px-3" disabled={discovering || !seeds.trim()} onClick={runDiscover}>
              {discovering ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Discover
            </Button>
          </div>
          <div className="space-y-2.5">
            {newOpps.length === 0 && (
              <p className="py-6 text-center text-[13px] text-muted-foreground">All caught up — no new opportunities.</p>
            )}
            {newOpps.map((o) => (
              <div key={o.id} className="rounded-xl border border-border bg-surface-sunken p-3">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-foreground">{o.query}</span>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize", INTENT_CLS[o.intent] ?? "bg-muted text-muted-foreground")}>
                    {o.intent}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground tabular-nums">
                  <span>Vol {o.volume.toLocaleString()}</span>
                  <span>·</span>
                  <span>KD {o.difficulty}</span>
                  <span>·</span>
                  <span>Value {o.commercialValue}</span>
                </div>
                <Button
                  size="sm"
                  className="mt-2.5 h-8 w-full rounded-full"
                  disabled={busy === o.id}
                  onClick={() => generateFromOpportunity(o)}
                >
                  {busy === o.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  Generate draft
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* detail / editor drawer */}
      <Sheet open={openId !== null} onOpenChange={(o) => !o && closePage()}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          {current && (
            <>
              <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand">
                  <FileText className="size-3.5" />
                  {current.pageType} page
                </div>
                <SheetTitle className="mt-1 flex items-center gap-2 text-lg">
                  {current.title}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", (STATUS[current.status] ?? STATUS.draft).cls)}>
                    {(STATUS[current.status] ?? STATUS.draft).label}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  {current.publishedUrl ? (
                    <a href={current.publishedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                      {current.publishedUrl} <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <>Slug: <span className="font-medium text-foreground">{current.slug}</span></>
                  )}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-6 py-5">
                {/* SEO checks */}
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">SEO validation</h3>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {(current.seoChecks ?? []).map((c) => (
                      <div key={c.label} className="flex items-center gap-1.5 text-[12.5px]">
                        {c.pass ? <Check className="size-3.5 text-positive" /> : <X className="size-3.5 text-negative" />}
                        <span className={c.pass ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  {(current.qualityChecks ?? []).length > 0 && (
                    <>
                      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Content quality</h3>
                      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {(current.qualityChecks ?? []).map((c) => (
                          <div key={c.label} className="flex items-center gap-1.5 text-[12.5px]">
                            {c.pass ? <Check className="size-3.5 text-positive" /> : <X className="size-3.5 text-negative" />}
                            <span className={c.pass ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {/* metadata — editable (PRD §9.4 page editor) */}
                <section className="rounded-xl border border-border bg-surface-sunken p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      SEO metadata &amp; copy
                    </h3>
                    {editing ? (
                      <div className="flex gap-1.5">
                        <Button size="xs" variant="ghost" className="h-7" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                        <Button size="xs" className="h-7" disabled={savingEdit} onClick={() => saveEdit(current.id)}>
                          {savingEdit ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button size="xs" variant="outline" className="h-7" onClick={() => startEdit(current)}>
                        <Pencil className="size-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {editing ? (
                    <div className="space-y-2">
                      <input
                        value={draft.metaTitle ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, metaTitle: e.target.value }))}
                        placeholder="Meta title"
                        className="h-8 w-full rounded-lg border border-border bg-card px-2.5 text-[12.5px] outline-none focus:border-ring"
                      />
                      <textarea
                        value={draft.metaDescription ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, metaDescription: e.target.value }))}
                        rows={2}
                        placeholder="Meta description"
                        className="w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ring"
                      />
                      <textarea
                        value={draft.heroCopy ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, heroCopy: e.target.value }))}
                        rows={2}
                        placeholder="Hero copy"
                        className="w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ring"
                      />
                      <input
                        value={draft.cta?.label ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, cta: { label: e.target.value, href: d.cta?.href ?? current.cta.href } }))
                        }
                        placeholder="CTA label"
                        className="h-8 w-full rounded-lg border border-border bg-card px-2.5 text-[12.5px] outline-none focus:border-ring"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="text-[12px] font-semibold text-foreground">{current.metaTitle}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{current.metaDescription}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(current.targetKeywords ?? []).map((k) => (
                          <span key={k} className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10.5px] font-medium text-brand">{k}</span>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {/* content preview */}
                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {editing ? "Content (sections & FAQs)" : "Draft preview"}
                    </h3>
                    {!editing && (
                      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
                        {(["desktop", "mobile"] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setPreviewDevice(d)}
                            aria-pressed={previewDevice === d}
                            aria-label={`${d} preview`}
                            className={
                              "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize transition-colors " +
                              (previewDevice === d
                                ? "bg-brand/10 text-brand"
                                : "text-muted-foreground hover:text-foreground")
                            }
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {editing ? (
                    <div className="mt-2 space-y-3">
                      {/* sections */}
                      {(draft.sections ?? []).map((sec, i) => (
                        <div key={i} className="rounded-xl border border-border p-3">
                          <div className="flex items-center gap-2">
                            <input
                              value={sec.heading}
                              onChange={(e) => setSection(i, { heading: e.target.value })}
                              placeholder="Section heading"
                              className="h-8 flex-1 rounded-lg border border-border bg-card px-2.5 text-[13px] font-semibold outline-none focus:border-ring"
                            />
                            <button onClick={() => removeSection(i)} className="text-muted-foreground hover:text-negative" aria-label="Remove section">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <textarea
                            value={sec.body}
                            onChange={(e) => setSection(i, { body: e.target.value })}
                            rows={2}
                            placeholder="Section body"
                            className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ring"
                          />
                        </div>
                      ))}
                      <Button size="xs" variant="outline" className="h-7" onClick={addSection}>
                        <Plus className="size-3" /> Add section
                      </Button>

                      {/* faqs */}
                      <div className="border-t border-border pt-3">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">FAQs</div>
                        {(draft.faqs ?? []).map((f, i) => (
                          <div key={i} className="mb-2 rounded-xl border border-border p-3">
                            <div className="flex items-center gap-2">
                              <input
                                value={f.q}
                                onChange={(e) => setFaq(i, { q: e.target.value })}
                                placeholder="Question"
                                className="h-8 flex-1 rounded-lg border border-border bg-card px-2.5 text-[12.5px] font-semibold outline-none focus:border-ring"
                              />
                              <button onClick={() => removeFaq(i)} className="text-muted-foreground hover:text-negative" aria-label="Remove FAQ">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <textarea
                              value={f.a}
                              onChange={(e) => setFaq(i, { a: e.target.value })}
                              rows={2}
                              placeholder="Answer"
                              className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ring"
                            />
                          </div>
                        ))}
                        <Button size="xs" variant="outline" className="h-7" onClick={addFaq}>
                          <Plus className="size-3" /> Add FAQ
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={
                        "mt-2 rounded-xl border border-border p-4 transition-all " +
                        (previewDevice === "mobile" ? "mx-auto max-w-[360px]" : "")
                      }
                    >
                      <p className="text-[15px] font-semibold text-foreground">{current.heroCopy}</p>
                      {(current.sections ?? []).map((sec) => (
                        <div key={sec.heading} className="mt-3">
                          <div className="text-[13px] font-semibold text-foreground">{sec.heading}</div>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{sec.body}</p>
                        </div>
                      ))}
                      {(current.faqs ?? []).length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          {(current.faqs ?? []).map((f) => (
                            <div key={f.q} className="mb-2">
                              <div className="text-[12.5px] font-semibold text-foreground">{f.q}</div>
                              <div className="text-[12.5px] text-muted-foreground">{f.a}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
                {/* blueprint review */}
                {(() => {
                  const bp = blueprintFor(current);
                  if (!bp) return null;
                  return (
                    <section>
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          Blueprint
                        </h3>
                        {bp.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-positive">
                            <Check className="size-3.5" /> Approved
                          </span>
                        ) : (
                          <Button size="xs" variant="outline" className="h-7" onClick={() => approveBlueprint(bp.id)}>
                            Approve blueprint
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 space-y-2.5 rounded-xl border border-border bg-surface-sunken p-3.5 text-[12.5px]">
                        <div>
                          <span className="text-muted-foreground">Change: </span>
                          <span className="font-medium capitalize text-foreground">{bp.changeKind}</span>
                          <span className="text-muted-foreground"> · audience: </span>
                          <span className="text-foreground">{bp.audience}</span>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Outline</div>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                            {bp.outline.map((o) => (
                              <li key={o.heading}>
                                <span className="font-medium text-foreground">{o.heading}</span> — {o.summary}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">CTA plan: </span>
                          <span className="text-foreground">{bp.ctaPlan}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {bp.schemaPlan.map((s) => (
                            <span key={s} className="rounded-md bg-info/10 px-1.5 py-0.5 text-[10.5px] font-medium text-info">{s}</span>
                          ))}
                          {bp.internalLinkPlan.map((l) => (
                            <span key={l} className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">{l}</span>
                          ))}
                        </div>
                        {/* risk flags (PRD §9.3) */}
                        {(() => {
                          const risks: string[] = [];
                          if (bp.outline.length < 3) risks.push("Thin outline (<3 sections)");
                          if (!bp.ctaPlan?.trim()) risks.push("No CTA defined");
                          if (bp.internalLinkPlan.length === 0) risks.push("No internal links planned");
                          if ((bp.targetKeywords?.length ?? 0) < 2) risks.push("Narrow keyword set");
                          if (pages.some((p) => p.slug === bp.slug && p.id !== current.id))
                            risks.push("Slug collision / cannibalization risk");
                          return (
                            <div className="border-t border-border pt-2.5">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                                Risk flags
                              </div>
                              {risks.length === 0 ? (
                                <div className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-positive">
                                  <Check className="size-3.5" /> No risks detected
                                </div>
                              ) : (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {risks.map((r) => (
                                    <span
                                      key={r}
                                      className="inline-flex items-center gap-1 rounded-md bg-warning/12 px-1.5 py-0.5 text-[10.5px] font-medium text-warning"
                                    >
                                      <AlertTriangle className="size-3" /> {r}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </section>
                  );
                })()}

                {/* version history (PRD §7.6 rollback, §11.6) */}
                {versions.length > 0 && (
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      <History className="mr-1 inline size-3.5" />
                      Version history
                    </h3>
                    <ol className="mt-2 space-y-1.5">
                      {versions.map((v, i) => (
                        <li key={v.id} className="rounded-lg border border-border px-3 py-2 text-[12.5px]">
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10.5px] font-bold text-muted-foreground">
                              v{v.version}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-foreground">{v.changeSummary}</div>
                              <div className="text-[11px] capitalize text-muted-foreground">{v.authorType}</div>
                            </div>
                            {i === 0 ? (
                              <span className="rounded-full bg-positive/12 px-1.5 py-0.5 text-[10px] font-semibold text-positive">
                                Current
                              </span>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => setDiffId((id) => (id === v.id ? null : v.id))}
                                  aria-pressed={diffId === v.id}
                                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground hover:text-foreground"
                                >
                                  <GitCompare className="size-3" />
                                  {diffId === v.id ? "Hide" : "Diff"}
                                </button>
                                <button
                                  onClick={() => rollback(current.id, v.id)}
                                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand hover:underline"
                                >
                                  <RotateCcw className="size-3" />
                                  Restore
                                </button>
                              </div>
                            )}
                          </div>
                          {/* before→after diff vs current (PRD §8.3) */}
                          {diffId === v.id &&
                            (() => {
                              const rows: { label: string; before: string; after: string }[] = [
                                { label: "Meta title", before: v.metaTitle, after: current.metaTitle },
                                { label: "Meta description", before: v.metaDescription, after: current.metaDescription },
                                { label: "Hero copy", before: v.heroCopy, after: current.heroCopy },
                                { label: "Sections", before: `${v.sections.length}`, after: `${current.sections?.length ?? 0}` },
                                { label: "FAQs", before: `${v.faqs.length}`, after: `${current.faqs?.length ?? 0}` },
                              ];
                              const changed = rows.filter((r) => r.before !== r.after);
                              return (
                                <div className="mt-2 rounded-lg border border-border bg-surface-sunken p-2.5">
                                  <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                                    v{v.version} → current · {changed.length} field{changed.length === 1 ? "" : "s"} changed
                                  </div>
                                  {changed.length === 0 ? (
                                    <div className="text-[11.5px] text-muted-foreground">No content differences.</div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {changed.map((r) => (
                                        <div key={r.label} className="grid grid-cols-[64px_1fr] gap-2">
                                          <div className="pt-0.5 text-[10.5px] font-medium text-muted-foreground">{r.label}</div>
                                          <div className="space-y-0.5">
                                            <div className="rounded bg-negative/10 px-1.5 py-0.5 text-[11px] text-negative line-through decoration-negative/40">
                                              {r.before || "—"}
                                            </div>
                                            <div className="rounded bg-positive/10 px-1.5 py-0.5 text-[11px] text-positive">
                                              {r.after || "—"}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>

              {/* action footer */}
              <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-card/95 px-6 py-4 backdrop-blur">
                <span className="mr-auto text-[12px] text-muted-foreground tabular-nums">
                  {current.wordCount.toLocaleString()} words · BM v{current.brandMemoryVersion}
                </span>
                {current.status === "draft" && (
                  <Button variant="outline" className="h-9" disabled={busy === current.id} onClick={() => transition(current.id, "in-review", "Sent for review")}>
                    Submit for review
                  </Button>
                )}
                {current.status === "in-review" && (
                  <Button variant="outline" className="h-9" disabled={busy === current.id} onClick={() => transition(current.id, "approved", "Approved")}>
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                )}
                {(current.status === "approved" || current.status === "needs-refresh") && (
                  <Button className="h-9 rounded-full px-4" disabled={busy === current.id} onClick={() => transition(current.id, "published", "Published to /feeds")}>
                    {busy === current.id ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                    Publish
                  </Button>
                )}
                {current.status === "published" && (
                  <a className={cn(buttonVariants({ variant: "outline" }), "h-9")} href={current.publishedUrl} target="_blank" rel="noreferrer">
                    View live <ArrowRight className="size-3.5" />
                  </a>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
