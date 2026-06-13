import type {
  GeneratedPage,
  KeywordOpportunity,
  Lead,
  PageBlueprint,
  PageEngineSource,
} from "@geoseo/types";
import { daysAgo, hoursAgo } from "./rng";

/* ----------------------------------------------- keyword opportunities */

export const keywordOpportunities: KeywordOpportunity[] = [
  {
    id: "kw-1",
    query: "product analytics platform",
    clusterId: "c-analytics",
    clusterLabel: "Product Analytics",
    intent: "commercial",
    volume: 8100,
    difficulty: 64,
    commercialValue: 92,
    confidence: 88,
    recommendedPageType: "landing",
    competitorUrls: ["amplitude.com/product-analytics", "mixpanel.com/product-analytics"],
    evidence: "High commercial intent; competitors rank with thin landing pages — a depth play wins.",
    status: "approved",
    createdAt: daysAgo(9),
  },
  {
    id: "kw-2",
    query: "cohort retention analysis guide",
    clusterId: "c-retention",
    clusterLabel: "Retention",
    intent: "informational",
    volume: 2400,
    difficulty: 38,
    commercialValue: 61,
    confidence: 90,
    recommendedPageType: "guide",
    competitorUrls: ["amplitude.com/blog/cohort-analysis"],
    evidence: "Top-of-funnel guide that feeds the analytics cluster; low difficulty, fast to rank.",
    status: "approved",
    createdAt: daysAgo(8),
  },
  {
    id: "kw-3",
    query: "northwind vs amplitude",
    clusterId: "c-compare",
    clusterLabel: "Comparisons",
    intent: "comparison",
    volume: 720,
    difficulty: 22,
    commercialValue: 95,
    confidence: 84,
    recommendedPageType: "comparison",
    competitorUrls: ["g2.com/compare", "amplitude.com/compare"],
    evidence: "Bottom-funnel comparison; buyers in evaluation. We own the narrative on our own term.",
    status: "new",
    createdAt: daysAgo(5),
  },
  {
    id: "kw-4",
    query: "how to choose a north star metric",
    clusterId: "c-metrics",
    clusterLabel: "Growth Metrics",
    intent: "informational",
    volume: 1900,
    difficulty: 41,
    commercialValue: 55,
    confidence: 86,
    recommendedPageType: "guide",
    competitorUrls: ["sahilbloom.com", "amplitude.com/blog/north-star-metric"],
    evidence: "Evergreen demand; strong internal-link hub for the metrics cluster.",
    status: "new",
    createdAt: daysAgo(4),
  },
  {
    id: "kw-5",
    query: "self-serve analytics for product teams",
    clusterId: "c-analytics",
    clusterLabel: "Product Analytics",
    intent: "commercial",
    volume: 1300,
    difficulty: 47,
    commercialValue: 84,
    confidence: 80,
    recommendedPageType: "landing",
    competitorUrls: ["heap.io", "june.so"],
    evidence: "Differentiator-led page (warehouse-native) — gap competitors don't address well.",
    status: "new",
    createdAt: daysAgo(3),
  },
  {
    id: "kw-6",
    query: "activation rate benchmarks saas",
    clusterId: "c-retention",
    clusterLabel: "Retention",
    intent: "informational",
    volume: 880,
    difficulty: 33,
    commercialValue: 58,
    confidence: 91,
    recommendedPageType: "resource",
    competitorUrls: ["userpilot.com/blog"],
    evidence: "Original benchmark data → high link-worthiness and AI-citation potential.",
    status: "deferred",
    createdAt: daysAgo(6),
  },
  {
    id: "kw-7",
    query: "warehouse native analytics explained",
    clusterId: "c-analytics",
    clusterLabel: "Product Analytics",
    intent: "informational",
    volume: 590,
    difficulty: 29,
    commercialValue: 72,
    confidence: 83,
    recommendedPageType: "guide",
    competitorUrls: ["segment.com/blog"],
    evidence: "Category-defining term aligned to our core differentiator; low difficulty.",
    status: "new",
    createdAt: daysAgo(2),
  },
  {
    id: "kw-8",
    query: "best product analytics tools 2026",
    clusterId: "c-compare",
    clusterLabel: "Comparisons",
    intent: "commercial",
    volume: 3600,
    difficulty: 58,
    commercialValue: 89,
    confidence: 76,
    recommendedPageType: "resource",
    competitorUrls: ["g2.com", "capterra.com"],
    evidence: "Listicle intent; high value but contested — needs strong proof points to rank.",
    status: "new",
    createdAt: daysAgo(1),
  },
];

/* ----------------------------------------------- blueprints */

export const pageBlueprints: PageBlueprint[] = [
  {
    id: "bp-1",
    opportunityId: "kw-1",
    title: "Product Analytics Platform for Modern Teams",
    slug: "/product-analytics-platform",
    pageType: "landing",
    targetKeywords: ["product analytics platform", "product analytics software"],
    intentSummary: "Evaluators comparing analytics platforms; want depth, proof, and a clear next step.",
    audience: "Heads of Product & Growth at Series A–C B2B SaaS",
    outline: [
      { heading: "Hero + primary CTA", summary: "Outcome-led headline; book-a-demo CTA." },
      { heading: "Why warehouse-native", summary: "Differentiator section with diagram." },
      { heading: "Use cases", summary: "Activation, retention, expansion." },
      { heading: "Proof", summary: "Customer logos + metric lift stats." },
      { heading: "FAQ", summary: "Setup time, data stack, security." },
    ],
    ctaPlan: "Primary: Book a demo. Secondary: Read the cohort guide.",
    internalLinkPlan: ["/cohort-retention-guide", "/north-star-metric", "/vs-amplitude"],
    schemaPlan: ["Product", "FAQPage", "BreadcrumbList"],
    differentiationNotes: "Lead with warehouse-native + AI 'why it moved' insights.",
    changeKind: "net-new",
    status: "approved",
    createdAt: daysAgo(8),
    approvedAt: daysAgo(7),
  },
  {
    id: "bp-2",
    opportunityId: "kw-2",
    title: "The Complete Cohort Retention Analysis Guide",
    slug: "/cohort-retention-guide",
    pageType: "guide",
    targetKeywords: ["cohort retention analysis", "retention cohorts"],
    intentSummary: "Practitioners learning how to run cohort analysis; need a usable, example-rich guide.",
    audience: "Product analysts & growth managers",
    outline: [
      { heading: "What is cohort retention", summary: "Definition + why it matters." },
      { heading: "How to build a cohort chart", summary: "Step-by-step with screenshots." },
      { heading: "Reading the curve", summary: "Flattening, smiles, churn cliffs." },
      { heading: "Templates", summary: "Downloadable cohort templates." },
    ],
    ctaPlan: "Soft CTA: try the interactive cohort report.",
    internalLinkPlan: ["/product-analytics-platform", "/north-star-metric"],
    schemaPlan: ["Article", "HowTo", "FAQPage"],
    differentiationNotes: "Include original benchmark data for link-worthiness.",
    changeKind: "net-new",
    status: "approved",
    createdAt: daysAgo(7),
    approvedAt: daysAgo(6),
  },
  {
    id: "bp-3",
    opportunityId: "kw-3",
    title: "Northwind vs Amplitude: An Honest Comparison",
    slug: "/vs-amplitude",
    pageType: "comparison",
    targetKeywords: ["northwind vs amplitude", "amplitude alternative"],
    intentSummary: "Buyers in evaluation comparing the two; want a fair, specific comparison table.",
    audience: "Buying committees evaluating analytics vendors",
    outline: [
      { heading: "TL;DR verdict", summary: "Who each tool is best for." },
      { heading: "Feature comparison table", summary: "Setup, modeling, AI, pricing." },
      { heading: "Migration", summary: "How to switch in a week." },
    ],
    ctaPlan: "Primary: Start free. Secondary: Talk to sales.",
    internalLinkPlan: ["/product-analytics-platform"],
    schemaPlan: ["Article", "FAQPage", "BreadcrumbList"],
    differentiationNotes: "Be genuinely fair — credibility drives conversion on comparison pages.",
    changeKind: "net-new",
    status: "draft",
    createdAt: daysAgo(4),
  },
];

/* ----------------------------------------------- generated pages */

function schema(type: string, name: string): string {
  return JSON.stringify(
    { "@context": "https://schema.org", "@type": type, name },
    null,
    2,
  );
}

const allChecks = (over: Partial<Record<string, boolean>> = {}) =>
  [
    "Single H1",
    "Meta title 50–60 chars",
    "Meta description set",
    "Canonical URL",
    "Valid JSON-LD",
    "Internal links resolve",
    "Image alt text",
    "Crawlable without auth",
  ].map((label) => ({ label, pass: over[label] ?? true }));

export const generatedPages: GeneratedPage[] = [
  {
    id: "pg-1",
    blueprintId: "bp-1",
    opportunityId: "kw-1",
    title: "Product Analytics Platform for Modern Teams",
    slug: "/product-analytics-platform",
    pageType: "landing",
    status: "published",
    metaTitle: "Product Analytics Platform | Northwind Labs",
    metaDescription:
      "Warehouse-native product analytics with AI that explains why metrics move. Activate, retain, and expand — no double-tracking.",
    heroCopy:
      "See why your metrics move — not just that they did. Northwind is the warehouse-native product analytics platform for teams that live in their data.",
    sections: [
      { heading: "Why warehouse-native", body: "Runs on your existing stack — no duplicate pipelines, no data drift." },
      { heading: "From signal to decision", body: "AI insights surface the driver behind every activation and retention shift." },
      { heading: "Built for product & growth", body: "Cohorts, funnels, and North Star tracking in one self-serve workspace." },
    ],
    faqs: [
      { q: "How long does setup take?", a: "Under an hour on a modern warehouse — no engineering sprint required." },
      { q: "Do you double-track data?", a: "No. Northwind reads from your warehouse, so there's a single source of truth." },
    ],
    cta: { label: "Book a demo", href: "/demo" },
    schemaJson: schema("Product", "Northwind Product Analytics"),
    targetKeywords: ["product analytics platform", "warehouse-native analytics"],
    wordCount: 1180,
    brandMemoryVersion: 1,
    seoChecks: allChecks(),
    publishedUrl: "https://northwindlabs.io/feeds/product-analytics-platform",
    publishedAt: daysAgo(6),
    lastRefreshedAt: daysAgo(6),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(6),
  },
  {
    id: "pg-2",
    blueprintId: "bp-2",
    opportunityId: "kw-2",
    title: "The Complete Cohort Retention Analysis Guide",
    slug: "/cohort-retention-guide",
    pageType: "guide",
    status: "published",
    metaTitle: "Cohort Retention Analysis: The Complete Guide (2026)",
    metaDescription:
      "Learn to run cohort retention analysis step by step, read the curve, and act on it — with free templates and original benchmarks.",
    heroCopy:
      "Retention is the truest signal of product-market fit. This guide shows you how to measure and improve it with cohort analysis.",
    sections: [
      { heading: "What is cohort retention", body: "Group users by when they started, then track how many stay." },
      { heading: "How to build a cohort chart", body: "A practical, screenshot-driven walkthrough." },
      { heading: "Reading the curve", body: "Spot flattening, smile curves, and churn cliffs." },
    ],
    faqs: [
      { q: "What's a good retention curve?", a: "One that flattens — a stable base of returning users — rather than trending to zero." },
    ],
    cta: { label: "Try the interactive cohort report", href: "/product-analytics-platform" },
    schemaJson: schema("Article", "The Complete Cohort Retention Analysis Guide"),
    targetKeywords: ["cohort retention analysis", "retention cohorts"],
    wordCount: 2240,
    brandMemoryVersion: 1,
    seoChecks: allChecks(),
    publishedUrl: "https://northwindlabs.io/feeds/cohort-retention-guide",
    publishedAt: daysAgo(11),
    lastRefreshedAt: daysAgo(40),
    createdAt: daysAgo(13),
    updatedAt: daysAgo(40),
  },
  {
    id: "pg-3",
    blueprintId: "bp-3",
    opportunityId: "kw-3",
    title: "Northwind vs Amplitude: An Honest Comparison",
    slug: "/vs-amplitude",
    pageType: "comparison",
    status: "in-review",
    metaTitle: "Northwind vs Amplitude: Honest 2026 Comparison",
    metaDescription:
      "A fair, specific comparison of Northwind and Amplitude — setup, modeling, AI insights, and pricing — to help you choose.",
    heroCopy:
      "Both are excellent. Here's a genuinely fair breakdown of where each tool wins, so you can choose with confidence.",
    sections: [
      { heading: "TL;DR verdict", body: "Amplitude for large enterprises; Northwind for warehouse-native, AI-first teams." },
      { heading: "Feature comparison", body: "Setup time, data modeling, AI insights, and pricing side by side." },
    ],
    faqs: [
      { q: "Is Northwind an Amplitude alternative?", a: "Yes — especially if you want warehouse-native setup and AI explanations of metric movement." },
    ],
    cta: { label: "Start free", href: "/signup" },
    schemaJson: schema("Article", "Northwind vs Amplitude"),
    targetKeywords: ["northwind vs amplitude", "amplitude alternative"],
    wordCount: 1430,
    brandMemoryVersion: 1,
    seoChecks: allChecks({ "Meta description set": true, "Internal links resolve": false }),
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(20),
  },
  {
    id: "pg-4",
    blueprintId: "bp-2",
    opportunityId: "kw-4",
    title: "How to Choose a North Star Metric",
    slug: "/north-star-metric",
    pageType: "guide",
    status: "draft",
    metaTitle: "How to Choose a North Star Metric (with Examples)",
    metaDescription:
      "A practical framework for choosing a North Star Metric that aligns your team around durable, compounding value.",
    heroCopy: "Your North Star Metric should capture the value customers get — and predict the value you capture.",
    sections: [
      { heading: "What makes a good North Star", body: "Leading, value-based, and team-aligning." },
      { heading: "A 4-step framework", body: "From mission to measurable metric." },
    ],
    faqs: [{ q: "Can you have two North Stars?", a: "One primary is best; support it with a small set of input metrics." }],
    cta: { label: "See it in Northwind", href: "/product-analytics-platform" },
    schemaJson: schema("Article", "How to Choose a North Star Metric"),
    targetKeywords: ["north star metric", "choose north star metric"],
    wordCount: 0,
    brandMemoryVersion: 1,
    seoChecks: allChecks({ "Meta title 50–60 chars": false, "Valid JSON-LD": true }),
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
  },
  {
    id: "pg-5",
    blueprintId: "bp-1",
    opportunityId: "kw-5",
    title: "Self-Serve Analytics for Product Teams",
    slug: "/self-serve-analytics",
    pageType: "landing",
    status: "needs-refresh",
    metaTitle: "Self-Serve Analytics for Product Teams | Northwind",
    metaDescription:
      "Give every product team self-serve access to trustworthy analytics — governed, warehouse-native, and fast.",
    heroCopy: "Stop being the bottleneck. Give your team governed, self-serve analytics they can actually trust.",
    sections: [
      { heading: "Self-serve, governed", body: "Freedom for teams, guardrails for data leaders." },
    ],
    faqs: [{ q: "Is it really self-serve?", a: "Yes — semantic layer + templates mean no SQL required for common questions." }],
    cta: { label: "Book a demo", href: "/demo" },
    schemaJson: schema("Product", "Northwind Self-Serve Analytics"),
    targetKeywords: ["self-serve analytics", "self service analytics product teams"],
    wordCount: 940,
    brandMemoryVersion: 1,
    seoChecks: allChecks(),
    publishedUrl: "https://northwindlabs.io/feeds/self-serve-analytics",
    publishedAt: daysAgo(74),
    lastRefreshedAt: daysAgo(74),
    createdAt: daysAgo(80),
    updatedAt: daysAgo(74),
  },
];

/* ----------------------------------------------- leads */

const leadSeed: Array<[string, string, string, string, number, Lead["status"], Lead["spamStatus"]]> = [
  ["pg-1", "Priya Nair", "priya@scalewave.io", "Scalewave", 86, "qualified", "clean"],
  ["pg-1", "Tom Becker", "tom@northloop.com", "Northloop", 72, "new", "clean"],
  ["pg-2", "Dana Whitfield", "dana@upcurve.app", "Upcurve", 64, "contacted", "clean"],
  ["pg-1", "winner@lottery-xyz.biz", "winner@lottery-xyz.biz", "—", 4, "new", "spam"],
  ["pg-3", "Marcus Lee", "marcus@flowstate.io", "Flowstate", 91, "qualified", "clean"],
  ["pg-2", "Dana Whitfield", "dana@upcurve.app", "Upcurve", 64, "new", "duplicate"],
  ["pg-1", "Sofia Romano", "sofia@brightmetric.com", "BrightMetric", 78, "won", "clean"],
  ["pg-3", "Kenji Watanabe", "kenji@deltagrow.jp", "DeltaGrow", 69, "contacted", "clean"],
  ["pg-2", "Aisha Khan", "aisha@pulsehq.com", "PulseHQ", 58, "new", "clean"],
  ["pg-1", "Greg Olsen", "greg@—", "—", 9, "lost", "spam"],
];

export const leads: Lead[] = leadSeed.map(([pageId, name, email, company, score, status, spamStatus], i) => {
  const page = generatedPages.find((p) => p.id === pageId)!;
  return {
    id: `lead-${i + 1}`,
    pageId,
    pageTitle: page.title,
    name,
    email,
    company,
    message:
      spamStatus === "spam"
        ? "CONGRATS!!! Click here to claim your prize $$$"
        : "Interested in a demo for our product team — what does onboarding look like?",
    sourceUrl: page.publishedUrl ?? `https://northwindlabs.io/feeds${page.slug}`,
    utm: i % 3 === 0 ? "utm_source=google&utm_medium=organic" : undefined,
    score,
    status,
    spamStatus,
    createdAt: hoursAgo(4 + i * 7),
  };
});

/* ----------------------------------------------- provider */

const resolve = <T>(v: T): Promise<T> => Promise.resolve(v);

export class MockPageEngineSource implements PageEngineSource {
  getOpportunities() {
    return resolve(keywordOpportunities);
  }
  getBlueprints() {
    return resolve(pageBlueprints);
  }
  getPages() {
    return resolve(generatedPages);
  }
  getPage(id: string) {
    return resolve(generatedPages.find((p) => p.id === id));
  }
  getLeads() {
    return resolve(leads);
  }
}

export const pageEngine: PageEngineSource = new MockPageEngineSource();
