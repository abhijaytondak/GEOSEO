import type { PageType } from "@geoseo/types";

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
    role: "a conversion-focused landing page that turns commercial-intent visitors into demos or signups",
    sectionPlan: [
      "The problem you're solving",
      "How it works",
      "Key capabilities",
      "Proof & outcomes",
      "Who it's for",
    ],
    faqCount: 3,
    schemaType: "WebPage",
    cta: { label: "Book a demo", href: "/demo" },
    depth: "standard",
  },
  service: {
    label: "Service page",
    role: "a benefit-focused service page for one specific service, conversion-ready and structured for AI comprehension",
    sectionPlan: [
      "What this service includes",
      "The benefits you get",
      "Our process",
      "Why choose us",
      "Plans & pricing",
    ],
    faqCount: 3,
    schemaType: "Service",
    cta: { label: "Get a quote", href: "/contact" },
    depth: "standard",
  },
  guide: {
    label: "Blog guide",
    role: "a long-form, genuinely useful article built on real keyword research, structured for readability and for AI crawlers to cite",
    sectionPlan: [
      "What it is and why it matters",
      "How it works, step by step",
      "Best practices",
      "Common mistakes to avoid",
      "Real-world examples",
      "Key takeaways",
    ],
    faqCount: 4,
    schemaType: "BlogPosting",
    cta: { label: "Talk to an expert", href: "/contact" },
    depth: "long",
  },
  comparison: {
    label: "Comparison page",
    role: "an honest buyer-evaluation comparison that helps a ready-to-decide reader pick the right option",
    sectionPlan: [
      "TL;DR — the verdict",
      "Feature-by-feature comparison",
      "Pricing comparison",
      "When to choose each",
      "Switching & migration",
    ],
    faqCount: 3,
    schemaType: "Article",
    cta: { label: "See how we compare", href: "/demo" },
    depth: "standard",
  },
  faq: {
    label: "FAQ page",
    role: "an answer-dense FAQ page that resolves buyer questions and is structured for AI answer engines",
    sectionPlan: ["Quick overview"],
    faqCount: 8,
    schemaType: "FAQPage",
    cta: { label: "Still have questions? Contact us", href: "/contact" },
    depth: "standard",
  },
  resource: {
    label: "Resource page",
    role: "a practical resource (template, checklist, or toolkit) the reader can act on immediately",
    sectionPlan: ["What's inside", "How to use it", "A worked example"],
    faqCount: 3,
    schemaType: "Article",
    cta: { label: "Get the full resource", href: "/contact" },
    depth: "long",
  },
  local: {
    label: "Local page",
    role: "a location-focused page that wins local intent and converts nearby buyers",
    sectionPlan: [
      "Services we offer locally",
      "Why choose a local provider",
      "Areas we cover",
    ],
    faqCount: 3,
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

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}
