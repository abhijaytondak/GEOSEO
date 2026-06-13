"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { BrandProfile } from "@geoseo/types";
import { pageEngineApi, type BrandDraft } from "@/lib/page-engine-client";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

const STEPS = ["Website", "Brand Memory", "Publishing", "Seeds", "Done"];
const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-sm outline-none focus:border-ring focus:bg-card";

export function OnboardingWizard() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [step, setStep] = useState(0);

  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [draft, setDraft] = useState<BrandDraft | null>(null);

  const [brand, setBrand] = useState<{ company: string; valueProp: string; audience: string; topics: string }>({
    company: "",
    valueProp: "",
    audience: "",
    topics: "",
  });
  const [saving, setSaving] = useState(false);

  const [seeds, setSeeds] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState(0);

  async function scan() {
    if (!url.trim()) return;
    setScanning(true);
    try {
      const d = await pageEngineApi.extractBrand(url.trim());
      setDraft(d);
      setBrand({
        company: d.draft.company,
        valueProp: d.draft.valueProp,
        audience: d.draft.audience ?? "",
        topics: (d.draft.topics ?? []).join(", "),
      });
      setStep(1);
      notify({ kind: "success", title: "Site scanned", message: `Drafted Brand Memory from ${d.source}.` });
    } catch (err) {
      notify({ kind: "error", title: "Scan failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setScanning(false);
    }
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
      };
      await pageEngineApi.saveBrand(profile);
      setStep(2);
      notify({ kind: "success", title: "Brand Memory saved" });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
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
      setDiscovered(created.length);
      setStep(4);
      notify({ kind: "success", title: "Opportunities discovered", message: `${created.length} ready to review.` });
    } catch (err) {
      notify({ kind: "error", title: "Discovery failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setDiscovering(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                i < step ? "bg-positive text-white" : i === step ? "bg-brand text-white" : "bg-muted text-muted-foreground",
              )}
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
        {/* step 0 — website */}
        {step === 0 && (
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Globe className="size-5" />
            </div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Connect your website</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              We&apos;ll scan your site to draft Brand Memory — the source of truth for every generated page.
            </p>
            <input
              className={cn(inputCls, "mt-4")}
              placeholder="https://yourcompany.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scan()}
            />
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
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">Connect publishing</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Pages publish to a managed subdirectory on your domain — no developer or CMS access needed.
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-sunken p-3.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-positive/12 text-positive"><Check className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-foreground">Managed subdirectory</div>
                <div className="font-mono text-[12px] text-muted-foreground">{draft?.source ?? "yourcompany.com"}/feeds/…</div>
              </div>
              <span className="rounded-full bg-positive/12 px-2 py-0.5 text-[11px] font-semibold text-positive">Verified</span>
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" className="h-10" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> Back</Button>
              <Button className="h-10 rounded-full px-5" onClick={() => setStep(3)}>Continue <ArrowRight className="size-4" /></Button>
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
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" className="h-10" onClick={() => setStep(2)}><ArrowLeft className="size-4" /> Back</Button>
              <Button className="h-10 rounded-full px-5" disabled={discovering || !seeds.trim()} onClick={discover}>
                {discovering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Discover opportunities
              </Button>
            </div>
          </div>
        )}

        {/* step 4 — done */}
        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-positive/12 text-positive"><Rocket className="size-6" /></div>
            <h2 className="mt-3 text-[18px] font-semibold text-foreground">You&apos;re set up</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Brand Memory saved and <span className="font-semibold text-foreground">{discovered}</span> opportunities discovered. Review them and generate your first pages.
            </p>
            <div className="mt-3">
              <ProgressBar value={100} from="#6C4CF1" to="#2D6BFF" height={8} />
            </div>
            <Button className="mt-5 h-10 rounded-full px-5" onClick={() => router.push("/pages")}>
              Go to Pages <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
