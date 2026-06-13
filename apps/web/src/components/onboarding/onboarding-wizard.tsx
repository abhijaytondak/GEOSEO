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
  BrainCircuit,
  Rocket,
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
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

const STEPS = ["Website", "Brand Memory", "Publishing", "Seeds", "Review", "Launch"];
const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-sm outline-none focus:border-ring focus:bg-card";
const SCAN_STAGES = ["Reading homepage", "Finding metadata", "Extracting topics", "Drafting Brand Memory", "Preparing review"];

type Brand = { company: string; valueProp: string; audience: string; topics: string };
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

  const [brand, setBrand] = useState<Brand>({ company: "", valueProp: "", audience: "", topics: "" });
  const [saving, setSaving] = useState(false);

  const [publishing, setPublishing] = useState<Publishing>({ requireApproval: true, autoSitemap: true, autoLlms: true });
  const [savingPub, setSavingPub] = useState(false);

  const [seeds, setSeeds] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<KeywordOpportunity[]>([]);

  // Drive the scan checklist while a scan is running.
  useEffect(() => {
    if (!scanning) return;
    const t = window.setInterval(() => setScanStage((s) => Math.min(s + 1, SCAN_STAGES.length - 1)), 600);
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
    });
  }

  async function scan() {
    if (!url.trim()) return;
    setScanning(true);
    setScanStage(0);
    setScanError(null);
    try {
      const d = await pageEngineApi.extractBrand(url.trim());
      applyDraft(d);
      setStep(1);
      notify({ kind: "success", title: "Site scanned", message: `Drafted Brand Memory from ${d.source}.` });
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "We couldn't reach that site.");
    } finally {
      setScanning(false);
    }
  }

  // Manual fallback (§6.4) — proceed without a successful scan.
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
      const { created } = await pageEngineApi.discoverOpportunities(list);
      setDiscovered(created);
      setStep(4);
      notify({ kind: "success", title: "Opportunities discovered", message: `${created.length} ready to review.` });
    } catch (err) {
      notify({ kind: "error", title: "Discovery failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setDiscovering(false);
    }
  }

  function suggestedSeeds() {
    return brand.topics.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6);
  }

  function startOver() {
    setStep(0);
    setUrl("");
    setDraft(null);
    setBrand({ company: "", valueProp: "", audience: "", topics: "" });
    setSeeds("");
    setDiscovered([]);
  }

  return (
    <div className="mx-auto max-w-2xl lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
      <div className="min-w-0">
      {/* stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                i < step ? "bg-positive text-white" : i === step ? "bg-brand text-white" : "bg-muted text-muted-foreground",
              )}
              aria-current={i === step ? "step" : undefined}
              title={label}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 rounded-full", i < step ? "bg-positive" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        {/* step 0 — website scan */}
        {step === 0 && (
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Globe className="size-5" />
            </div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Connect your website</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              We&apos;ll scan your site to draft Brand Memory — the source of truth for every generated page. Only your
              public pages are read; nothing is published without your approval.
            </p>
            <input
              className={cn(inputCls, "mt-4")}
              placeholder="https://yourcompany.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scan()}
            />

            {scanning && (
              <ul className="mt-4 space-y-1.5">
                {SCAN_STAGES.map((s, i) => (
                  <li key={s} className="flex items-center gap-2 text-[12.5px]">
                    {i < scanStage ? (
                      <Check className="size-3.5 text-positive" />
                    ) : i === scanStage ? (
                      <Loader2 className="size-3.5 animate-spin text-brand" />
                    ) : (
                      <span className="size-3.5 rounded-full border border-border" />
                    )}
                    <span className={i <= scanStage ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                  </li>
                ))}
              </ul>
            )}

            {scanError && !scanning && (
              <div className="mt-4 rounded-xl border border-negative/30 bg-negative/5 p-3 text-[12.5px]">
                <div className="font-medium text-negative">{scanError}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={scan}>
                    <RotateCcw className="size-3.5" /> Retry
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={enterManually}>
                    <PenLine className="size-3.5" /> Enter manually
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button className="h-10 rounded-full px-5" disabled={scanning || !url.trim()} onClick={scan}>
                {scanning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Scan website
              </Button>
            </div>
          </div>
        )}

        {/* step 1 — brand review */}
        {step === 1 && draft && (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <BrainCircuit className="size-5" />
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Completeness</div>
                <div className="tnum text-[20px] font-bold text-foreground">{draft.completeness}%</div>
              </div>
            </div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Review your Brand Memory</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">Refine the AI-extracted draft before generation.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Company</label>
                <input className={cn(inputCls, "mt-1")} value={brand.company} onChange={(e) => setBrand((b) => ({ ...b, company: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Value proposition</label>
                <textarea className={cn(inputCls, "mt-1 h-auto py-2")} rows={2} value={brand.valueProp} onChange={(e) => setBrand((b) => ({ ...b, valueProp: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Target audience</label>
                <textarea className={cn(inputCls, "mt-1 h-auto py-2")} rows={2} value={brand.audience} onChange={(e) => setBrand((b) => ({ ...b, audience: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Core topics (comma-separated)</label>
                <input className={cn(inputCls, "mt-1")} value={brand.topics} onChange={(e) => setBrand((b) => ({ ...b, topics: e.target.value }))} />
              </div>
            </div>
            {(!brand.company.trim() || !brand.valueProp.trim() || !brand.topics.trim()) && (
              <p className="mt-3 text-[12px] text-warning">
                Add a company, value proposition, and at least one topic for the best generation quality.
              </p>
            )}
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" className="h-10" onClick={() => setStep(0)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button className="h-10 rounded-full px-5" disabled={saving} onClick={saveBrand}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Save &amp; continue
              </Button>
            </div>
          </div>
        )}

        {/* step 2 — publishing */}
        {step === 2 && (
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-positive/12 text-positive">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Configure publishing</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Pages publish to a managed subdirectory on your domain — no developer or CMS access needed.
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-sunken p-3.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-positive/12 text-positive"><Check className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-foreground">Managed subdirectory</div>
                <div className="font-mono text-[12px] text-muted-foreground">{domain}/feeds/…</div>
              </div>
              <span className="rounded-full bg-positive/12 px-2 py-0.5 text-[11px] font-semibold text-positive">Demo connected</span>
            </div>

            <div className="mt-3 space-y-2">
              {([
                { key: "requireApproval" as const, label: "Require approval before publish", hint: "Recommended — review pages before they go live." },
                { key: "autoSitemap" as const, label: "Auto-update sitemap.xml", hint: "Keeps search engines aware of new pages." },
                { key: "autoLlms" as const, label: "Auto-update llms.txt", hint: "Lets AI answer engines discover your content." },
              ]).map((row) => (
                <div key={row.key} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-foreground">{row.label}</div>
                    <div className="text-[11.5px] text-muted-foreground">{row.hint}</div>
                  </div>
                  <Toggle on={publishing[row.key]} onChange={(v) => setPublishing((p) => ({ ...p, [row.key]: v }))} />
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between">
              <Button variant="ghost" className="h-10" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> Back</Button>
              <Button className="h-10 rounded-full px-5" disabled={savingPub} onClick={savePublishing}>
                {savingPub ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Save &amp; continue
              </Button>
            </div>
          </div>
        )}

        {/* step 3 — seeds */}
        {step === 3 && (
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Sparkles className="size-5" /></div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Seed your first opportunities</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">Enter target topics or services — we&apos;ll discover buyer-intent keyword opportunities.</p>
            <input
              className={cn(inputCls, "mt-4")}
              placeholder="e.g. product analytics, cohort retention, onboarding"
              value={seeds}
              onChange={(e) => setSeeds(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && discover()}
            />
            {suggestedSeeds().length > 0 && (
              <div className="mt-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">From your Brand Memory</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {suggestedSeeds().map((t) => (
                    <button
                      key={t}
                      onClick={() => setSeeds((s) => (s.trim() ? `${s.trim()}, ${t}` : t))}
                      className="rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" className="h-10" onClick={() => setStep(2)}><ArrowLeft className="size-4" /> Back</Button>
              <Button className="h-10 rounded-full px-5" disabled={discovering || !seeds.trim()} onClick={discover}>
                {discovering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Discover opportunities
              </Button>
            </div>
          </div>
        )}

        {/* step 4 — review first results */}
        {step === 4 && (
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Telescope className="size-5" /></div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Your first opportunities</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              GEOSEO found <span className="font-semibold text-foreground">{discovered.length}</span> buyer-intent
              opportunities. Approve and generate pages, or refine seeds.
            </p>
            <ul className="mt-4 space-y-2">
              {discovered.slice(0, 5).map((o) => (
                <li key={o.id} className="rounded-xl border border-border bg-surface-sunken p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-foreground">{o.query}</span>
                    <span className="shrink-0 rounded-full bg-brand/12 px-2 py-0.5 text-[10.5px] font-semibold capitalize text-brand">{o.intent}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{o.evidence}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                    <span className="tnum">Vol {o.volume}</span>
                    <span className="tnum">Difficulty {o.difficulty}</span>
                  </div>
                </li>
              ))}
            </ul>
            {discovered.length === 0 && (
              <p className="mt-4 text-[13px] text-muted-foreground">No opportunities yet — go back and add a few more seed topics.</p>
            )}
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" className="h-10" onClick={() => setStep(3)}><ArrowLeft className="size-4" /> Add more seeds</Button>
              <Button className="h-10 rounded-full px-5" onClick={() => setStep(5)}>Continue <ArrowRight className="size-4" /></Button>
            </div>
          </div>
        )}

        {/* step 5 — launch */}
        {step === 5 && (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-positive/12 text-positive"><Rocket className="size-6" /></div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Your workspace is ready</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">Here&apos;s what GEOSEO set up — pick where to go next.</p>
            <div className="mt-3">
              <ProgressBar value={100} from="#6C4CF1" to="#2D6BFF" height={8} />
            </div>

            <ul className="mt-4 space-y-1.5 text-left">
              {[
                `Brand Memory saved for ${brand.company || domain}`,
                `Publishing configured · approval ${publishing.requireApproval ? "on" : "off"}`,
                `${discovered.length} buyer-intent ${discovered.length === 1 ? "opportunity" : "opportunities"} discovered`,
              ].map((line) => (
                <li key={line} className="flex items-center gap-2 text-[13px] text-foreground">
                  <Check className="size-4 text-positive" />
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button className="h-10 rounded-full" onClick={() => router.push("/")}>
                <Gauge className="size-4" /> Go to Authority HQ
              </Button>
              <Button variant="outline" className="h-10 rounded-full" onClick={() => router.push("/research")}>
                <Telescope className="size-4" /> Review opportunities
              </Button>
              <Button variant="outline" className="h-10 rounded-full" onClick={() => router.push("/pages")}>
                <Sparkles className="size-4" /> Generate first page
              </Button>
              <Button variant="outline" className="h-10 rounded-full" onClick={() => router.push("/opportunities")}>
                <Link2 className="size-4" /> Backlink opportunities
              </Button>
            </div>

            <button onClick={startOver} className="mt-4 inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-3.5" /> Start over
            </button>
          </div>
        )}
      </div>
      </div>

      {/* live preview (§16.2/§16.3) — contextual per step, desktop only */}
      <aside className="hidden lg:sticky lg:top-4 lg:block">
        <div className="rounded-2xl border border-border bg-surface-sunken p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Live preview</div>

          {step === 0 && (
            <div className="mt-3 space-y-2 text-[12.5px]">
              <p className="text-muted-foreground">We&apos;ll draft your Brand Memory from these signals:</p>
              <ul className="space-y-1.5">
                {["Company & value proposition", "Audience & industry", "Core topics & keywords", "Competitors & differentiators", "Contact email"].map((x) => (
                  <li key={x} className="flex items-center gap-2 text-foreground">
                    <span className="size-1.5 rounded-full bg-brand" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className="mt-3 space-y-3 text-[12.5px]">
              <div>
                <div className="font-semibold text-foreground">{brand.company || "Your company"}</div>
                <p className="mt-0.5 line-clamp-3 text-muted-foreground">{brand.valueProp || "Your value proposition will appear here."}</p>
              </div>
              {suggestedSeeds().length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {suggestedSeeds().map((t) => (
                    <span key={t} className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
              <div className="rounded-lg border border-border bg-card p-2.5">
                <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Example outreach line</div>
                <p className="mt-1 text-[12px] text-foreground">
                  “Loved your work — I think {brand.company || "we"} could add real value for your readers on{" "}
                  {suggestedSeeds()[0] ?? "your core topic"}.”
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-3 space-y-2 text-[12.5px]">
              <div className="rounded-lg border border-border bg-card p-2.5 font-mono text-[12px] text-foreground">{domain}/feeds/your-first-page</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>Approval: {publishing.requireApproval ? "required" : "auto-publish"}</li>
                <li>sitemap.xml: {publishing.autoSitemap ? "auto-updated" : "manual"}</li>
                <li>llms.txt: {publishing.autoLlms ? "auto-updated" : "manual"}</li>
              </ul>
            </div>
          )}

          {step === 3 && (
            <div className="mt-3 space-y-2 text-[12.5px] text-muted-foreground">
              <p>We&apos;ll turn seeds into buyer-intent opportunities like:</p>
              <ul className="space-y-1.5">
                {["best [topic] tools", "[topic] vs alternatives", "how to [topic]"].map((x) => (
                  <li key={x} className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-foreground">{x}</li>
                ))}
              </ul>
            </div>
          )}

          {step === 4 && (
            <div className="mt-3">
              <div className="tnum text-[24px] font-bold text-foreground">{discovered.length}</div>
              <p className="text-[12.5px] text-muted-foreground">opportunities ready to review.</p>
            </div>
          )}

          {step === 5 && (
            <div className="mt-3 space-y-1.5 text-[12.5px] text-muted-foreground">
              <p>Setup complete — your workspace is live with Brand Memory, publishing, and first opportunities.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
