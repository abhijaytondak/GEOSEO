"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Loader2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Telescope,
  Link2,
  Gauge,
  RotateCcw,
  PenLine,
} from "lucide-react";
import type { BrandProfile, KeywordOpportunity } from "@geoseo/types";
import { pageEngineApi, type BrandDraft } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";
import { markOnboarded } from "@/components/system/onboarding-gate";

const STEPS = ["Website", "Brand Memory", "Publishing", "Seeds", "Review", "Launch"];
const inputCls =
  "h-11 w-full rounded-xl border border-border bg-card px-3.5 text-[15px] text-foreground outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-brand/15";
const SCAN_STAGES = ["Reading homepage", "Finding metadata", "Extracting topics", "Drafting Brand Memory", "Preparing review"];

type Brand = { company: string; valueProp: string; audience: string; topics: string; industry: string; competitors: string };
type Publishing = { requireApproval: boolean; autoSitemap: boolean; autoLlms: boolean };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-brand" : "bg-muted")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const { notify } = useAppFeedback();

  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BrandDraft | null>(null);

  const [brand, setBrand] = useState<Brand>({ company: "", valueProp: "", audience: "", topics: "", industry: "", competitors: "" });
  const [saving, setSaving] = useState(false);

  const [publishing, setPublishing] = useState<Publishing>({ requireApproval: true, autoSitemap: true, autoLlms: true });
  const [savingPub, setSavingPub] = useState(false);

  const [seeds, setSeeds] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<KeywordOpportunity[]>([]);

  const [theme, setTheme] = useState<{ colors: { primary: string; accent?: string; muted?: string }; confidence: number } | null>(null);
  const [integrations, setIntegrations] = useState<string[]>(["search-console"]);
  const [launching, setLaunching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Drive the scan checklist while a scan is running.
  useEffect(() => {
    if (!scanning) return;
    const t = window.setInterval(() => setScanStage((s) => Math.min(s + 1, SCAN_STAGES.length - 1)), 2600);
    return () => window.clearInterval(t);
  }, [scanning]);

  const domain = url.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "yourcompany.com";

  function applyDraft(d: BrandDraft) {
    setDraft(d);
    setBrand({
      company: d.draft.company ?? "",
      valueProp: d.draft.valueProp ?? "",
      audience: d.draft.audience ?? "",
      topics: (d.draft.topics ?? []).join(", "),
      industry: d.draft.industry ?? "",
      competitors: (d.draft.competitors ?? []).join(", "),
    });
  }

  async function scan() {
    if (!url.trim()) return;
    setScanning(true);
    setScanStage(0);
    setScanError(null);
    try {
      // Async crawl + LLM extract — the LLM reads the page and pulls the main points
      // (value prop, industry, audience, topics). Slow (~30-80s) → poll the job.
      const job = await pageEngineApi.startExtractBrand(url.trim());
      let res = await pageEngineApi.getExtractBrandJob(job.id);
      for (let i = 0; i < 70 && res.job.status === "running"; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        res = await pageEngineApi.getExtractBrandJob(job.id);
      }
      if (res.job.status === "failed" || !res.result) throw new Error(res.job.error ?? "We couldn't reach that site.");
      const d = res.result;
      applyDraft(d);
      api
        .scanSiteTheme(url.trim())
        .then((r) => setTheme({ colors: r.profile.colors, confidence: r.profile.confidence }))
        .catch(() => {});
      setStep(1);
      notify({ kind: "success", title: "Site scanned", message: `Drafted Brand Memory from ${d.source}.` });
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "We couldn't reach that site.");
    } finally {
      setScanning(false);
    }
  }

  function enterManually() {
    const stub: BrandDraft = {
      draft: {
        company: domain.split(".")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        domain,
        url: url.trim() || `https://${domain}`,
        valueProp: "",
        topics: [],
        industry: "",
        tone: "professional",
        contactName: "",
        contactEmail: "",
      } as BrandProfile,
      completeness: 0,
      context: "",
      source: domain,
    };
    applyDraft(stub);
    setScanError(null);
    setStep(1);
  }

  async function saveBrand() {
    if (!draft) return;
    if (!brand.company.trim() || !brand.valueProp.trim()) {
      notify({ kind: "error", title: "Company and value proposition are required" });
      return;
    }
    setSaving(true);
    try {
      const profile: BrandProfile = {
        ...draft.draft,
        company: brand.company,
        valueProp: brand.valueProp,
        audience: brand.audience,
        topics: brand.topics.split(",").map((t) => t.trim()).filter(Boolean),
        industry: brand.industry,
        competitors: brand.competitors.split(",").map((c) => c.trim()).filter(Boolean),
      } as BrandProfile;
      await pageEngineApi.saveBrand(profile);
      setStep(2);
      notify({ kind: "success", title: "Brand Memory saved", message: "Now the source of truth for every generated page." });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function savePublishing() {
    setSavingPub(true);
    try {
      await api.updateSettings({ publishing });
      setStep(3);
      notify({ kind: "success", title: "Publishing configured" });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSavingPub(false);
    }
  }

  async function discover() {
    const list = seeds.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) {
      notify({ kind: "error", title: "Add at least one seed topic" });
      return;
    }
    setDiscovering(true);
    try {
      // Async job + poll — LLM discovery (~20-40s) exceeds hosted backends' sync request
      // budget (Render ~30s). Start a job and poll, then load the created opportunities.
      const job = await pageEngineApi.startDiscover(list);
      let j = job;
      for (let i = 0; i < 40 && j.status === "running"; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        j = await pageEngineApi.getDiscoverJob(job.id);
      }
      if (j.status === "failed") throw new Error(j.error ?? "Discovery failed");
      const all = await pageEngineApi.getOpportunities();
      const ids = new Set(j.opportunityIds);
      const created = all.filter((o) => ids.has(o.id));
      setDiscovered(created.length ? created : all.slice(0, Math.max(j.created, 0)));
      setStep(4);
      notify({ kind: "success", title: "Opportunities discovered", message: `${j.created} ready to review.` });
    } catch (err) {
      notify({ kind: "error", title: "Discovery failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setDiscovering(false);
    }
  }

  async function finishOnboarding() {
    setLaunching(true);
    try {
      await api.completeOnboarding({
        workspaceName: brand.company || domain.split(".")[0],
        domain,
        websiteUrl: url.trim() || `https://${domain}`,
        requestedIntegrations: integrations,
      });
      setAnalyzing(true);
      await api.runBrandAnalysis().catch(() => undefined);
      markOnboarded();
      notify({ kind: "success", title: "Workspace ready", message: `${brand.company || domain} is live on GEOSEO.` });
    } catch (err) {
      notify({ kind: "error", title: "Couldn't finalize setup", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setAnalyzing(false);
      setLaunching(false);
      setStep(5);
    }
  }

  function suggestedSeeds() {
    return brand.topics.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6);
  }

  function startOver() {
    setStep(0);
    setUrl("");
    setDraft(null);
    setBrand({ company: "", valueProp: "", audience: "", topics: "", industry: "", competitors: "" });
    setSeeds("");
    setDiscovered([]);
  }

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-[minmax(300px,360px)_1fr]">
      {/* ---------- LEFT EDITORIAL RAIL (desktop) ---------- */}
      <aside className="relative hidden overflow-hidden bg-foreground p-9 text-background lg:flex lg:flex-col">
        <div className="relative z-10 flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-background">
            <span className="size-3 rounded-full ring-2 ring-foreground" style={{ background: "var(--foreground)" }} />
          </span>
          GEOSEO
        </div>
        <div className="relative z-10 my-auto py-8">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">Visibility audit</div>
          <ol className="space-y-0.5">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3 py-[7px] text-[14px]",
                  i < step ? "text-white/85" : i === step ? "text-white" : "text-white/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-[22px] shrink-0 place-items-center rounded-full font-mono text-[10.5px]",
                    i < step
                      ? "bg-brand text-white"
                      : i === step
                        ? "border-[1.5px] border-white text-white ring-4 ring-brand/30"
                        : "border-[1.5px] border-white/20 text-white/40",
                  )}
                >
                  {i < step ? <Check className="size-3" /> : String(i + 1).padStart(2, "0")}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>
        <blockquote className="relative z-10 border-t border-white/10 pt-5 text-[13.5px] leading-relaxed text-white/70">
          “We went from invisible to cited in ChatGPT for our core category in six weeks.”
          <div className="mt-2.5 font-mono text-[12px] text-white/40">— Head of Growth, B2B SaaS</div>
        </blockquote>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <div className="flex items-center gap-3 bg-foreground px-5 py-4 text-background lg:hidden">
        <span className="grid size-6 place-items-center rounded-md bg-background">
          <span className="size-2.5 rounded-full" style={{ background: "var(--foreground)" }} />
        </span>
        <span className="text-[14px] font-semibold tracking-tight">GEOSEO</span>
        <span className="ml-auto h-1 w-28 overflow-hidden rounded-full bg-white/15">
          <span className="block h-full rounded-full bg-brand transition-all" style={{ width: pct + "%" }} />
        </span>
      </div>

      {/* ---------- RIGHT CONTENT PANEL ---------- */}
      <div className="flex min-w-0 flex-col overflow-y-auto bg-card px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-xl">
        {/* subtle step indicator */}
        {step < 5 && (
          <div className="mb-7 flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-brand">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="h-[3px] max-w-[230px] flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-brand transition-all duration-500" style={{ width: pct + "%" }} />
            </span>
          </div>
        )}

        {/* step 0 — website scan */}
        {step === 0 && (
          <div>
            <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">Connect your website</h2>
            <p className="mt-2.5 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
              We&apos;ll scan your site to draft Brand Memory — the source of truth for every generated page. Only public
              pages are read; nothing is published without your approval.
            </p>
            <label className="mt-7 block text-[12.5px] font-medium text-foreground">Website URL</label>
            <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
              <Globe className="size-[17px] shrink-0 text-muted-foreground" />
              <span className="text-[15px] text-muted-foreground">https://</span>
              <input
                className="h-11 w-full border-0 bg-transparent text-[15px] text-foreground outline-none"
                placeholder="yourcompany.com"
                value={url.replace(/^https?:\/\//, "")}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
              />
            </div>

            {scanning && (
              <ul className="mt-5 space-y-1">
                {SCAN_STAGES.map((s, i) => (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[14.5px] transition-colors",
                      i === scanStage ? "bg-surface-sunken text-foreground shadow-card" : i < scanStage ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {i < scanStage ? (
                      <span className="grid size-6 place-items-center rounded-full bg-positive text-white"><Check className="size-3.5" /></span>
                    ) : i === scanStage ? (
                      <Loader2 className="size-[18px] animate-spin text-brand" />
                    ) : (
                      <span className="size-6 rounded-full border-2 border-border" />
                    )}
                    {s}
                  </li>
                ))}
              </ul>
            )}

            {scanError && !scanning && (
              <div className="mt-5 rounded-xl border border-negative/30 bg-negative/5 p-3.5 text-[13px]">
                <div className="font-medium text-negative">{scanError}</div>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={scan}>
                    <RotateCcw className="size-3.5" /> Retry
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={enterManually}>
                    <PenLine className="size-3.5" /> Enter manually
                  </Button>
                </div>
              </div>
            )}

            <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-faint">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>We only read public pages to map your brand&apos;s topics and entities — nothing is changed.</span>
            </p>

            <div className="mt-7">
              <Button className="h-12 rounded-full px-6 text-[15px]" disabled={scanning || !url.trim()} onClick={scan}>
                {scanning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Analyse my brand
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* step 1 — brand review */}
        {step === 1 && draft && (
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">Review your Brand Memory</h2>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Completeness</div>
                <div className="tnum text-[22px] font-bold text-foreground">{draft.completeness}%</div>
              </div>
            </div>
            <p className="mt-2 text-[15px] text-muted-foreground">Refine the AI-extracted draft before we generate anything.</p>
            {theme && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-sunken p-2.5">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Detected theme</span>
                <div className="flex items-center gap-1.5">
                  {[theme.colors.primary, theme.colors.accent, theme.colors.muted].filter(Boolean).map((c, i) => (
                    <span key={i} className="size-5 rounded-md border border-border" style={{ backgroundColor: c as string }} title={c as string} />
                  ))}
                </div>
                <span className="ml-auto text-[11.5px] text-muted-foreground">{theme.confidence}% confident</span>
              </div>
            )}
            <div className="mt-5 space-y-3.5">
              <div>
                <label className="text-[12.5px] font-medium text-foreground">Company</label>
                <input className={cn(inputCls, "mt-1.5")} value={brand.company} onChange={(e) => setBrand((b) => ({ ...b, company: e.target.value }))} />
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-foreground">Value proposition</label>
                <textarea className={cn(inputCls, "mt-1.5 h-auto py-2.5 leading-relaxed")} rows={2} value={brand.valueProp} onChange={(e) => setBrand((b) => ({ ...b, valueProp: e.target.value }))} />
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="text-[12.5px] font-medium text-foreground">Target audience</label>
                  <input className={cn(inputCls, "mt-1.5")} value={brand.audience} onChange={(e) => setBrand((b) => ({ ...b, audience: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12.5px] font-medium text-foreground">Core topics <span className="text-faint">· comma-separated</span></label>
                  <input className={cn(inputCls, "mt-1.5")} value={brand.topics} onChange={(e) => setBrand((b) => ({ ...b, topics: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12.5px] font-medium text-foreground">Industry</label>
                  <input className={cn(inputCls, "mt-1.5")} placeholder="e.g. SaaS, Fintech, Healthcare" value={brand.industry} onChange={(e) => setBrand((b) => ({ ...b, industry: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-foreground">Competitors <span className="text-faint">· optional, comma-separated</span></label>
                <input className={cn(inputCls, "mt-1.5")} placeholder="rival.com, competitor.com" value={brand.competitors} onChange={(e) => setBrand((b) => ({ ...b, competitors: e.target.value }))} />
                <p className="mt-1.5 text-[12px] text-faint">We&apos;ll benchmark your AI visibility against these — see where you&apos;re winning, missing, or invisible.</p>
              </div>
            </div>
            {(!brand.company.trim() || !brand.valueProp.trim() || !brand.topics.trim()) && (
              <p className="mt-3 text-[12.5px] text-warning">Add a company, value proposition, and at least one topic for the best generation quality.</p>
            )}
            <div className="mt-7 flex items-center gap-3">
              <Button variant="ghost" className="h-12" onClick={() => setStep(0)}><ArrowLeft className="size-4" /> Back</Button>
              <Button className="h-12 rounded-full px-6 text-[15px]" disabled={saving} onClick={saveBrand}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Save &amp; continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* step 2 — publishing */}
        {step === 2 && (
          <div>
            <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">Configure publishing</h2>
            <p className="mt-2 max-w-[48ch] text-[15px] text-muted-foreground">
              Pages publish to a managed subdirectory on your domain — no developer or CMS access needed.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-surface-sunken p-3.5">
              <span className="grid size-9 place-items-center rounded-lg bg-positive/12 text-positive"><Check className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-foreground">Managed subdirectory</div>
                <div className="font-mono text-[12.5px] text-muted-foreground">{domain}/feeds/…</div>
              </div>
              <span className="rounded-full bg-positive/12 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-positive">CONNECTED</span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {([
                { key: "requireApproval" as const, label: "Require approval before publish", hint: "Recommended — review pages before they go live." },
                { key: "autoSitemap" as const, label: "Auto-update sitemap.xml", hint: "Keeps search engines aware of new pages." },
                { key: "autoLlms" as const, label: "Auto-update llms.txt", hint: "Lets AI answer engines discover your content." },
              ]).map((row) => (
                <div key={row.key} className="flex items-center gap-3 rounded-xl border border-border p-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-foreground">{row.label}</div>
                    <div className="text-[12px] text-muted-foreground">{row.hint}</div>
                  </div>
                  <Toggle on={publishing[row.key]} onChange={(v) => setPublishing((p) => ({ ...p, [row.key]: v }))} />
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Connect access — unlocks live data</div>
              <p className="mt-1 text-[12px] text-muted-foreground">Pick what to connect so GEOSEO can analyse your real search, traffic, and pipeline. You&apos;ll authorize each after setup.</p>
              <div className="mt-2.5 space-y-2.5">
                {([
                  { id: "search-console", label: "Google Search Console", hint: "Real rankings, impressions & clicks" },
                  { id: "webflow", label: "CMS / Website (Webflow, WordPress…)", hint: "Publish pages into your site" },
                  { id: "hubspot", label: "CRM (HubSpot, Salesforce…)", hint: "Sync captured leads to your pipeline" },
                ]).map((row) => {
                  const on = integrations.includes(row.id);
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setIntegrations((cur) => (on ? cur.filter((x) => x !== row.id) : [...cur, row.id]))}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                        on ? "border-brand bg-brand/5" : "border-border hover:bg-muted",
                      )}
                    >
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", on ? "border-brand bg-brand text-white" : "border-border")}>
                        {on && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium text-foreground">{row.label}</span>
                        <span className="block text-[12px] text-muted-foreground">{row.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <Button variant="ghost" className="h-12" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> Back</Button>
              <Button className="h-12 rounded-full px-6 text-[15px]" disabled={savingPub} onClick={savePublishing}>
                {savingPub ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Save &amp; continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* step 3 — seeds */}
        {step === 3 && (
          <div>
            <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">Seed your first opportunities</h2>
            <p className="mt-2 max-w-[48ch] text-[15px] text-muted-foreground">
              Enter target topics or services — we&apos;ll discover buyer-intent keyword opportunities across AI search.
            </p>
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
              <Sparkles className="size-[17px] shrink-0 text-muted-foreground" />
              <input
                className="h-11 w-full border-0 bg-transparent text-[15px] text-foreground outline-none"
                placeholder="product analytics, cohort retention, onboarding"
                value={seeds}
                onChange={(e) => setSeeds(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && discover()}
              />
            </div>
            {suggestedSeeds().length > 0 && (
              <div className="mt-4">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">From your Brand Memory</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedSeeds().map((t) => (
                    <button
                      key={t}
                      onClick={() => setSeeds((s) => (s.trim() ? `${s.trim()}, ${t}` : t))}
                      className="rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-7 flex items-center gap-3">
              <Button variant="ghost" className="h-12" onClick={() => setStep(2)}><ArrowLeft className="size-4" /> Back</Button>
              <Button className="h-12 rounded-full px-6 text-[15px]" disabled={discovering || !seeds.trim()} onClick={discover}>
                {discovering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Discover opportunities
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* step 4 — review first results */}
        {step === 4 && (
          <div>
            <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">Your first opportunities</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              GEOSEO found <span className="font-semibold text-foreground">{discovered.length}</span> buyer-intent opportunities. Finish setup to open your dashboard.
            </p>
            <ul className="mt-5 space-y-2.5">
              {discovered.slice(0, 4).map((o) => (
                <li key={o.id} className="rounded-xl border border-border bg-card p-3.5 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold text-foreground">{o.query}</span>
                    <span className="shrink-0 rounded-full bg-brand/12 px-2 py-0.5 font-mono text-[10px] font-semibold capitalize text-brand">{o.intent}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12.5px] text-muted-foreground">{o.evidence}</p>
                  <div className="mt-2 flex items-center gap-3 font-mono text-[11.5px] text-muted-foreground">
                    <span className="tnum">Vol {o.volume}</span>
                    <span className="tnum">Difficulty {o.difficulty}</span>
                  </div>
                </li>
              ))}
            </ul>
            {discovered.length === 0 && (
              <p className="mt-4 text-[14px] text-muted-foreground">No opportunities yet — go back and add a few more seed topics.</p>
            )}
            <div className="mt-7 flex items-center gap-3">
              <Button variant="ghost" className="h-12" onClick={() => setStep(3)}><ArrowLeft className="size-4" /> Add seeds</Button>
              <Button className="h-12 rounded-full px-6 text-[15px]" disabled={launching} onClick={finishOnboarding}>
                {launching ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                {analyzing ? "Analysing your brand…" : launching ? "Finishing…" : "Finish setup"}
              </Button>
            </div>
          </div>
        )}

        {/* step 5 — launch (snapshot-style) */}
        {step === 5 && (
          <div>
            <div className="flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.04em] text-positive">
              <Check className="size-4" /> Workspace ready
            </div>
            <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
              {brand.company || domain} is live on GEOSEO
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">Here&apos;s what we set up — pick where to go next.</p>

            <ul className="mt-5 space-y-2.5">
              {[
                `Brand Memory saved for ${brand.company || domain}`,
                `Publishing configured · approval ${publishing.requireApproval ? "on" : "off"}`,
                `${discovered.length} buyer-intent ${discovered.length === 1 ? "opportunity" : "opportunities"} discovered`,
                `Brand analysis running — your dashboard will be warm on arrival`,
              ].map((line) => (
                <li key={line} className="flex items-center gap-2.5 text-[14px] text-foreground">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-positive/12 text-positive"><Check className="size-3.5" /></span>
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button className="h-12 rounded-full" onClick={() => router.push("/")}>
                <Gauge className="size-4" /> Open dashboard <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" className="h-12 rounded-full" onClick={() => router.push("/pages")}>
                <Sparkles className="size-4" /> Generate first page
              </Button>
              <Button variant="outline" className="h-12 rounded-full" onClick={() => router.push("/research")}>
                <Telescope className="size-4" /> Review opportunities
              </Button>
              <Button variant="outline" className="h-12 rounded-full" onClick={() => router.push("/authority")}>
                <Link2 className="size-4" /> Authority & competitors
              </Button>
            </div>

            <button onClick={startOver} className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground">
              <RotateCcw className="size-3.5" /> Start over
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
