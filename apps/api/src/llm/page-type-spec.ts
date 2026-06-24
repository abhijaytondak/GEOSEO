import type { PageType } from "@geoseo/types";
import { jsonLdSafe } from "../common/escape";

/**
 * Per-page-type generation spec. The SAME spec drives (a) the LLM prompt in
 * `deepseek.ts` and (b) the deterministic template fallback + JSON-LD in
 * `page-engine.service.ts`, so a Blog/Service/Comparison page is structurally
 * distinct whether it's AI-drafted or template-drafted (closes the Gushwork
 * "every page looks the same" gap — see docs/PRD-page-engine-gushwork-parity.md
 * Phase 1). Returning the same `DraftContent` shape keeps the change additive.
 */
export interface PageTypeSpec {
  /** Human label ("Blog guide", "Service page"). */
  label: string;
  /** Voice/role instruction handed to the LLM. */
  role: string;
  /** Ordered section arc the writer follows (wording adapts; arc holds). */
  sectionPlan: string[];
  /** How many FAQ pairs the page carries. */
  faqCount: number;
  /** Primary schema.org @type for the JSON-LD. */
  schemaType: string;
  /** Page-appropriate default call to action. */
  cta: { label: string; href: string };
  /** Drives section depth + LLM token budget. */
  depth: "short" | "standard" | "long";
}

export const PAGE_TYPE_SPEC: Record<PageType, PageTypeSpec> = {
  landing: {
    label: "Landing page",
    role: "a conversion-focused landing page that turns high-intent visitors into leads or customers — structured for both Google ranking and AI engine citation",
    sectionPlan: [
      "The core problem this solves and why it matters now",
      "How it works — the specific process or mechanism",
      "Key capabilities and what makes it different",
      "Proof: real outcomes, results, and who benefits",
      "Who it's for and how to get started",
    ],
    faqCount: 4,
    schemaType: "WebPage",
    cta: { label: "Get started", href: "/contact" },
    depth: "long",
  },
  service: {
    label: "Service page",
    role: "a benefit-focused, conversion-ready service page that explains exactly what the service includes, who it's for, and why this provider — structured for AI comprehension and local/commercial search",
    sectionPlan: [
      "What this service includes — scope, deliverables, and what to expect",
      "Key benefits and measurable outcomes",
      "Our step-by-step process from start to finish",
      "Why choose us — specific differentiators, credentials, experience",
      "Pricing, timeline, and how to get started",
    ],
    faqCount: 4,
    schemaType: "Service",
    cta: { label: "Get a quote", href: "/contact" },
    depth: "long",
  },
  guide: {
    label: "Blog guide",
    role: "a comprehensive, genuinely useful guide structured for readability, topical authority, and AI engine citation — covers the topic completely so a reader doesn't need to go elsewhere",
    sectionPlan: [
      "What it is, why it matters, and the key definition",
      "How it works — the core mechanism or process, step by step",
      "Best practices and proven approaches",
      "Common mistakes to avoid and how to fix them",
      "Real-world examples with specific details",
      "Quick-reference summary and next steps",
    ],
    faqCount: 6,
    schemaType: "BlogPosting",
    cta: { label: "Talk to an expert", href: "/contact" },
    depth: "long",
  },
  comparison: {
    label: "Comparison page",
    role: "an honest, thorough comparison that helps a buyer make a confident decision — covers features, pricing, and use-case fit without spin",
    sectionPlan: [
      "TL;DR — the verdict and which option wins for which buyer",
      "Feature-by-feature comparison with specific detail",
      "Pricing and total cost of ownership",
      "When to choose each option — use cases and ideal buyer profiles",
      "Migration, onboarding, and support differences",
    ],
    faqCount: 5,
    schemaType: "Article",
    cta: { label: "See how we compare", href: "/contact" },
    depth: "long",
  },
  faq: {
    label: "FAQ page",
    role: "an answer-dense FAQ page covering every question a buyer realistically asks — each answer is complete, standalone, and citable by AI answer engines",
    sectionPlan: ["Quick overview — what this page covers"],
    faqCount: 10,
    schemaType: "FAQPage",
    cta: { label: "Still have questions? Contact us", href: "/contact" },
    depth: "standard",
  },
  resource: {
    label: "Resource page",
    role: "a practical, actionable resource — template, checklist, or toolkit — the reader can use immediately; each section delivers a concrete, usable output",
    sectionPlan: [
      "What's inside and what you'll be able to do with it",
      "How to use it — step-by-step instructions",
      "A worked example with real context",
    ],
    faqCount: 3,
    schemaType: "Article",
    cta: { label: "Get the full resource", href: "/contact" },
    depth: "long",
  },
  local: {
    label: "Local page",
    role: "a location-specific service page that wins local search and converts nearby buyers — covers service area, local relevance signals, and trust factors a local customer cares about",
    sectionPlan: [
      "Services offered in this area — specific, local scope",
      "Why choose a local provider — proximity, speed, accountability",
      "Service area coverage — cities, neighbourhoods, radius",
      "Local credentials, licences, and community presence",
    ],
    faqCount: 4,
    schemaType: "LocalBusiness",
    cta: { label: "Contact your local team", href: "/contact" },
    depth: "short",
  },
};

export function specFor(pageType: string): PageTypeSpec {
  return PAGE_TYPE_SPEC[pageType as PageType] ?? PAGE_TYPE_SPEC.landing;
}

/**
 * Build per-type JSON-LD. Emits a @graph with the page's primary entity and,
 * when the page carries FAQs, a FAQPage node — so AI answer engines get the
 * structured questions even on non-FAQ page types. Always valid JSON.
 */
export function buildSchemaJson(
  pageType: string,
  data: { title: string; description: string; faqs?: { q: string; a: string }[] },
): string {
  const spec = specFor(pageType);
  const faqs = data.faqs?.filter((f) => f.q && f.a) ?? [];
  const faqNode = (name: string) => ({
    "@type": "FAQPage",
    name,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  const graph: Record<string, unknown>[] =
    spec.schemaType === "FAQPage"
      ? [faqNode(data.title)]
      : [{ "@type": spec.schemaType, name: data.title, description: data.description }];

  if (spec.schemaType !== "FAQPage" && faqs.length) graph.push(faqNode(`${data.title} — FAQ`));

  // Escape < > & at the source so the stored schemaJson is safe to embed in a
  // <script type="application/ld+json"> block (defense-in-depth; render sinks also escape,
  // and jsonLdSafe is idempotent). Output remains valid JSON.
  return jsonLdSafe(JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2));
}
