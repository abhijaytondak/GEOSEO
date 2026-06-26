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
  Copy,
  Zap,
  BarChart2,
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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
import { PageComposer, type ComposerType } from "@/components/pages/page-composer";
import { RichText } from "@/components/feeds/rich-text";
import { KeywordReview } from "@/components/pages/keyword-review";
import { CitabilityPanel } from "@/components/pages/citability-panel";

type BadgeVariant = "brand" | "positive" | "negative" | "warning" | "info" | "muted";

const STATUS: Record<PageStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "muted" },
  "in-review": { label: "In review", variant: "warning" },
  approved: { label: "Approved", variant: "info" },
  published: { label: "Published", variant: "positive" },
  "needs-refresh": { label: "Needs refresh", variant: "negative" },
};

const INTENT_VARIANT: Record<string, BadgeVariant> = {
  commercial: "brand",
  transactional: "positive",
  comparison: "info",
  informational: "muted",
  local: "warning",
  navigational: "muted",
};

function seoScore(p: GeneratedPage): { pass: number; total: number } {
  const checks = p.seoChecks ?? [];
  return { pass: checks.filter((c) => c.pass).length, total: checks.length };
}

// Theme-fidelity grade → label + Badge variant + dot tone (PRD §13).
const FIDELITY_GRADE: Record<ThemeFidelity["grade"], { label: string; variant: BadgeVariant; dot: string }> = {
  "native-fit": { label: "Native fit", variant: "positive", dot: "bg-positive" },
  acceptable: { label: "Acceptable", variant: "warning", dot: "bg-warning" },
  "needs-review": { label: "Needs review", variant: "negative", dot: "bg-negative" },
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
  const [highlightKw, setHighlightKw] = useState(false);
  // Pages regenerated this session clear from "Needs Attention" (the staleness is resolved).
  const [refreshedIds, setRefreshedIds] = useState<Set<string>>(() => new Set());
  // Autopilot toggling — tracks which page ids are mid-toggle to show a spinner.
  const [autopilotBusy, setAutopilotBusy] = useState<string | null>(null);
  // "Create a page" composer (lifted so the backlog's "Use" can prefill it).
  const [topic, setTopic] = useState("");
  const [composerType, setComposerType] = useState<ComposerType>("auto");
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [pageFilter, setPageFilter] = useState<PageStatus | "all">("all");

  function handleGenerated(page: GeneratedPage) {
    setPages((arr) => [page, ...arr.filter((p) => p.id !== page.id)]);
    openPage(page.id);
  }
  function handleNewOpps(fresh: KeywordOpportunity[]) {
    setOpps((arr) => {
      const have = new Set(arr.map((o) => o.id));
      return [...fresh.filter((o) => !have.has(o.id)), ...arr];
    });
  }
  // Prefill the composer from a discovered opportunity (intent → page type).
  function applyOpportunityToComposer(o: KeywordOpportunity) {
    const map: Record<string, ComposerType> = {
      comparison: "comparison",
      informational: "guide",
      commercial: "landing",
      transactional: "landing",
    };
    setTopic(o.query);
    setComposerType(map[o.intent] ?? "auto");
    setIdeasOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      // Pre-publish quality gate (PRD §12) — surface blockers before going live.
      setBusy(id);
      let gate: { blockers: string[]; canPublish: boolean };
      try {
        gate = await pageEngineApi.validatePage(id);
      } catch (err) {
        setBusy(null);
        notify({ kind: "error", title: "Validation failed", message: err instanceof Error ? err.message : "Try again." });
        return;
      }
      setBusy(null);
      if (!gate.canPublish) {
        notify({ kind: "error", title: "Resolve before publishing", message: gate.blockers.join(" · ") });
        return;
      }
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

  async function duplicate(id: string) {
    setBusy(id);
    try {
      const copy = await pageEngineApi.duplicatePage(id);
      setPages((arr) => [copy, ...arr]);
      notify({ kind: "success", title: "Page duplicated", message: copy.title });
      openPage(copy.id);
    } catch (err) {
      notify({ kind: "error", title: "Duplicate failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setBusy(null);
    }
  }

  async function unpublish(id: string) {
    const ok = await confirm({
      title: "Unpublish this page?",
      message: "It will be taken offline and removed from your public feed.",
      confirmLabel: "Unpublish",
    });
    if (!ok) return;
    setBusy(id);
    try {
      const updated = await pageEngineApi.unpublishPage(id);
      setPages((arr) => arr.map((p) => (p.id === id ? updated : p)));
      notify({ kind: "success", title: "Page unpublished" });
    } catch (err) {
      notify({ kind: "error", title: "Unpublish failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setBusy(null);
    }
  }

  // Refresh All: regenerate every stale page in the "Needs Attention" list sequentially.
  // Sequential (not parallel) to avoid hammering the LLM and to let the user watch progress.
  const [refreshingAll, setRefreshingAll] = useState(false);
  async function regenerateAll() {
    const pending = recommendations.filter((r) => !refreshedIds.has(r.pageId));
    if (!pending.length) return;
    const ok = await confirm({
      title: `Regenerate ${pending.length} page${pending.length > 1 ? "s" : ""}?`,
      message: "AI will re-draft each flagged page from current Brand Memory. URLs are preserved and existing versions are saved.",
      confirmLabel: "Regenerate All",
    });
    if (!ok) return;
    setRefreshingAll(true);
    let succeeded = 0;
    for (const r of pending) {
      setBusy(r.pageId);
      try {
        const job = await pageEngineApi.startRegenerate(r.pageId);
        let res = await pageEngineApi.getRegenerateJob(job.id);
        for (let i = 0; i < 80 && res.job.status === "running"; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          res = await pageEngineApi.getRegenerateJob(job.id);
        }
        if (res.job.status !== "done" || !res.page) continue;
        setPages((arr) => arr.map((p) => (p.id === r.pageId ? res.page! : p)));
        setRefreshedIds((s) => new Set(s).add(r.pageId));
        succeeded++;
      } catch {
        /* continue with remaining pages */
      } finally {
        setBusy(null);
      }
    }
    setRefreshingAll(false);
    if (succeeded) notify({ kind: "success", title: `${succeeded} page${succeeded > 1 ? "s" : ""} refreshed`, message: "All URLs preserved; prior versions saved for rollback." });
  }

  // Auto-Updates (#8): manually re-draft a page via the LLM. Slug/URL/canonical are
  // preserved and the prior content is snapshotted as a version (reversible via rollback).
  async function regenerate(id: string) {
    const ok = await confirm({
      title: "Regenerate this page?",
      message: "AI will re-draft the content from current Brand Memory. The URL is preserved and the existing version is saved, so you can roll back.",
      confirmLabel: "Regenerate",
    });
    if (!ok) return;
    setBusy(id);
    try {
      // Async job + poll — the LLM re-draft exceeds the hosted sync request budget (~30s).
      const job = await pageEngineApi.startRegenerate(id);
      let res = await pageEngineApi.getRegenerateJob(job.id);
      for (let i = 0; i < 80 && res.job.status === "running"; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        res = await pageEngineApi.getRegenerateJob(job.id);
      }
      if (res.job.status === "failed") throw new Error(res.job.error ?? "Regeneration failed");
      if (res.job.status === "running" || !res.page) throw new Error("Still regenerating — refresh in a moment.");
      const updated = res.page;
      setPages((arr) => arr.map((p) => (p.id === id ? updated : p)));
      setVersions(await pageEngineApi.getPageVersions(id));
      setRefreshedIds((s) => new Set(s).add(id));
      notify({ kind: "success", title: "Page regenerated", message: "Re-drafted from Brand Memory; URL unchanged." });
    } catch (err) {
      notify({ kind: "error", title: "Regenerate failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setBusy(null);
    }
  }

  async function toggleAutopilot(id: string, enabled: boolean) {
    setAutopilotBusy(id);
    try {
      const updated = await pageEngineApi.toggleAutopilot(id, enabled);
      setPages((arr) => arr.map((p) => (p.id === id ? updated : p)));
      notify({
        kind: "success",
        title: enabled ? "Autopilot on" : "Autopilot off",
        message: enabled
          ? "This page will be automatically re-drafted when flagged stale."
          : "Autopilot disabled — you'll be notified when a refresh is needed.",
      });
    } catch (err) {
      notify({ kind: "error", title: "Autopilot toggle failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setAutopilotBusy(null);
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

  const newOpps = opps
    .filter((o) => o.status === "new")
    .filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i);

  return (
    <div className="space-y-5">
      {/* Theme-fidelity badge (PRD §13) — how natively published pages match the customer site */}
      {fidelity && (
        <a
          href="/theme"
          title={fidelity.recommendedAction}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-label font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Palette className="size-3.5 text-muted-foreground" />
          Theme fidelity
          <Badge variant={FIDELITY_GRADE[fidelity.grade].variant}>
            <span className={cn("size-1.5 rounded-full", FIDELITY_GRADE[fidelity.grade].dot)} />
            <span className="tabular-nums">{fidelity.score}</span> · {FIDELITY_GRADE[fidelity.grade].label}
          </Badge>
        </a>
      )}

      {/* ✦ Create a page — the generator's focal point */}
      <PageComposer
        topic={topic}
        onTopicChange={setTopic}
        pageType={composerType}
        onTypeChange={setComposerType}
        existingOppIds={opps.map((o) => o.id)}
        onGenerated={handleGenerated}
        onNewOpps={handleNewOpps}
      />

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
            <div key={s.label} className="card-lift rounded-2xl border border-border bg-card p-4 shadow-card animate-fade-in-up">
              <div className="flex items-center justify-between">
                <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="tnum mt-1.5 text-kpi text-foreground">
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* refresh recommendations (monitoring · PRD §7.8 / §9.1) */}
      {recommendations.filter((r) => !refreshedIds.has(r.pageId)).length > 0 && (
        <Panel
          title="Needs Attention"
          description="Monitoring flagged these published pages — regenerate to refresh them"
          bodyClassName="p-0"
          action={
            <Button size="sm" variant="outline" className="h-8 rounded-full px-3 gap-1.5" disabled={refreshingAll} onClick={regenerateAll}>
              {refreshingAll ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Refresh All
            </Button>
          }
        >
          <div className="divide-y divide-border">
            {recommendations.filter((r) => !refreshedIds.has(r.pageId)).map((r) => (
              <div key={r.pageId} className="flex items-center gap-3 px-5 py-3">
                <Badge variant={r.action === "rebuild" ? "negative" : "warning"} className="shrink-0 capitalize">
                  {r.action}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-label font-semibold text-foreground">{r.title}</div>
                  <div className="truncate text-label text-muted-foreground">{r.reason}</div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-3" onClick={() => openPage(r.pageId)}>
                  Review
                </Button>
                <Button size="sm" variant="outline" className="h-8 shrink-0 rounded-full px-3" disabled={busy === r.pageId} onClick={() => regenerate(r.pageId)}>
                  {busy === r.pageId ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  Regenerate
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* your pages — visual cards */}
      <Panel title="Your pages" description="Every page you generate, ready to review and publish" bodyClassName="p-0">
        {pages.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            tone="prompt"
            title="No pages yet"
            description={
              <>
                Describe a topic in <span className="font-medium text-foreground">Create a page</span> above to generate your first one.
              </>
            }
            className="py-14"
          />
        ) : (
          <>
            {/* status filters */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-5 py-3">
              {([
                { key: "all", label: "All" },
                { key: "published", label: "Published" },
                { key: "draft", label: "Draft" },
                { key: "in-review", label: "In review" },
                { key: "approved", label: "Approved" },
                { key: "needs-refresh", label: "Needs refresh" },
              ] as const).map((f) => {
                const n = f.key === "all" ? pages.length : pages.filter((p) => p.status === f.key).length;
                if (n === 0 && f.key !== "all") return null;
                const active = pageFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setPageFilter(f.key)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      active ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label}
                    <span className={cn("rounded-full px-1.5 text-micro tabular-nums", active ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground")}>{n}</span>
                  </button>
                );
              })}
            </div>
            {(() => {
              const filtered = pageFilter === "all" ? pages : pages.filter((p) => p.status === pageFilter);
              if (filtered.length === 0) {
                return (
                  <p className="px-6 py-12 text-center text-label text-muted-foreground">
                    No {(STATUS[pageFilter as PageStatus]?.label ?? "matching").toLowerCase()} pages.
                  </p>
                );
              }
              return (
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((p) => {
              const s = seoScore(p);
              const st = STATUS[p.status] ?? STATUS.draft;
              return (
                <div
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-[box-shadow,transform] duration-200 ease-out hover:shadow-raised hover:-translate-y-0.5"
                >
                  {/* themed hero strip */}
                  <button onClick={() => openPage(p.id)} className="relative block h-20 w-full overflow-hidden text-left">
                    {p.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- generated/CDN image, not a static asset
                      <img src={p.heroImageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full bg-gradient-to-br from-brand/25 via-brand/8 to-card" />
                    )}
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-card/85 px-2 py-0.5 text-micro font-semibold capitalize text-foreground backdrop-blur">
                      {p.pageType}
                    </span>
                    <Badge variant={st.variant} className="absolute right-2.5 top-2.5">
                      {st.label}
                    </Badge>
                  </button>
                  {/* body */}
                  <button onClick={() => openPage(p.id)} className="flex-1 px-4 pt-3 text-left">
                    <div className="line-clamp-2 text-body font-semibold leading-snug text-foreground">{p.title}</div>
                    <div className="mt-1 flex items-center gap-1.5 truncate text-micro text-muted-foreground">
                      <span className="truncate">{p.slug}</span>
                      <span>·</span>
                      <span className={cn("shrink-0 tabular-nums", s.total > 0 && s.pass === s.total ? "text-positive" : "text-warning")}>
                        SEO {s.pass}/{s.total}
                      </span>
                    </div>
                  </button>
                  {/* actions */}
                  <div className="flex items-center gap-1.5 px-4 pb-3 pt-2.5">
                    {p.status === "published" && p.publishedUrl ? (
                      <a
                        href={p.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 flex-1 rounded-full")}
                      >
                        View live <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 flex-1 rounded-full" onClick={() => openPage(p.id)}>
                        <Eye className="size-3.5" /> Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-8 shrink-0 rounded-full p-0"
                      title="Regenerate from Brand Memory"
                      aria-label="Regenerate"
                      disabled={busy === p.id}
                      onClick={() => regenerate(p.id)}
                    >
                      {busy === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    </Button>
                    <button
                      title={p.autopilot ? "Autopilot on — click to disable" : "Autopilot off — click to enable"}
                      aria-label={p.autopilot ? "Disable autopilot" : "Enable autopilot"}
                      aria-pressed={!!p.autopilot}
                      disabled={autopilotBusy === p.id}
                      onClick={() => toggleAutopilot(p.id, !p.autopilot)}
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        p.autopilot
                          ? "border-brand/40 bg-brand/10 text-brand hover:bg-brand/20"
                          : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {autopilotBusy === p.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Zap className={cn("size-3.5", p.autopilot && "fill-brand")} />
                      )}
                    </button>
                  </div>
                </div>
              );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </Panel>

      {/* need ideas? — discovery demoted to an optional assist */}
      <div className="rounded-2xl border border-border bg-card shadow-card">
        <button
          onClick={() => setIdeasOpen((v) => !v)}
          aria-expanded={ideasOpen}
          className="flex w-full items-center gap-2 px-5 py-3.5 text-left"
        >
          <Sparkles className="size-4 text-muted-foreground" />
          <span className="text-body font-semibold text-foreground">Need ideas?</span>
          <span className="text-label text-muted-foreground">Discover buyer-intent keywords to generate from</span>
          <ArrowRight className={cn("ml-auto size-4 text-muted-foreground transition-transform", ideasOpen && "rotate-90")} />
        </button>
        {ideasOpen && (
          <div className="border-t border-border p-5">
            <div className="mb-3 flex gap-2">
              <input
                value={seeds}
                onChange={(e) => setSeeds(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runDiscover()}
                placeholder="Seed topics, comma-separated…"
                className="h-9 flex-1 rounded-lg border border-border bg-surface-sunken px-3 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus:bg-card"
              />
              <Button size="sm" className="h-9 shrink-0 rounded-full px-3" disabled={discovering || !seeds.trim()} onClick={runDiscover}>
                {discovering ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                Discover
              </Button>
            </div>
            {newOpps.length === 0 ? (
              <p className="py-6 text-center text-label text-muted-foreground">No open opportunities — discover some above.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {newOpps.map((o) => (
                  <div key={o.id} className="rounded-xl border border-border bg-surface-sunken p-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-label font-semibold text-foreground">{o.query}</span>
                      <Badge variant={INTENT_VARIANT[o.intent] ?? "muted"} className="shrink-0 capitalize">
                        {o.intent}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-micro text-muted-foreground tabular-nums">
                      <span>Vol {o.volume.toLocaleString()}</span>
                      <span>·</span>
                      <span>KD {o.difficulty}</span>
                      <span>·</span>
                      <span>Value {o.commercialValue}</span>
                    </div>
                    <div className="mt-2.5 flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 rounded-full"
                        onClick={() => applyOpportunityToComposer(o)}
                      >
                        Use as topic
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 flex-1 rounded-full"
                        disabled={busy === o.id}
                        onClick={() => generateFromOpportunity(o)}
                      >
                        {busy === o.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* detail / editor drawer */}
      <Sheet open={openId !== null} onOpenChange={(o) => !o && closePage()}>
        <SheetContent side="right" className="!w-full gap-0 overflow-y-auto p-0 !max-w-none">
          {current && (
            <>
              <SheetHeader className="mx-auto w-full max-w-5xl border-b border-border px-6 pb-4 pt-6">
                <div className="flex items-center gap-2 text-micro font-semibold uppercase text-brand">
                  <FileText className="size-3.5" />
                  {current.pageType} page
                </div>
                <SheetTitle className="mt-1 flex items-center gap-2 text-title">
                  {current.title}
                  <Badge variant={(STATUS[current.status] ?? STATUS.draft).variant}>
                    {(STATUS[current.status] ?? STATUS.draft).label}
                  </Badge>
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

              <div className="mx-auto w-full max-w-5xl space-y-5 px-6 py-5 lg:py-8">
                {/* lifecycle pipeline + next-step hint — orients the user right after generating */}
                {(() => {
                  const STAGES = [
                    { key: "draft", label: "Draft" },
                    { key: "in-review", label: "Review" },
                    { key: "approved", label: "Approved" },
                    { key: "published", label: "Published" },
                  ] as const;
                  const idx = current.status === "needs-refresh" ? 3 : STAGES.findIndex((s) => s.key === current.status);
                  const HINT: Record<PageStatus, string> = {
                    draft: "Draft ready — review it below, then submit for approval.",
                    "in-review": "In review — approve it to make it publish-ready.",
                    approved: "Approved — publish it to your feed when you're ready.",
                    published: "Live on your feed. Regenerate any time to refresh it.",
                    "needs-refresh": "Published but flagged stale — Regenerate to refresh the content.",
                  };
                  const stale = current.status === "needs-refresh";
                  return (
                    <section className="rounded-xl border border-border bg-surface-sunken p-3.5">
                      <div className="flex items-center gap-1">
                        {STAGES.map((s, i) => {
                          const state = i < idx ? "done" : i === idx ? "active" : "pending";
                          return (
                            <div key={s.key} className="flex flex-1 items-center gap-1">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-micro font-semibold",
                                  state === "done" && "bg-positive/12 text-positive",
                                  state === "active" && (stale ? "bg-negative/12 text-negative" : "bg-brand/12 text-brand"),
                                  state === "pending" && "text-muted-foreground",
                                )}
                              >
                                {state === "done" && <Check className="size-3" />}
                                {state === "active" && <span className={cn("size-1.5 rounded-full", stale ? "bg-negative" : "bg-brand")} />}
                                {s.label}
                              </span>
                              {i < STAGES.length - 1 && (
                                <span className={cn("h-px flex-1", i < idx ? "bg-positive/40" : "bg-border")} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2.5 text-label text-muted-foreground">{HINT[current.status] ?? HINT.draft}</p>
                    </section>
                  );
                })()}

                {/* keyword analysis + add-keywords → LLM rewrite (the review core) */}
                <KeywordReview
                  page={current}
                  onRewritten={(p) => {
                    setPages((arr) => arr.map((x) => (x.id === p.id ? p : x)));
                    pageEngineApi.getPageVersions(p.id).then(setVersions).catch(() => {});
                  }}
                  highlightOn={highlightKw}
                  onToggleHighlight={() => setHighlightKw((v) => !v)}
                  notify={notify}
                />

                {/* SEO checks */}
                <section>
                  <h3 className="text-micro font-semibold uppercase text-muted-foreground">SEO validation</h3>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {(current.seoChecks ?? []).map((c) => (
                      <div key={c.label} className="flex items-center gap-1.5 text-label">
                        {c.pass ? <Check className="size-3.5 text-positive" /> : <X className="size-3.5 text-negative" />}
                        <span className={c.pass ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  {(current.qualityChecks ?? []).length > 0 && (
                    <>
                      <h3 className="mt-4 text-micro font-semibold uppercase text-muted-foreground">Content quality</h3>
                      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {(current.qualityChecks ?? []).map((c) => (
                          <div key={c.label} className="flex items-center gap-1.5 text-label">
                            {c.pass ? <Check className="size-3.5 text-positive" /> : <X className="size-3.5 text-negative" />}
                            <span className={c.pass ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {/* citability / AEO score — how citable the page is by AI answer engines */}
                <CitabilityPanel pageId={current.id} updatedAt={current.updatedAt} />

                {/* infographics badge (PRD Phase 3) */}
                {(current.infographics?.length ?? 0) > 0 && (
                  <section>
                    <div className="flex items-center gap-2">
                      <BarChart2 className="size-3.5 text-muted-foreground" />
                      <h3 className="text-micro font-semibold uppercase text-muted-foreground">Infographics</h3>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {current.infographics!.map((spec, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-micro font-semibold capitalize text-brand"
                        >
                          {spec.kind}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* metadata — editable (PRD §9.4 page editor) */}
                <section className="rounded-xl border border-border bg-surface-sunken p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-micro font-semibold uppercase text-muted-foreground">
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
                        className="h-8 w-full rounded-lg border border-border bg-card px-2.5 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      <textarea
                        value={draft.metaDescription ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, metaDescription: e.target.value }))}
                        rows={2}
                        placeholder="Meta description"
                        className="w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      <textarea
                        value={draft.heroCopy ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, heroCopy: e.target.value }))}
                        rows={2}
                        placeholder="Hero copy"
                        className="w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      <input
                        value={draft.cta?.label ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, cta: { label: e.target.value, href: d.cta?.href ?? current.cta.href } }))
                        }
                        placeholder="CTA label"
                        className="h-8 w-full rounded-lg border border-border bg-card px-2.5 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="text-label font-semibold text-foreground">{current.metaTitle}</div>
                      <div className="mt-0.5 text-label text-muted-foreground">{current.metaDescription}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(current.targetKeywords ?? []).map((k) => (
                          <span key={k} className="rounded-md bg-brand/10 px-1.5 py-0.5 text-micro font-medium text-brand">{k}</span>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {/* content preview */}
                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-micro font-semibold uppercase text-muted-foreground">
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
                              "rounded-md px-2 py-0.5 text-micro font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 " +
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
                              className="h-8 flex-1 rounded-lg border border-border bg-card px-2.5 text-label font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            />
                            <button onClick={() => removeSection(i)} className="rounded-md text-muted-foreground transition-colors hover:text-negative focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Remove section">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <textarea
                            value={sec.body}
                            onChange={(e) => setSection(i, { body: e.target.value })}
                            rows={6}
                            placeholder="Section body — paragraphs, and '- ' bullets or '1.' steps render as lists"
                            className="mt-2 w-full resize-y rounded-lg border border-border bg-card px-2.5 py-1.5 text-label leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                        </div>
                      ))}
                      <Button size="xs" variant="outline" className="h-7" onClick={addSection}>
                        <Plus className="size-3" /> Add section
                      </Button>

                      {/* faqs */}
                      <div className="border-t border-border pt-3">
                        <div className="mb-2 text-micro font-semibold uppercase text-muted-foreground">FAQs</div>
                        {(draft.faqs ?? []).map((f, i) => (
                          <div key={i} className="mb-2 rounded-xl border border-border p-3">
                            <div className="flex items-center gap-2">
                              <input
                                value={f.q}
                                onChange={(e) => setFaq(i, { q: e.target.value })}
                                placeholder="Question"
                                className="h-8 flex-1 rounded-lg border border-border bg-card px-2.5 text-label font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                              />
                              <button onClick={() => removeFaq(i)} className="rounded-md text-muted-foreground transition-colors hover:text-negative focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Remove FAQ">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <textarea
                              value={f.a}
                              onChange={(e) => setFaq(i, { a: e.target.value })}
                              rows={2}
                              placeholder="Answer"
                              className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                        "mt-2 rounded-xl border border-border overflow-hidden transition-all " +
                        (previewDevice === "mobile" ? "mx-auto max-w-[360px]" : "")
                      }
                    >
                      {current.heroImageUrl && (
                        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-brand/20 to-card">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={current.heroImageUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                      <p className="text-h-card font-semibold text-foreground">{current.heroCopy}</p>
                      {(current.sections ?? []).map((sec) => (
                        <div key={sec.heading} className="mt-3">
                          <div className="text-label font-semibold text-foreground">{sec.heading}</div>
                          <div className="mt-0.5">
                            <RichText text={sec.body} dense highlight={highlightKw ? current.targetKeywords : undefined} />
                          </div>
                        </div>
                      ))}
                      {(current.faqs ?? []).length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          {(current.faqs ?? []).map((f) => (
                            <div key={f.q} className="mb-2">
                              <div className="text-label font-semibold text-foreground">{f.q}</div>
                              <div className="text-label text-muted-foreground">{f.a}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
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
                        <h3 className="text-micro font-semibold uppercase text-muted-foreground">
                          Blueprint
                        </h3>
                        {bp.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 text-label font-semibold text-positive">
                            <Check className="size-3.5" /> Approved
                          </span>
                        ) : (
                          <Button size="xs" variant="outline" className="h-7" onClick={() => approveBlueprint(bp.id)}>
                            Approve blueprint
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 space-y-2.5 rounded-xl border border-border bg-surface-sunken p-3.5 text-label">
                        <div>
                          <span className="text-muted-foreground">Change: </span>
                          <span className="font-medium capitalize text-foreground">{bp.changeKind}</span>
                          <span className="text-muted-foreground"> · audience: </span>
                          <span className="text-foreground">{bp.audience}</span>
                        </div>
                        <div>
                          <div className="text-micro font-semibold uppercase text-muted-foreground">Outline</div>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                            {bp.outline.map((o) => (
                              <li key={o.heading}>
                                <span className="font-medium text-foreground">{o.heading}</span> — {o.summary}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-micro font-semibold uppercase text-muted-foreground">CTA plan: </span>
                          <span className="text-foreground">{bp.ctaPlan}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {bp.schemaPlan.map((s) => (
                            <span key={s} className="rounded-md bg-info/10 px-1.5 py-0.5 text-micro font-medium text-info">{s}</span>
                          ))}
                          {bp.internalLinkPlan.map((l) => (
                            <span key={l} className="rounded-md bg-muted px-1.5 py-0.5 text-micro font-medium text-muted-foreground">{l}</span>
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
                              <div className="text-micro font-semibold uppercase text-muted-foreground">
                                Risk flags
                              </div>
                              {risks.length === 0 ? (
                                <div className="mt-1 inline-flex items-center gap-1 text-label font-medium text-positive">
                                  <Check className="size-3.5" /> No risks detected
                                </div>
                              ) : (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {risks.map((r) => (
                                    <span
                                      key={r}
                                      className="inline-flex items-center gap-1 rounded-md bg-warning/12 px-1.5 py-0.5 text-micro font-medium text-warning"
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
                    <h3 className="text-micro font-semibold uppercase text-muted-foreground">
                      <History className="mr-1 inline size-3.5" />
                      Version history
                    </h3>
                    <ol className="mt-2 space-y-1.5">
                      {versions.map((v, i) => (
                        <li key={v.id} className="rounded-lg border border-border px-3 py-2 text-label">
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-micro font-bold text-muted-foreground">
                              v{v.version}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-foreground">{v.changeSummary}</div>
                              <div className="text-micro capitalize text-muted-foreground">{v.authorType}</div>
                            </div>
                            {i === 0 ? (
                              <Badge variant="positive">
                                Current
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => setDiffId((id) => (id === v.id ? null : v.id))}
                                  aria-pressed={diffId === v.id}
                                  className="inline-flex items-center gap-1 rounded-md text-label font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                >
                                  <GitCompare className="size-3" />
                                  {diffId === v.id ? "Hide" : "Diff"}
                                </button>
                                <button
                                  onClick={() => rollback(current.id, v.id)}
                                  className="inline-flex items-center gap-1 rounded-md text-label font-semibold text-brand transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                                  <div className="mb-1.5 text-micro font-semibold uppercase text-muted-foreground">
                                    v{v.version} → current · {changed.length} field{changed.length === 1 ? "" : "s"} changed
                                  </div>
                                  {changed.length === 0 ? (
                                    <div className="text-label text-muted-foreground">No content differences.</div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {changed.map((r) => (
                                        <div key={r.label} className="grid grid-cols-[64px_1fr] gap-2">
                                          <div className="pt-0.5 text-micro font-medium text-muted-foreground">{r.label}</div>
                                          <div className="space-y-0.5">
                                            <div className="rounded bg-negative/10 px-1.5 py-0.5 text-micro text-negative line-through decoration-negative/40">
                                              {r.before || "—"}
                                            </div>
                                            <div className="rounded bg-positive/10 px-1.5 py-0.5 text-micro text-positive">
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
              <div className="sticky bottom-0 mx-auto flex w-full max-w-5xl items-center gap-2 border-t border-border bg-card/95 px-6 py-4 backdrop-blur">
                <span className="mr-auto text-label text-muted-foreground tabular-nums">
                  {current.wordCount.toLocaleString()} words · BM v{current.brandMemoryVersion}
                </span>
                <Button variant="ghost" className="h-9" disabled={busy === current.id} onClick={() => regenerate(current.id)}>
                  {busy === current.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Regenerate
                </Button>
                <Button variant="ghost" className="h-9" disabled={busy === current.id} onClick={() => duplicate(current.id)}>
                  <Copy className="size-4" /> Duplicate
                </Button>
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
                  <>
                    <Button variant="outline" className="h-9" disabled={busy === current.id} onClick={() => unpublish(current.id)}>
                      <X className="size-4" /> Unpublish
                    </Button>
                    {current.publishedUrl && (
                      <a className={cn(buttonVariants({ variant: "outline" }), "h-9")} href={current.publishedUrl} target="_blank" rel="noreferrer">
                        View live <ArrowRight className="size-3.5" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
