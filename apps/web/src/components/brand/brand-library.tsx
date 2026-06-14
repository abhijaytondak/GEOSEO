"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Package, Users, Award, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

type ProofType = "stat" | "testimonial" | "case-study" | "award" | "logo";
interface BrandProduct { id: string; name: string; description: string; category?: string; url?: string }
interface BuyerPersona { id: string; name: string; role?: string; painPoints: string[]; goals: string[] }
interface ProofPoint { id: string; type: ProofType; label: string; detail?: string; source?: string }
interface Library { products: BrandProduct[]; personas: BuyerPersona[]; proofPoints: ProofPoint[] }

const PROOF_TYPES: ProofType[] = ["stat", "testimonial", "case-study", "award", "logo"];
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);
const fromList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none transition-colors focus:border-brand";

export function BrandLibrary() {
  const { notify } = useAppFeedback();
  const [lib, setLib] = useState<Library | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/brand-library", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((jr) => {
        if (cancelled) return;
        const l = jr?.data?.library;
        setLib({
          products: l?.products ?? [],
          personas: l?.personas ?? [],
          proofPoints: l?.proofPoints ?? [],
        });
      })
      .catch(() => setLib({ products: [], personas: [], proofPoints: [] }));
    return () => {
      cancelled = true;
    };
  }, []);

  function mutate(next: Library) {
    setLib(next);
    setDirty(true);
  }

  async function save() {
    if (!lib) return;
    setSaving(true);
    try {
      const r = await fetch("/api/v1/brand-library", {
        method: "PUT",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(lib),
      });
      const jr = await r.json();
      if (!r.ok || !jr.success) throw new Error(jr.errors?.[0]?.message ?? "Save failed");
      const l = jr.data.library;
      setLib({ products: l.products, personas: l.personas, proofPoints: l.proofPoints });
      setDirty(false);
      notify({ kind: "success", title: "Library saved", message: "Generated pages and outreach will use these facts." });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
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
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputCls}
                placeholder="Category (optional)"
                value={p.category ?? ""}
                onChange={(e) => mutate({ ...lib, products: lib.products.map((x) => (x.id === p.id ? { ...x, category: e.target.value } : x)) })}
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
        onAdd={() => mutate({ ...lib, personas: [...lib.personas, { id: uid(), name: "", painPoints: [], goals: [] }] })}
        empty="Add who you sell to so copy speaks to their pains and goals."
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
