/**
 * Keyword research → topic map for the GEOSEO resources hub (/resources).
 *
 * 100 target pages clustered around Generative Engine Optimization (GEO), AI-search
 * visibility, and the SEO foundations that still matter. Each topic targets a real
 * query people type into Google AND ask AI engines, phrased answer-first so the
 * published article can BE the cited source (the product's whole thesis, dogfooded).
 *
 * `keyword` = primary target query · `intent` = informational | commercial | comparison
 * Volume/difficulty would come from a keyword tool (DataForSEO) once keyed; clusters and
 * intent are reasoned from the GEO/AI-search space.
 */

export type Cluster =
  | "geo-fundamentals"
  | "ai-engines"
  | "tactics"
  | "measurement"
  | "seo-foundations"
  | "conversion"
  | "use-cases"
  | "comparisons";

export type Intent = "informational" | "commercial" | "comparison";

export interface Topic {
  slug: string;
  cluster: Cluster;
  title: string; // H1 / metaTitle base — phrased as the query where natural
  keyword: string; // primary target query
  intent: Intent;
}

export const CLUSTERS: { id: Cluster; label: string; blurb: string }[] = [
  { id: "geo-fundamentals", label: "GEO fundamentals", blurb: "What Generative Engine Optimization is and why it matters now." },
  { id: "ai-engines", label: "AI engines", blurb: "How to get cited in ChatGPT, Perplexity, Gemini, and AI Overviews." },
  { id: "tactics", label: "Tactics", blurb: "The concrete techniques that make a page citable by AI." },
  { id: "measurement", label: "Measurement", blurb: "Track AI citations, AI-bot crawls, and share of voice." },
  { id: "seo-foundations", label: "SEO foundations", blurb: "The classic SEO that still feeds the answer engines." },
  { id: "conversion", label: "Conversion", blurb: "Turn AI-search visibility into qualified pipeline." },
  { id: "use-cases", label: "By use case", blurb: "GEO playbooks for SaaS, B2B, ecommerce, local, and agencies." },
  { id: "comparisons", label: "Comparisons", blurb: "GEO vs SEO vs AEO, and how the approaches differ." },
];

export const TOPICS: Topic[] = [
  // ── GEO fundamentals ─────────────────────────────────────────────
  { slug: "what-is-generative-engine-optimization", cluster: "geo-fundamentals", title: "What is Generative Engine Optimization (GEO)?", keyword: "what is generative engine optimization", intent: "informational" },
  { slug: "geo-vs-seo", cluster: "comparisons", title: "GEO vs SEO: what's the difference?", keyword: "geo vs seo", intent: "comparison" },
  { slug: "how-ai-engines-choose-sources", cluster: "geo-fundamentals", title: "How do AI engines choose which sources to cite?", keyword: "how ai engines choose sources", intent: "informational" },
  { slug: "why-geo-matters-2026", cluster: "geo-fundamentals", title: "Why GEO matters in 2026", keyword: "why generative engine optimization matters", intent: "informational" },
  { slug: "ai-search-vs-traditional-search", cluster: "geo-fundamentals", title: "AI search vs traditional search: what changed", keyword: "ai search vs traditional search", intent: "informational" },
  { slug: "what-is-answer-engine-optimization", cluster: "geo-fundamentals", title: "What is Answer Engine Optimization (AEO)?", keyword: "answer engine optimization", intent: "informational" },
  { slug: "geo-glossary", cluster: "geo-fundamentals", title: "GEO glossary: 30 terms for the AI-search era", keyword: "generative engine optimization terms", intent: "informational" },
  { slug: "do-i-still-need-seo", cluster: "geo-fundamentals", title: "Do I still need SEO if I'm doing GEO?", keyword: "do i still need seo with ai search", intent: "informational" },
  { slug: "how-llms-retrieve-information", cluster: "geo-fundamentals", title: "How LLMs retrieve information to answer questions", keyword: "how llms retrieve information", intent: "informational" },
  { slug: "what-is-rag-and-why-it-matters-for-content", cluster: "geo-fundamentals", title: "What is RAG, and why it matters for your content", keyword: "what is rag retrieval augmented generation", intent: "informational" },
  { slug: "zero-click-search-explained", cluster: "geo-fundamentals", title: "Zero-click search, explained", keyword: "zero click search", intent: "informational" },
  { slug: "how-ai-overviews-work", cluster: "geo-fundamentals", title: "How Google AI Overviews actually work", keyword: "how google ai overviews work", intent: "informational" },

  // ── AI engines ───────────────────────────────────────────────────
  { slug: "how-to-rank-in-chatgpt", cluster: "ai-engines", title: "How to get cited in ChatGPT", keyword: "how to rank in chatgpt", intent: "informational" },
  { slug: "how-to-rank-in-perplexity", cluster: "ai-engines", title: "How to rank in Perplexity", keyword: "how to rank in perplexity", intent: "informational" },
  { slug: "how-to-appear-in-google-ai-overviews", cluster: "ai-engines", title: "How to appear in Google AI Overviews", keyword: "how to appear in google ai overviews", intent: "informational" },
  { slug: "how-to-rank-in-gemini", cluster: "ai-engines", title: "How to get cited in Google Gemini", keyword: "how to rank in gemini", intent: "informational" },
  { slug: "how-to-rank-in-copilot", cluster: "ai-engines", title: "How to appear in Microsoft Copilot answers", keyword: "how to rank in microsoft copilot", intent: "informational" },
  { slug: "how-to-get-cited-by-claude", cluster: "ai-engines", title: "How to get cited by Claude", keyword: "how to get cited by claude ai", intent: "informational" },
  { slug: "chatgpt-search-optimization", cluster: "ai-engines", title: "ChatGPT Search optimization: a practical guide", keyword: "chatgpt search optimization", intent: "informational" },
  { slug: "what-content-perplexity-cites", cluster: "ai-engines", title: "What kind of content Perplexity cites most", keyword: "what content does perplexity cite", intent: "informational" },
  { slug: "gptbot-and-ai-crawlers", cluster: "ai-engines", title: "GPTBot and AI crawlers: what to allow and why", keyword: "gptbot ai crawlers robots txt", intent: "informational" },
  { slug: "how-ai-engines-pick-brands-to-recommend", cluster: "ai-engines", title: "How AI engines pick which brands to recommend", keyword: "how ai recommends brands", intent: "informational" },

  // ── Tactics ──────────────────────────────────────────────────────
  { slug: "structured-data-for-ai-search", cluster: "tactics", title: "Structured data (JSON-LD) for AI search", keyword: "structured data for ai search", intent: "informational" },
  { slug: "what-is-llms-txt", cluster: "tactics", title: "What is llms.txt, and do you need it?", keyword: "what is llms.txt", intent: "informational" },
  { slug: "answer-shaped-content", cluster: "tactics", title: "How to write answer-shaped content", keyword: "answer shaped content for ai", intent: "informational" },
  { slug: "entity-seo-explained", cluster: "tactics", title: "Entity SEO: how to be understood by AI", keyword: "entity seo", intent: "informational" },
  { slug: "eeat-for-ai-search", cluster: "tactics", title: "E-E-A-T for AI search: signals that earn citations", keyword: "eeat for ai search", intent: "informational" },
  { slug: "content-structure-for-ai-citations", cluster: "tactics", title: "How to structure content so AI cites it", keyword: "content structure for ai citations", intent: "informational" },
  { slug: "faq-schema-for-ai", cluster: "tactics", title: "FAQ schema for AI answers: when and how", keyword: "faq schema for ai", intent: "informational" },
  { slug: "how-to-write-a-tldr-that-gets-cited", cluster: "tactics", title: "How to write a TL;DR that gets cited", keyword: "tldr for ai citations", intent: "informational" },
  { slug: "statistics-and-original-data-for-geo", cluster: "tactics", title: "Why original data and statistics win AI citations", keyword: "original data for ai citations", intent: "informational" },
  { slug: "internal-linking-for-ai-search", cluster: "tactics", title: "Internal linking for AI search", keyword: "internal linking for ai search", intent: "informational" },
  { slug: "freshness-and-content-decay", cluster: "tactics", title: "Content freshness: how decay hurts AI visibility", keyword: "content freshness ai search", intent: "informational" },
  { slug: "topical-authority-for-geo", cluster: "tactics", title: "How to build topical authority for GEO", keyword: "topical authority", intent: "informational" },
  { slug: "schema-types-that-matter-for-ai", cluster: "tactics", title: "The schema types that matter most for AI", keyword: "best schema types for ai", intent: "informational" },
  { slug: "how-to-optimize-for-citations-not-clicks", cluster: "tactics", title: "Optimizing for citations, not just clicks", keyword: "optimize for ai citations", intent: "informational" },
  { slug: "page-speed-and-ai-crawlability", cluster: "tactics", title: "Page speed, rendering, and AI crawlability", keyword: "ai crawlability javascript rendering", intent: "informational" },
  { slug: "comparison-pages-that-get-cited", cluster: "tactics", title: "How to write comparison pages AI engines cite", keyword: "comparison pages for ai search", intent: "informational" },

  // ── Measurement ──────────────────────────────────────────────────
  { slug: "how-to-track-ai-citations", cluster: "measurement", title: "How to track AI citations of your brand", keyword: "how to track ai citations", intent: "informational" },
  { slug: "ai-share-of-voice", cluster: "measurement", title: "AI share of voice: how to measure it", keyword: "ai share of voice", intent: "informational" },
  { slug: "measuring-ai-search-traffic", cluster: "measurement", title: "How to measure traffic from AI search", keyword: "measure ai search traffic", intent: "informational" },
  { slug: "ai-bot-traffic-in-server-logs", cluster: "measurement", title: "Finding AI-bot traffic in your server logs", keyword: "ai bot traffic server logs", intent: "informational" },
  { slug: "geo-kpis-that-matter", cluster: "measurement", title: "The GEO KPIs that actually matter", keyword: "geo kpis metrics", intent: "informational" },
  { slug: "attributing-pipeline-to-ai-search", cluster: "measurement", title: "Attributing pipeline to AI search", keyword: "attribute revenue to ai search", intent: "informational" },
  { slug: "google-search-console-for-ai-overviews", cluster: "measurement", title: "Using Search Console to read AI Overview impact", keyword: "search console ai overviews", intent: "informational" },

  // ── SEO foundations ──────────────────────────────────────────────
  { slug: "technical-seo-checklist", cluster: "seo-foundations", title: "Technical SEO checklist for 2026", keyword: "technical seo checklist", intent: "informational" },
  { slug: "what-is-programmatic-seo", cluster: "seo-foundations", title: "What is programmatic SEO (done right)?", keyword: "programmatic seo", intent: "informational" },
  { slug: "keyword-research-for-ai-search", cluster: "seo-foundations", title: "Keyword research for the AI-search era", keyword: "keyword research for ai search", intent: "informational" },
  { slug: "search-intent-explained", cluster: "seo-foundations", title: "Search intent: the four types and how to match them", keyword: "search intent types", intent: "informational" },
  { slug: "content-refresh-strategy", cluster: "seo-foundations", title: "A content refresh strategy that holds rankings", keyword: "content refresh strategy", intent: "informational" },
  { slug: "backlinks-still-matter", cluster: "seo-foundations", title: "Do backlinks still matter for AI search?", keyword: "do backlinks matter ai search", intent: "informational" },
  { slug: "sitemaps-and-indexing", cluster: "seo-foundations", title: "Sitemaps and indexing: the fundamentals", keyword: "xml sitemap indexing", intent: "informational" },
  { slug: "canonical-tags-explained", cluster: "seo-foundations", title: "Canonical tags, explained simply", keyword: "canonical tags seo", intent: "informational" },
  { slug: "core-web-vitals-2026", cluster: "seo-foundations", title: "Core Web Vitals in 2026: what to fix first", keyword: "core web vitals", intent: "informational" },
  { slug: "duplicate-content-and-ai", cluster: "seo-foundations", title: "Duplicate content in the age of AI", keyword: "duplicate content seo", intent: "informational" },
  { slug: "long-tail-keywords-and-ai", cluster: "seo-foundations", title: "Long-tail keywords and conversational AI queries", keyword: "long tail keywords ai", intent: "informational" },

  // ── Conversion ───────────────────────────────────────────────────
  { slug: "turn-ai-traffic-into-leads", cluster: "conversion", title: "How to turn AI-search traffic into leads", keyword: "convert ai traffic to leads", intent: "informational" },
  { slug: "lead-capture-on-content-pages", cluster: "conversion", title: "Lead capture on content pages without killing UX", keyword: "lead capture content pages", intent: "informational" },
  { slug: "lead-scoring-basics", cluster: "conversion", title: "Lead scoring basics for inbound teams", keyword: "lead scoring basics", intent: "informational" },
  { slug: "cro-for-organic-landing-pages", cluster: "conversion", title: "CRO for organic landing pages", keyword: "cro organic landing pages", intent: "informational" },
  { slug: "intent-signals-from-ai-search", cluster: "conversion", title: "Reading buyer-intent signals from AI search", keyword: "buyer intent ai search", intent: "informational" },

  // ── Use cases ────────────────────────────────────────────────────
  { slug: "geo-for-saas", cluster: "use-cases", title: "GEO for SaaS: a practical playbook", keyword: "geo for saas", intent: "commercial" },
  { slug: "geo-for-b2b", cluster: "use-cases", title: "GEO for B2B: getting cited in considered purchases", keyword: "geo for b2b", intent: "commercial" },
  { slug: "geo-for-ecommerce", cluster: "use-cases", title: "GEO for ecommerce: products in AI answers", keyword: "geo for ecommerce", intent: "commercial" },
  { slug: "geo-for-local-business", cluster: "use-cases", title: "GEO for local business", keyword: "geo for local business", intent: "commercial" },
  { slug: "geo-for-agencies", cluster: "use-cases", title: "GEO for agencies: a new service line", keyword: "geo for agencies", intent: "commercial" },
  { slug: "geo-for-startups", cluster: "use-cases", title: "GEO for startups on a budget", keyword: "geo for startups", intent: "commercial" },
  { slug: "geo-for-healthcare", cluster: "use-cases", title: "GEO for healthcare and YMYL topics", keyword: "geo for healthcare ymyl", intent: "commercial" },
  { slug: "geo-for-fintech", cluster: "use-cases", title: "GEO for fintech", keyword: "geo for fintech", intent: "commercial" },

  // ── Comparisons ──────────────────────────────────────────────────
  { slug: "geo-vs-aeo-vs-seo", cluster: "comparisons", title: "GEO vs AEO vs SEO: a clear breakdown", keyword: "geo vs aeo vs seo", intent: "comparison" },
  { slug: "ai-overviews-vs-featured-snippets", cluster: "comparisons", title: "AI Overviews vs featured snippets", keyword: "ai overviews vs featured snippets", intent: "comparison" },
  { slug: "chatgpt-vs-perplexity-for-search", cluster: "comparisons", title: "ChatGPT vs Perplexity for search visibility", keyword: "chatgpt vs perplexity search", intent: "comparison" },
];

/** Resolve a topic by slug. */
export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function topicsByCluster(cluster: Cluster): Topic[] {
  return TOPICS.filter((t) => t.cluster === cluster);
}
