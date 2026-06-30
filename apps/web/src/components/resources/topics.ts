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

  // ── Batch: advanced tactics + tools (71 → 100) ──────────────────────
  { slug: "how-to-get-cited-in-ai-answers", cluster: "tactics", title: "How to get cited in AI answers: the complete guide", keyword: "how to get cited in ai answers", intent: "informational" },
  { slug: "heading-structure-for-seo-and-ai", cluster: "tactics", title: "Heading structure for SEO and AI extraction", keyword: "heading structure seo", intent: "informational" },
  { slug: "how-to-use-tables-for-ai-extraction", cluster: "tactics", title: "Using tables and lists so AI can extract your data", keyword: "tables lists ai extraction", intent: "informational" },
  { slug: "image-seo-and-alt-text-for-ai", cluster: "tactics", title: "Image SEO and alt text in the AI era", keyword: "image seo alt text ai", intent: "informational" },
  { slug: "content-clusters-and-pillar-pages", cluster: "tactics", title: "Content clusters and pillar pages for topical authority", keyword: "content clusters pillar pages", intent: "informational" },
  { slug: "how-to-optimize-for-google-ai-mode", cluster: "ai-engines", title: "How to optimize for Google AI Mode", keyword: "google ai mode optimization", intent: "informational" },
  { slug: "multilingual-geo", cluster: "tactics", title: "Multilingual GEO: getting cited across languages", keyword: "multilingual geo", intent: "informational" },
  { slug: "meta-descriptions-for-ai-search", cluster: "tactics", title: "Do meta descriptions matter for AI search?", keyword: "meta descriptions ai search", intent: "informational" },
  { slug: "how-to-make-content-quotable", cluster: "tactics", title: "How to make your content quotable by AI", keyword: "quotable content for ai", intent: "informational" },
  { slug: "best-geo-tools", cluster: "measurement", title: "The best GEO tools in 2026 (and what to look for)", keyword: "best geo tools", intent: "commercial" },
  { slug: "how-to-audit-your-ai-visibility", cluster: "measurement", title: "How to audit your AI visibility", keyword: "ai visibility audit", intent: "informational" },
  { slug: "how-to-set-up-ai-citation-monitoring", cluster: "measurement", title: "How to set up AI citation monitoring", keyword: "ai citation monitoring", intent: "informational" },
  { slug: "robots-txt-for-ai-crawlers", cluster: "tactics", title: "robots.txt for AI crawlers: a configuration guide", keyword: "robots txt ai crawlers", intent: "informational" },
  { slug: "schema-markup-mistakes", cluster: "tactics", title: "Common schema markup mistakes that cost citations", keyword: "schema markup mistakes", intent: "informational" },
  { slug: "how-often-to-publish-for-geo", cluster: "tactics", title: "How often should you publish for GEO?", keyword: "how often to publish geo", intent: "informational" },

  // ── Batch: verticals + decisions + strategy (71 → 100) ──────────────
  { slug: "geo-for-marketplaces", cluster: "use-cases", title: "GEO for marketplaces", keyword: "geo for marketplaces", intent: "commercial" },
  { slug: "geo-for-d2c-brands", cluster: "use-cases", title: "GEO for D2C brands", keyword: "geo for d2c brands", intent: "commercial" },
  { slug: "geo-for-professional-services", cluster: "use-cases", title: "GEO for professional services firms", keyword: "geo for professional services", intent: "commercial" },
  { slug: "geo-for-real-estate", cluster: "use-cases", title: "GEO for real estate", keyword: "geo for real estate", intent: "commercial" },
  { slug: "geo-for-education", cluster: "use-cases", title: "GEO for education and edtech", keyword: "geo for education edtech", intent: "commercial" },
  { slug: "geo-for-publishers", cluster: "use-cases", title: "GEO for content publishers and media", keyword: "geo for publishers media", intent: "commercial" },
  { slug: "geo-for-marketing-teams", cluster: "use-cases", title: "GEO for in-house marketing teams", keyword: "geo for marketing teams", intent: "commercial" },
  { slug: "geo-for-founders", cluster: "use-cases", title: "GEO for founders doing it themselves", keyword: "geo for founders", intent: "commercial" },
  { slug: "geo-for-nonprofits", cluster: "use-cases", title: "GEO for nonprofits", keyword: "geo for nonprofits", intent: "commercial" },
  { slug: "in-house-vs-agency-for-geo", cluster: "comparisons", title: "In-house vs agency for GEO", keyword: "in-house vs agency geo", intent: "comparison" },
  { slug: "geo-platform-vs-manual", cluster: "comparisons", title: "GEO platform vs doing it manually", keyword: "geo platform vs manual", intent: "comparison" },
  { slug: "geo-vs-content-marketing", cluster: "comparisons", title: "GEO vs traditional content marketing", keyword: "geo vs content marketing", intent: "comparison" },
  { slug: "building-a-geo-content-strategy", cluster: "tactics", title: "How to build a GEO content strategy", keyword: "geo content strategy", intent: "informational" },
  { slug: "how-to-prioritize-geo-topics", cluster: "tactics", title: "How to prioritize which GEO topics to target", keyword: "prioritize geo topics", intent: "informational" },
  { slug: "geo-content-calendar", cluster: "tactics", title: "Building a GEO content calendar", keyword: "geo content calendar", intent: "informational" },

  // ── Batch: industry verticals + buyer questions (101 → 113) ─────────
  { slug: "geo-for-law-firms", cluster: "use-cases", title: "GEO for law firms: an AI-citation playbook", keyword: "geo for law firms", intent: "commercial" },
  { slug: "geo-for-insurance", cluster: "use-cases", title: "GEO for insurance: getting cited in AI answers", keyword: "geo for insurance", intent: "commercial" },
  { slug: "geo-for-travel-and-hospitality", cluster: "use-cases", title: "GEO for travel and hospitality", keyword: "geo for travel hospitality", intent: "commercial" },
  { slug: "geo-for-recruiting-and-hr", cluster: "use-cases", title: "GEO for recruiting and HR tech", keyword: "geo for recruiting hr", intent: "commercial" },
  { slug: "geo-for-developer-tools", cluster: "use-cases", title: "GEO for developer tools and APIs", keyword: "geo for developer tools", intent: "commercial" },
  { slug: "geo-for-consultants", cluster: "use-cases", title: "GEO for independent consultants", keyword: "geo for consultants", intent: "commercial" },
  { slug: "does-geo-work-for-small-businesses", cluster: "geo-fundamentals", title: "Does GEO work for small businesses?", keyword: "does geo work for small business", intent: "commercial" },
  { slug: "how-long-does-geo-take-to-work", cluster: "geo-fundamentals", title: "How long does GEO take to show results?", keyword: "how long does geo take to work", intent: "informational" },
  { slug: "is-geo-worth-it", cluster: "geo-fundamentals", title: "Is GEO worth it? An honest assessment", keyword: "is geo worth it", intent: "commercial" },
  { slug: "can-you-do-geo-without-a-blog", cluster: "tactics", title: "Can you do GEO without a blog?", keyword: "geo without a blog", intent: "informational" },
  { slug: "how-much-content-do-you-need-for-geo", cluster: "tactics", title: "How much content do you need for GEO?", keyword: "how much content for geo", intent: "informational" },
  { slug: "what-pages-should-you-optimize-first-for-geo", cluster: "tactics", title: "Which pages to optimize first for GEO", keyword: "what pages to optimize first for geo", intent: "informational" },

  // ── Batch: advanced GEO + content workflow (114 → 119) ──────────────
  { slug: "the-geo-content-workflow", cluster: "tactics", title: "The GEO content workflow: research to measurement", keyword: "geo content workflow", intent: "informational" },
  { slug: "how-to-write-a-geo-content-brief", cluster: "tactics", title: "How to write a GEO content brief", keyword: "geo content brief", intent: "informational" },
  { slug: "how-to-run-a-geo-content-audit", cluster: "measurement", title: "How to run a GEO content audit", keyword: "geo content audit", intent: "informational" },
  { slug: "repurposing-content-for-ai-search", cluster: "tactics", title: "Repurposing existing content for AI search", keyword: "repurposing content for ai search", intent: "informational" },
  { slug: "competitive-geo-analysis", cluster: "measurement", title: "Competitive GEO analysis: why rivals get cited", keyword: "competitive geo analysis", intent: "informational" },

  // ── Batch: GEO program operations (119 → 125) ───────────────────────
  { slug: "digital-pr-for-geo", cluster: "tactics", title: "Digital PR for GEO: earning AI citations off-page", keyword: "digital pr for geo", intent: "informational" },
  { slug: "geo-experimentation-and-testing", cluster: "measurement", title: "GEO experimentation and testing", keyword: "geo experimentation testing", intent: "informational" },
  { slug: "site-migrations-without-losing-ai-citations", cluster: "seo-foundations", title: "Site migrations without losing AI citations", keyword: "site migration ai citations", intent: "informational" },
  { slug: "reporting-geo-results-to-executives", cluster: "measurement", title: "Reporting GEO results to executives", keyword: "reporting geo results", intent: "informational" },
  { slug: "scaling-geo-content-without-thin-pages", cluster: "tactics", title: "Scaling GEO content without thin pages", keyword: "scaling geo content", intent: "informational" },
  { slug: "building-a-geo-team", cluster: "tactics", title: "Building a GEO team: roles and ownership", keyword: "building a geo team", intent: "commercial" },

  // ── Batch: industry verticals, wave 3 (125 → 135) ───────────────────
  { slug: "geo-for-home-services", cluster: "use-cases", title: "GEO for home services (HVAC, plumbing, electrical)", keyword: "geo for home services", intent: "commercial" },
  { slug: "geo-for-restaurants", cluster: "use-cases", title: "GEO for restaurants", keyword: "geo for restaurants", intent: "commercial" },
  { slug: "geo-for-dental-practices", cluster: "use-cases", title: "GEO for dental practices", keyword: "geo for dental practices", intent: "commercial" },
  { slug: "geo-for-accounting-firms", cluster: "use-cases", title: "GEO for accounting firms and CPAs", keyword: "geo for accounting firms", intent: "commercial" },
  { slug: "geo-for-manufacturers", cluster: "use-cases", title: "GEO for manufacturers and industrial B2B", keyword: "geo for manufacturers", intent: "commercial" },
  { slug: "geo-for-automotive", cluster: "use-cases", title: "GEO for automotive (dealers and auto services)", keyword: "geo for automotive", intent: "commercial" },
  { slug: "geo-for-cybersecurity", cluster: "use-cases", title: "GEO for cybersecurity companies", keyword: "geo for cybersecurity", intent: "commercial" },
  { slug: "geo-for-financial-advisors", cluster: "use-cases", title: "GEO for financial advisors and wealth management", keyword: "geo for financial advisors", intent: "commercial" },
  { slug: "geo-for-fitness-studios", cluster: "use-cases", title: "GEO for fitness studios and gyms", keyword: "geo for fitness studios", intent: "commercial" },
  { slug: "geo-for-course-creators", cluster: "use-cases", title: "GEO for course creators and online education", keyword: "geo for course creators", intent: "commercial" },
];

/** Resolve a topic by slug. */
export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function topicsByCluster(cluster: Cluster): Topic[] {
  return TOPICS.filter((t) => t.cluster === cluster);
}
