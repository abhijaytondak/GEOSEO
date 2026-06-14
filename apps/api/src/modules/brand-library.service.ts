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
  url?: string;
}

export interface BuyerPersona {
  id: string;
  name: string;
  role?: string;
  painPoints: string[];
  goals: string[];
}

export type ProofType = "stat" | "testimonial" | "case-study" | "award" | "logo";
export interface ProofPoint {
  id: string;
  type: ProofType;
  label: string;
  detail?: string;
  source?: string;
}

export interface BrandLibrary {
  products: BrandProduct[];
  personas: BuyerPersona[];
  proofPoints: ProofPoint[];
  updatedAt: string;
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
  if (lib.products.length) {
    parts.push(
      "Products: " +
        lib.products.slice(0, 5).map((p) => `${p.name}${p.description ? ` (${p.description})` : ""}`).join("; ") +
        ".",
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
  return parts.join(" ").trim();
}

@Injectable()
export class BrandLibraryStore implements OnModuleInit {
  private lib: BrandLibrary = { products: [], personas: [], proofPoints: [], updatedAt: "" };
  private db = new DocStore<BrandLibrary>("cx_brand_library");

  async onModuleInit() {
    await this.db.init(this.lib, (loaded) => {
      this.lib = {
        products: loaded.products ?? [],
        personas: loaded.personas ?? [],
        proofPoints: loaded.proofPoints ?? [],
        updatedAt: loaded.updatedAt ?? "",
      };
    });
  }

  get(): BrandLibrary {
    return this.lib;
  }

  /** Full-replace upsert. Sanitizes every field so unvalidated client input can't poison the store. */
  replace(next: Partial<BrandLibrary>, now: string): BrandLibrary {
    const products: BrandProduct[] = (Array.isArray(next.products) ? next.products : [])
      .slice(0, 100)
      .map((p, i) => ({
        id: id((p as BrandProduct)?.id, `prod-${i + 1}`),
        name: str((p as BrandProduct)?.name, 160),
        description: str((p as BrandProduct)?.description, 1200),
        category: str((p as BrandProduct)?.category, 80) || undefined,
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

    this.lib = { products, personas, proofPoints, updatedAt: now };
    this.db.save(this.lib);
    return this.lib;
  }

  /** Completeness signal for the Brand workspace (0–100). */
  strength(): number {
    const p = this.lib.products.length ? 40 : 0;
    const a = this.lib.personas.length ? 35 : 0;
    const f = this.lib.proofPoints.length ? 25 : 0;
    return p + a + f;
  }
}
