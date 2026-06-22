"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, RotateCcw, Braces, Copy } from "lucide-react";
import type { BrandProfile, BrandTone } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { brandCompleteness } from "@/lib/brand-completeness";
import { Panel } from "@/components/dashboard/panel";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChipInput } from "./chip-input";
import { useAppFeedback } from "@/components/system/app-feedback";

const TONES: BrandTone[] = ["friendly", "professional", "concise"];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-micro font-semibold uppercase text-muted-foreground">
        {label}
      </label>
      {hint && <p className="mt-0.5 mb-1.5 text-micro text-muted-foreground/80">{hint}</p>}
      <div className={hint ? "" : "mt-1.5"}>{children}</div>
    </div>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-sunken px-3 text-body outline-none transition-colors focus:border-ring focus:bg-card focus-visible:ring-3 focus-visible:ring-ring/50";
const areaCls =
  "w-full resize-none rounded-lg border border-border bg-surface-sunken p-3 text-body leading-relaxed outline-none transition-colors focus:border-ring focus:bg-card focus-visible:ring-3 focus-visible:ring-ring/50";

function compile(p: BrandProfile): string {
  return [
    `Company: ${p.company} (${p.url})`,
    `Industry: ${p.industry}`,
    `Value proposition: ${p.valueProp}`,
    p.audience ? `Target audience: ${p.audience}` : null,
    p.differentiators?.length ? `Differentiators: ${p.differentiators.join("; ")}` : null,
    p.competitors?.length ? `Competitors: ${p.competitors.join(", ")}` : null,
    `Core topics: ${p.topics.join(", ")}`,
    p.keywords?.length ? `Target keywords: ${p.keywords.join(", ")}` : null,
    `Tone of voice: ${p.tone}`,
    `Primary contact: ${p.contactName} <${p.contactEmail}>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function BrandMemoryEditor({ initial }: { initial: BrandProfile }) {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [form, setForm] = useState<BrandProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeness = useMemo(() => brandCompleteness(form), [form]);
  const context = useMemo(() => compile(form), [form]);
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );
  const valid = form.company.trim() !== "" && form.url.trim() !== "";

  function copyContext() {
    navigator.clipboard?.writeText(context);
    setCopied(true);
    notify({ kind: "success", title: "Compiled context copied" });
    setTimeout(() => setCopied(false), 1600);
  }

  function set<K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.updateBrandMemory(form, "Manual edit");
      setSaved(true);
      notify({ kind: "success", title: "Brand Memory saved", message: "Future agent output will use the updated context." });
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save Brand Memory.";
      setError(message);
      notify({ kind: "error", title: "Save failed", message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
      {/* form */}
      <div className="space-y-5 lg:col-span-2">
        <Panel
          title="Brand Identity"
          hint="The single source of truth injected into every outreach + content agent."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company">
                <input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} />
              </Field>
              <Field label="Website URL">
                <input className={inputCls} value={form.url} onChange={(e) => set("url", e.target.value)} />
              </Field>
            </div>
            <Field label="Industry">
              <input className={inputCls} value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            </Field>
            <Field label="Value Proposition" hint="One sentence on the core value you deliver.">
              <textarea className={areaCls} rows={2} value={form.valueProp} onChange={(e) => set("valueProp", e.target.value)} />
            </Field>
            <Field label="Target Audience" hint="Who you sell to — roles, company stage, segment.">
              <textarea className={areaCls} rows={2} value={form.audience ?? ""} onChange={(e) => set("audience", e.target.value)} />
            </Field>
            <Field label="Tone of Voice">
              <div className="flex gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("tone", t)}
                    className={`rounded-lg px-3 py-1.5 text-label font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      form.tone === t
                        ? "bg-brand/12 text-brand ring-1 ring-brand/30"
                        : "bg-surface-sunken text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Panel>

        <Panel title="Positioning" hint="Powers content angles, outreach hooks, and competitor gap analysis.">
          <div className="space-y-4">
            <Field label="Core Topics">
              <ChipInput values={form.topics} onChange={(v) => set("topics", v)} placeholder="e.g. product analytics" />
            </Field>
            <Field label="Differentiators">
              <ChipInput
                values={form.differentiators ?? []}
                onChange={(v) => set("differentiators", v)}
                placeholder="What sets you apart"
              />
            </Field>
            <Field label="Competitors">
              <ChipInput
                values={form.competitors ?? []}
                onChange={(v) => set("competitors", v)}
                placeholder="competitor.com"
              />
            </Field>
            <Field label="Target Keywords">
              <ChipInput values={form.keywords ?? []} onChange={(v) => set("keywords", v)} placeholder="Add a keyword" />
            </Field>
          </div>
        </Panel>

        <Panel title="Outreach Contact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Name">
              <input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label="Contact Email">
              <input className={inputCls} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
          </div>
        </Panel>
      </div>

      {/* sidebar: completeness + compiled context */}
      <div className="space-y-5">
        <Panel title="Memory Strength" hint="A richer profile produces sharper, more personalized agent output.">
          <div className="flex items-end justify-between">
            <span className="tnum text-display font-bold leading-none text-foreground">
              {completeness}
              <span className="text-title text-muted-foreground">%</span>
            </span>
            {completeness >= 90 ? (
              <Badge variant="positive" className="mb-1">
                <Sparkles className="size-3" /> Excellent
              </Badge>
            ) : (
              <Badge variant="warning" className="mb-1">
                Add more detail
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <ProgressBar value={completeness} height={10} />
          </div>
        </Panel>

        <Panel
          title="Compiled Context"
          hint="Exactly what gets injected into agent prompts."
          action={
            <Button variant="ghost" size="sm" onClick={copyContext} aria-label="Copy compiled context">
              {copied ? (
                <Check className="size-3.5 text-positive" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          }
        >
          <pre className="tnum max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-sunken p-3 font-mono text-micro leading-relaxed text-foreground">
            {context}
          </pre>
        </Panel>
      </div>
    </div>

      {/* full-width sticky action footer — never overlaps the rail content */}
      <div className="sticky bottom-4 z-20 flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-float backdrop-blur">
        <Braces className="ml-1 size-4 shrink-0 text-brand" />
        <span className="flex-1 text-label text-muted-foreground">
          {error
            ? error
            : !valid
            ? "Company and website are required"
            : dirty
              ? "Unsaved changes — your edits update every agent on save"
              : "All changes saved"}
        </span>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={() => setForm(initial)}>
            <RotateCcw className="size-3.5" />
            Discard
          </Button>
        )}
        <Button
          className="h-9 rounded-full px-4"
          disabled={!dirty || saving || !valid}
          onClick={save}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {saved ? "Saved" : "Save Brand Memory"}
        </Button>
      </div>
    </div>
  );
}
