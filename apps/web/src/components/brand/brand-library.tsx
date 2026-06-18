"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Package, Users, Award, Check, Type, MessageSquareWarning, Sparkles, Mic2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";
import { apiError, readApiEnvelope } from "@/lib/api-envelope";

type ProofType = "stat" | "testimonial" | "case-study" | "award" | "logo";
interface BrandProduct { id: string; name: string; description: string; category?: string; pricing?: string; url?: string }
interface BuyerPersona { id: string; name: string; role?: string; painPoints: string[]; goals: string[]; buyingTriggers: string[] }
interface ProofPoint { id: string; type: ProofType; label: string; detail?: string; source?: string }
interface Terminology { preferred: string[]; avoid: string[] }
interface Voice { tone: string; traits: string[]; guidance: string }
interface Correction { id: string; instruction: string; createdAt: string }
interface Library {
  products: BrandProduct[];
  personas: BuyerPersona[];
  proofPoints: ProofPoint[];
  terminology: Terminology;
  voice: Voice;
  images: string[];
}

const PROOF_TYPES: ProofType[] = ["stat", "testimonial", "case-study", "award", "logo"];
const TONE_PRESETS = ["professional", "friendly", "concise", "bold", "conversational", "authoritative"];
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);
const fromList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none transition-colors focus:border-brand";

const EMPTY_LIB: Library = {
  products: [],
  personas: [],
  proofPoints: [],
  terminology: { preferred: [], avoid: [] },
  voice: { tone: "", traits: [], guidance: "" },
  images: [],
};

function normalizeLib(l?: Partial<Library>): Library {
  return {
    products: l?.products ?? [],
    personas: (l?.personas ?? []).map((p) => ({ ...p, buyingTriggers: p.buyingTriggers ?? [] })),
    proofPoints: l?.proofPoints ?? [],
    terminology: { preferred: l?.terminology?.preferred ?? [], avoid: l?.terminology?.avoid ?? [] },
    voice: { tone: l?.voice?.tone ?? "", traits: l?.voice?.traits ?? [], guidance: l?.voice?.guidance ?? "" },
    images: l?.images ?? [],
  };
}

export function BrandLibrary() {
  const { notify } = useAppFeedback();
  const [lib, setLib] = useState<Library | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [newCorrection, setNewCorrection] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractUrl, setExtractUrl] = useState("");
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/brand-library", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => readApiEnvelope<{ library: Library & { corrections?: Correction[] } }>(r, "/brand-library"))
      .then((jr) => {
        if (cancelled) return;
        const l = jr?.data?.library;
        setLib(normalizeLib(l));
        setCorrections(l?.corrections ?? []);
      })
      .catch(() => setLib(EMPTY_LIB));
    // Best-effort: prefill the extract URL from the saved brand profile.
    fetch("/api/v1/brand-profile", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => readApiEnvelope<{ profile?: { url?: string; domain?: string } }>(r, "/brand-profile"))
      .then((jr) => {
        if (cancelled) return;
        const p = jr?.data?.profile;
        if (p?.url || p?.domain) setExtractUrl(p.url || p.domain || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function extractFromSite() {
    const url = extractUrl.trim();
    if (!url) return;
    setExtracting(true);
    try {
      const r = await fetch("/api/v1/brand-library/extract-from-site", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const jr = await readApiEnvelope<{ draft: Partial<Library>; crawled: boolean; llm: boolean; source: string }>(
        r,
        "/brand-library/extract-from-site",
      );
      if (!r.ok || !jr.success) throw apiError(jr, r, "/brand-library/extract-from-site");
      const d = jr.data;
      mutate(normalizeLib(d.draft)); // populates the form for review; nothing persists until Save
      notify({
        kind: d.crawled ? "success" : "info",
        title: d.crawled ? `Pulled from ${d.source}` : "Couldn't reach the site",
        message: d.crawled
          ? d.llm
            ? "Review the real facts extracted from your site, then Save."
            : "Pulled your value prop, tone, and images. Fill in the rest (or add an LLM key for deep extraction), then Save."
          : "Add your details manually below.",
      });
    } catch (err) {
      notify({ kind: "error", title: "Extraction failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setExtracting(false);
    }
  }

  function mutate(next: Library) {
    setLib(next);
    setDirty(true);
  }

  async function save() {
    if (!lib) return;
    setSaving(true);
    try {
      // Corrections are managed via their own endpoints; never include them in the
      // full-replace body (the API preserves them when omitted).
      const r = await fetch("/api/v1/brand-library", {
        method: "PUT",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(lib),
      });
      const jr = await readApiEnvelope<{ library: Library }>(r, "/brand-library");
      if (!r.ok || !jr.success) throw apiError(jr, r, "/brand-library");
      setLib(normalizeLib(jr.data.library));
      setDirty(false);
      notify({ kind: "success", title: "Library saved", message: "Generated pages and outreach will use these facts." });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function addCorrection() {
    const instruction = newCorrection.trim();
    if (!instruction) return;
    try {
      const r = await fetch("/api/v1/brand-library/corrections", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const jr = await readApiEnvelope<{ library: { corrections: Correction[] } }>(r, "/brand-library/corrections");
      if (!r.ok || !jr.success) throw apiError(jr, r, "/brand-library/corrections");
      setCorrections(jr.data.library.corrections);
      setNewCorrection("");
      notify({ kind: "success", title: "Saved to memory", message: "The AI will honor this everywhere — permanently." });
    } catch (err) {
      notify({ kind: "error", title: "Couldn't save", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function removeCorrection(id: string) {
    try {
      const r = await fetch(`/api/v1/brand-library/corrections/${id}`, { method: "DELETE", headers: { accept: "application/json" } });
      const jr = await readApiEnvelope<{ library: { corrections: Correction[] } }>(r, "/brand-library/corrections");
      if (!r.ok || !jr.success) throw apiError(jr, r, "/brand-library/corrections");
      setCorrections(jr.data.library.corrections);
    } catch (err) {
      notify({ kind: "error", title: "Couldn't remove", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  if (!lib) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading library…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[12.5px] text-muted-foreground">
          Ground every generated page and outreach draft in real business facts — your products, who you sell to, and the proof
          that backs your claims. Nothing here is invented by the AI.
        </p>
        <Button size="sm" className="h-8 shrink-0" onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          {dirty ? "Save changes" : "Saved"}
        </Button>
      </div>

      {/* Extract from site — replaces sample data with the customer's real brand */}
      <section className="rounded-2xl border border-brand/30 bg-brand/[0.04] p-5 shadow-card">
        <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Sparkles className="size-4 text-brand" /> Extract from your site
        </h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Pull your real products, audience, proof, tone of voice, and images straight from your website — then review and save.
          This replaces the sample data with facts from your own site.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputCls}
            placeholder="yourcompany.com"
            value={extractUrl}
            onChange={(e) => setExtractUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !extracting) extractFromSite();
            }}
          />
          <Button size="sm" className="h-9 shrink-0" onClick={extractFromSite} disabled={!extractUrl.trim() || extracting}>
            {extracting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {extracting ? "Reading your site…" : "Extract"}
          </Button>
        </div>
      </section>

      {/* Brand images — real images scraped from the site (no placeholders) */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <ImageIcon className="size-4 text-brand" /> Brand images
          <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{lib.images.length}</span>
        </h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Real images pulled from your site — used across generated pages instead of placeholders.
        </p>
        {lib.images.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-6 text-center text-[12.5px] text-muted-foreground">
            Run “Extract from your site” to pull your real brand images.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {lib.images.map((src) => (
              <div key={src} className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Brand image from site" className="max-h-full max-w-full object-contain" loading="lazy" />
                <button
                  onClick={() => mutate({ ...lib, images: lib.images.filter((x) => x !== src) })}
                  className="absolute right-1.5 top-1.5 rounded-md bg-background/85 p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Products */}
      <Section
        icon={Package}
        title="Products & services"
        count={lib.products.length}
        onAdd={() => mutate({ ...lib, products: [...lib.products, { id: uid(), name: "", description: "" }] })}
        empty="Add what you sell so pages describe it accurately."
      >
        {lib.products.map((p) => (
          <Row key={p.id} onRemove={() => mutate({ ...lib, products: lib.products.filter((x) => x.id !== p.id) })}>
            <input
              className={inputCls}
              placeholder="Product or service name"
              value={p.name}
              onChange={(e) => mutate({ ...lib, products: lib.products.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) })}
            />
            <textarea
              className={`${inputCls} h-auto min-h-[58px] resize-y py-2`}
              placeholder="What it is and the value it delivers"
              value={p.description}
              onChange={(e) => mutate({ ...lib, products: lib.products.map((x) => (x.id === p.id ? { ...x, description: e.target.value } : x)) })}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputCls}
                placeholder="Category (optional)"
                value={p.category ?? ""}
                onChange={(e) => mutate({ ...lib, products: lib.products.map((x) => (x.id === p.id ? { ...x, category: e.target.value } : x)) })}
              />
              <input
                className={inputCls}
                placeholder="Pricing (e.g. $99/mo)"
                value={p.pricing ?? ""}
                onChange={(e) => mutate({ ...lib, products: lib.products.map((x) => (x.id === p.id ? { ...x, pricing: e.target.value } : x)) })}
              />
              <input
                className={inputCls}
                placeholder="URL (optional)"
                value={p.url ?? ""}
                onChange={(e) => mutate({ ...lib, products: lib.products.map((x) => (x.id === p.id ? { ...x, url: e.target.value } : x)) })}
              />
            </div>
          </Row>
        ))}
      </Section>

      {/* Personas */}
      <Section
        icon={Users}
        title="Buyer personas"
        count={lib.personas.length}
        onAdd={() => mutate({ ...lib, personas: [...lib.personas, { id: uid(), name: "", painPoints: [], goals: [], buyingTriggers: [] }] })}
        empty="Add who you sell to so copy speaks to their pains, goals, and buying triggers."
      >
        {lib.personas.map((p) => (
          <Row key={p.id} onRemove={() => mutate({ ...lib, personas: lib.personas.filter((x) => x.id !== p.id) })}>
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputCls}
                placeholder="Persona name (e.g. Growth PM)"
                value={p.name}
                onChange={(e) => mutate({ ...lib, personas: lib.personas.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) })}
              />
              <input
                className={inputCls}
                placeholder="Role / title (optional)"
                value={p.role ?? ""}
                onChange={(e) => mutate({ ...lib, personas: lib.personas.map((x) => (x.id === p.id ? { ...x, role: e.target.value } : x)) })}
              />
            </div>
            <LabeledList
              label="Pain points"
              value={p.painPoints}
              onChange={(arr) => mutate({ ...lib, personas: lib.personas.map((x) => (x.id === p.id ? { ...x, painPoints: arr } : x)) })}
            />
            <LabeledList
              label="Goals"
              value={p.goals}
              onChange={(arr) => mutate({ ...lib, personas: lib.personas.map((x) => (x.id === p.id ? { ...x, goals: arr } : x)) })}
            />
            <LabeledList
              label="Buying triggers"
              value={p.buyingTriggers}
              onChange={(arr) => mutate({ ...lib, personas: lib.personas.map((x) => (x.id === p.id ? { ...x, buyingTriggers: arr } : x)) })}
            />
          </Row>
        ))}
      </Section>

      {/* Proof */}
      <Section
        icon={Award}
        title="Proof points"
        count={lib.proofPoints.length}
        onAdd={() => mutate({ ...lib, proofPoints: [...lib.proofPoints, { id: uid(), type: "stat", label: "" }] })}
        empty="Add stats, testimonials, and case studies that back your claims."
      >
        {lib.proofPoints.map((p) => (
          <Row key={p.id} onRemove={() => mutate({ ...lib, proofPoints: lib.proofPoints.filter((x) => x.id !== p.id) })}>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <select
                className={`${inputCls} capitalize`}
                value={p.type}
                onChange={(e) => mutate({ ...lib, proofPoints: lib.proofPoints.map((x) => (x.id === p.id ? { ...x, type: e.target.value as ProofType } : x)) })}
              >
                {PROOF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("-", " ")}
                  </option>
                ))}
              </select>
              <input
                className={inputCls}
                placeholder="Headline (e.g. 3x faster insight)"
                value={p.label}
                onChange={(e) => mutate({ ...lib, proofPoints: lib.proofPoints.map((x) => (x.id === p.id ? { ...x, label: e.target.value } : x)) })}
              />
            </div>
            <input
              className={inputCls}
              placeholder="Detail (optional)"
              value={p.detail ?? ""}
              onChange={(e) => mutate({ ...lib, proofPoints: lib.proofPoints.map((x) => (x.id === p.id ? { ...x, detail: e.target.value } : x)) })}
            />
            <input
              className={inputCls}
              placeholder="Source (optional)"
              value={p.source ?? ""}
              onChange={(e) => mutate({ ...lib, proofPoints: lib.proofPoints.map((x) => (x.id === p.id ? { ...x, source: e.target.value } : x)) })}
            />
          </Row>
        ))}
      </Section>

      {/* Terminology — brand voice rules (preferred / avoid) */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Type className="size-4 text-brand" /> Terminology
        </h3>
        <p className="mb-3 text-[12px] text-muted-foreground">Brand-voice rules every draft must follow — terms to prefer, and words to never use.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <LabeledList
            label="Preferred terms"
            value={lib.terminology.preferred}
            onChange={(arr) => mutate({ ...lib, terminology: { ...lib.terminology, preferred: arr } })}
          />
          <LabeledList
            label="Never use"
            value={lib.terminology.avoid}
            onChange={(arr) => mutate({ ...lib, terminology: { ...lib.terminology, avoid: arr } })}
          />
        </div>
      </section>

      {/* Tone of voice — how every generated draft should sound */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Mic2 className="size-4 text-brand" /> Tone of voice
        </h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          How every generated page and outreach draft should sound. Folded into the AI grounding so copy stays on-brand.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONE_PRESETS.map((t) => {
                const active = lib.voice.tone.trim().toLowerCase() === t;
                return (
                  <button
                    key={t}
                    onClick={() => mutate({ ...lib, voice: { ...lib.voice, tone: t } })}
                    className={`rounded-full border px-3 py-1 text-[12px] font-medium capitalize transition-colors ${
                      active ? "border-brand bg-brand/10 text-brand" : "border-border bg-background text-muted-foreground hover:border-brand/50 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <input
              className={`${inputCls} mt-2`}
              placeholder="or describe it in your own words (e.g. confident, witty, no fluff)"
              value={lib.voice.tone}
              onChange={(e) => mutate({ ...lib, voice: { ...lib.voice, tone: e.target.value } })}
            />
          </div>
          <LabeledList
            label="Voice traits"
            value={lib.voice.traits}
            onChange={(arr) => mutate({ ...lib, voice: { ...lib.voice, traits: arr } })}
          />
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Writing guidance</label>
            <textarea
              className={`${inputCls} h-auto min-h-[58px] resize-y py-2`}
              placeholder={`Do/don't rules — e.g. "Lead with outcomes. Keep sentences short. Never use hype words."`}
              value={lib.voice.guidance}
              onChange={(e) => mutate({ ...lib, voice: { ...lib.voice, guidance: e.target.value } })}
            />
          </div>
        </div>
      </section>

      {/* Feedback Memory — corrections that stick everywhere (managed via dedicated endpoints) */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <MessageSquareWarning className="size-4 text-brand" /> Feedback Memory
          <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{corrections.length}</span>
        </h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Fix something once — it stays fixed everywhere. Each correction is injected with top priority into every generated page,
          lead, and outreach draft.
        </p>
        <div className="flex items-start gap-2">
          <textarea
            className={`${inputCls} h-auto min-h-[40px] resize-y py-2`}
            placeholder='e.g. "Never call it a tool — always say platform."'
            value={newCorrection}
            onChange={(e) => setNewCorrection(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addCorrection();
            }}
          />
          <Button size="sm" className="h-9 shrink-0" onClick={addCorrection} disabled={!newCorrection.trim()}>
            <Check className="size-3.5" /> Save to memory
          </Button>
        </div>
        {corrections.length > 0 && (
          <ul className="mt-3 space-y-2">
            {corrections.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-sunken p-3">
                <span className="text-[13px] text-foreground">{c.instruction}</span>
                <button
                  onClick={() => removeCorrection(c.id)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove correction"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  onAdd,
  empty,
  children,
}: {
  icon: typeof Package;
  title: string;
  count: number;
  onAdd: () => void;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Icon className="size-4 text-brand" /> {title}
          <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{count}</span>
        </h3>
        <Button variant="outline" size="sm" className="h-8" onClick={onAdd}>
          <Plus className="size-3.5" /> Add
        </Button>
      </div>
      {count === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-[12.5px] text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

function Row({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative space-y-2 rounded-xl border border-border bg-surface-sunken p-3 pr-10">
      {children}
      <button
        onClick={onRemove}
        className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function LabeledList({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label} (comma-separated)</label>
      <input className={inputCls} placeholder={`${label}…`} value={value.join(", ")} onChange={(e) => onChange(fromList(e.target.value))} />
    </div>
  );
}
