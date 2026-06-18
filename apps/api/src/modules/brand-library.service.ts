import { Injectable, OnModuleInit } from "@nestjs/common";
import type { BrandProfile } from "@geoseo/types";
import { DocStore } from "../db/db";

/** Structured Brand Memory library — products, buyer personas, and proof points.
 *  Additive side-store (cx_brand_library); grounds page/content generation in real
 *  business facts instead of invented ones. Types are local on purpose (avoid the
 *  contested @geoseo/types + brand.service). */
export interface BrandProduct {
  id: string;
  name: string;
  description: string;
  category?: string;
  /** So the AI never invents prices (Gushwork-parity: products carry pricing). */
  pricing?: string;
  url?: string;
}

export interface BuyerPersona {
  id: string;
  name: string;
  role?: string;
  painPoints: string[];
  goals: string[];
  /** What makes this persona buy now (Gushwork-parity: buying triggers). */
  buyingTriggers: string[];
}

export type ProofType = "stat" | "testimonial" | "case-study" | "award" | "logo";
export interface ProofPoint {
  id: string;
  type: ProofType;
  label: string;
  detail?: string;
  source?: string;
}

/** Brand-voice terminology rules — preferred terms to use, and words/phrases to avoid. */
export interface BrandTerminology {
  preferred: string[];
  avoid: string[];
}

/** Tone of voice — how every generated draft should *sound*. Preset/freeform tone label,
 *  adjective traits, and freeform do/don't guidance. Folded into the generation grounding. */
export interface BrandVoice {
  tone: string;
  traits: string[];
  guidance: string;
}

/**
 * Feedback Memory (Gushwork-parity differentiator): a correction the user made that must
 * stick everywhere — "fix it once, it stays fixed." Injected with top priority into every
 * generation grounding so the AI never repeats the mistake.
 */
export interface Correction {
  id: string;
  instruction: string;
  createdAt: string;
}

export interface BrandLibrary {
  products: BrandProduct[];
  personas: BuyerPersona[];
  proofPoints: ProofPoint[];
  terminology: BrandTerminology;
  /** Tone of voice (optional — added after launch; readers must tolerate absence). */
  voice?: BrandVoice;
  /** Real brand images pulled from the site (absolute http(s) URLs). */
  images?: string[];
  corrections: Correction[];
  updatedAt: string;
}

/** Empty voice (stable shape for the UI). */
export function emptyVoice(): BrandVoice {
  return { tone: "", traits: [], guidance: "" };
}

/** Empty library (used for new tenants / hydration defaults). */
export function emptyLibrary(): BrandLibrary {
  return { products: [], personas: [], proofPoints: [], terminology: { preferred: [], avoid: [] }, voice: emptyVoice(), images: [], corrections: [], updatedAt: "" };
}

const PROOF_TYPES: ProofType[] = ["stat", "testimonial", "case-study", "award", "logo"];

const str = (v: unknown, max = 600): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v: unknown, cap = 24): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, 200)).filter(Boolean).slice(0, cap) : [];
const id = (v: unknown, fallback: string): string => {
  const s = str(v, 64);
  return s || fallback;
};

/**
 * Compose a grounding hint for page/content generation from Brand Memory + the
 * structured library. Pure (no DI) so it's unit-testable and reusable. Returns
 * undefined when there's no company yet (caller falls back to neutral copy).
 */
export function composeBrandContext(brand: BrandProfile | null | undefined, lib: BrandLibrary): string | undefined {
  if (!brand?.company) return undefined;
  const parts = [`${brand.company}${brand.valueProp ? ` — ${brand.valueProp}` : ""}`];
  if (brand.audience) parts.push(`Audience: ${brand.audience}.`);

  // Feedback Memory first + highest priority: corrections the user made must always hold.
  if (lib.corrections?.length) {
    parts.push(
      "ALWAYS honor these brand corrections (highest priority, never violate): " +
        lib.corrections.slice(0, 12).map((c) => c.instruction).join("; ") +
        ".",
    );
  }
  if (lib.products.length) {
    parts.push(
      "Products: " +
        lib.products
          .slice(0, 6)
          .map((p) => `${p.name}${p.description ? ` (${p.description})` : ""}${p.pricing ? ` — pricing: ${p.pricing}` : ""}`)
          .join("; ") +
        ". Never invent product names, features, or prices.",
    );
  }
  if (lib.personas.length) {
    parts.push(
      "Buyer personas: " +
        lib.personas
          .slice(0, 4)
          .map((p) => {
            const bits = [p.name + (p.role ? ` (${p.role})` : "")];
            if (p.painPoints.length) bits.push(`pains: ${p.painPoints.slice(0, 3).join(", ")}`);
            if (p.goals.length) bits.push(`goals: ${p.goals.slice(0, 3).join(", ")}`);
            if (p.buyingTriggers?.length) bits.push(`buys when: ${p.buyingTriggers.slice(0, 3).join(", ")}`);
            return bits.join(" — ");
          })
          .join("; ") +
        ".",
    );
  }
  if (lib.proofPoints.length) {
    parts.push(
      "Proof points (cite where relevant, never fabricate): " +
        lib.proofPoints.slice(0, 5).map((p) => p.label + (p.detail ? ` (${p.detail})` : "")).join("; ") +
        ".",
    );
  }
  const voice = lib.voice;
  if (voice && (voice.tone || voice.traits?.length || voice.guidance)) {
    const bits: string[] = [];
    if (voice.tone) bits.push(`tone: ${voice.tone}`);
    if (voice.traits?.length) bits.push(`traits: ${voice.traits.slice(0, 8).join(", ")}`);
    if (voice.guidance) bits.push(voice.guidance);
    parts.push("Write in this brand's tone of voice — " + bits.join("; ") + ".");
  }
  const term = lib.terminology;
  if (term && (term.preferred?.length || term.avoid?.length)) {
    const bits: string[] = [];
    if (term.preferred?.length) bits.push(`prefer these terms: ${term.preferred.slice(0, 12).join(", ")}`);
    if (term.avoid?.length) bits.push(`never use: ${term.avoid.slice(0, 12).join(", ")}`);
    parts.push("Brand voice — " + bits.join("; ") + ".");
  }
  return parts.join(" ").trim();
}

/** Per-tenant structured Brand library (multi-tenant pattern — docs/MULTI-TENANCY.md, P0-6).
 *  Each workspace's products/personas/proof points are isolated; ws-default → legacy "state" row. */
@Injectable()
export class BrandLibraryStore {
  private cache = new Map<string, BrandLibrary>();
  private db = new DocStore<BrandLibrary>("cx_brand_library");

  private async state(tenantId: string): Promise<BrandLibrary> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = await this.db.loadForTenant(tenantId);
    const s: BrandLibrary = {
      products: loaded?.products ?? [],
      personas: (loaded?.personas ?? []).map((p) => ({ ...p, buyingTriggers: p.buyingTriggers ?? [] })),
      proofPoints: loaded?.proofPoints ?? [],
      terminology: {
        preferred: loaded?.terminology?.preferred ?? [],
        avoid: loaded?.terminology?.avoid ?? [],
      },
      voice: {
        tone: loaded?.voice?.tone ?? "",
        traits: loaded?.voice?.traits ?? [],
        guidance: loaded?.voice?.guidance ?? "",
      },
      images: loaded?.images ?? [],
      corrections: loaded?.corrections ?? [],
      updatedAt: loaded?.updatedAt ?? "",
    };
    this.cache.set(tenantId, s);
    return s;
  }
  private persist(tenantId: string, s: BrandLibrary) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async get(tenantId: string): Promise<BrandLibrary> {
    return this.state(tenantId);
  }

  /** Full-replace upsert. Sanitizes every field so unvalidated client input can't poison the store. */
  async replace(tenantId: string, next: Partial<BrandLibrary>, now: string): Promise<BrandLibrary> {
    const products: BrandProduct[] = (Array.isArray(next.products) ? next.products : [])
      .slice(0, 100)
      .map((p, i) => ({
        id: id((p as BrandProduct)?.id, `prod-${i + 1}`),
        name: str((p as BrandProduct)?.name, 160),
        description: str((p as BrandProduct)?.description, 1200),
        category: str((p as BrandProduct)?.category, 80) || undefined,
        pricing: str((p as BrandProduct)?.pricing, 200) || undefined,
        url: str((p as BrandProduct)?.url, 2048) || undefined,
      }))
      .filter((p) => p.name);

    const personas: BuyerPersona[] = (Array.isArray(next.personas) ? next.personas : [])
      .slice(0, 100)
      .map((p, i) => ({
        id: id((p as BuyerPersona)?.id, `persona-${i + 1}`),
        name: str((p as BuyerPersona)?.name, 160),
        role: str((p as BuyerPersona)?.role, 160) || undefined,
        painPoints: strList((p as BuyerPersona)?.painPoints),
        goals: strList((p as BuyerPersona)?.goals),
        buyingTriggers: strList((p as BuyerPersona)?.buyingTriggers),
      }))
      .filter((p) => p.name);

    const proofPoints: ProofPoint[] = (Array.isArray(next.proofPoints) ? next.proofPoints : [])
      .slice(0, 200)
      .map((p, i) => {
        const t = str((p as ProofPoint)?.type, 20) as ProofType;
        return {
          id: id((p as ProofPoint)?.id, `proof-${i + 1}`),
          type: PROOF_TYPES.includes(t) ? t : "stat",
          label: str((p as ProofPoint)?.label, 240),
          detail: str((p as ProofPoint)?.detail, 600) || undefined,
          source: str((p as ProofPoint)?.source, 2048) || undefined,
        };
      })
      .filter((p) => p.label);

    const terminology: BrandTerminology = {
      preferred: strList((next.terminology as BrandTerminology)?.preferred, 40),
      avoid: strList((next.terminology as BrandTerminology)?.avoid, 40),
    };

    const voice: BrandVoice = {
      tone: str((next.voice as BrandVoice)?.tone, 120),
      traits: strList((next.voice as BrandVoice)?.traits, 16),
      guidance: str((next.voice as BrandVoice)?.guidance, 1200),
    };

    // Only http(s) image URLs — never data: URIs or relative paths (defense-in-depth).
    const images: string[] = (Array.isArray(next.images) ? next.images : [])
      .map((u) => str(u, 2048))
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 100);

    // Corrections (Feedback Memory) are preserved across full-replace edits — they're managed
    // via addCorrection/removeCorrection, not overwritten by a library save.
    const existing = await this.state(tenantId);
    const corrections = Array.isArray(next.corrections)
      ? sanitizeCorrections(next.corrections, now)
      : existing.corrections;

    const lib: BrandLibrary = { products, personas, proofPoints, terminology, voice, images, corrections, updatedAt: now };
    this.persist(tenantId, lib);
    return lib;
  }

  /** Append a correction (Feedback Memory — "fix once, stays fixed everywhere"). */
  async addCorrection(tenantId: string, instruction: string, now: string): Promise<BrandLibrary> {
    const s = await this.state(tenantId);
    const text = str(instruction, 600);
    if (text) {
      s.corrections = [{ id: `corr-${s.corrections.length + 1}-${now.slice(0, 10)}`, instruction: text, createdAt: now }, ...s.corrections].slice(0, 200);
      s.updatedAt = now;
      this.persist(tenantId, s);
    }
    return s;
  }

  async removeCorrection(tenantId: string, correctionId: string, now: string): Promise<BrandLibrary> {
    const s = await this.state(tenantId);
    s.corrections = s.corrections.filter((c) => c.id !== correctionId);
    s.updatedAt = now;
    this.persist(tenantId, s);
    return s;
  }

  /** Completeness signal for the Brand workspace (0–100). */
  async strength(tenantId: string): Promise<number> {
    const lib = await this.state(tenantId);
    const p = lib.products.length ? 30 : 0;
    const a = lib.personas.length ? 25 : 0;
    const f = lib.proofPoints.length ? 20 : 0;
    const t = lib.terminology.preferred.length || lib.terminology.avoid.length ? 15 : 0;
    const c = lib.corrections.length ? 10 : 0;
    return p + a + f + t + c;
  }
}

/** Sanitize a corrections array (used when a full-replace includes corrections). */
function sanitizeCorrections(raw: unknown[], now: string): Correction[] {
  return raw
    .slice(0, 200)
    .map((c, i) => ({
      id: id((c as Correction)?.id, `corr-${i + 1}`),
      instruction: str((c as Correction)?.instruction, 600),
      createdAt: str((c as Correction)?.createdAt, 40) || now,
    }))
    .filter((c) => c.instruction);
}
