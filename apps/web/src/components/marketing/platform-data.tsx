import {
  BrainCircuit,
  FileText,
  Inbox,
  BarChart3,
  Rss,
  Link2,
  Bot,
  Target,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

/** A platform/solution page — drives both the mega-menu and the [slug] page template. */
export interface FeaturePageData {
  slug: string;
  /** Short nav label + tagline shown in the mega-menu. */
  label: string;
  tagline: string;
  icon: LucideIcon;
  kind: "platform" | "solutions";
  comingSoon?: boolean;
  /** Page content. */
  eyebrow: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  problem: { title: string; body: string };
  steps: { title: string; body: string }[];
  capabilities: string[];
  /** Which ProductDemo tab to feature (platform pages). */
  demoTab?: "brand" | "discover" | "pages" | "leads";
  /** Cross-link slugs (kind:slug). */
  related: string[];
}

export const PLATFORM: FeaturePageData[] = [
  {
    slug: "brand-memory",
    label: "Brand Memory",
    tagline: "One source of truth for everything AI needs to know about you",
    icon: BrainCircuit,
    kind: "platform",
    eyebrow: "Platform · Brand Memory",
    title: "One source of truth for the AI era.",
    subtitle:
      "Brand Memory is a structured profile of your business — products, audience, proof, and voice — that grounds every page and answer GEOSEO generates, so nothing is ever fabricated.",
    metaTitle: "Brand Memory — grounded AI content | GEOSEO",
    metaDescription:
      "Brand Memory is a structured source of truth — products, personas, proof, and voice — extracted from your site to ground every page GEOSEO generates. No fabricated claims.",
    problem: {
      title: "AI writes confidently — and wrongly.",
      body: "Without a grounded source of truth, generated content invents claims, drifts off-brand, and erodes the trust you spent years building. Brand Memory fixes the root cause.",
    },
    steps: [
      { title: "Scan your site", body: "We read your public pages and extract what your business actually is — no manual data entry." },
      { title: "Structure it", body: "Products, buyer personas, proof points, terminology, and tone of voice become a structured, reviewable profile." },
      { title: "Review & refine", body: "You confirm and edit the draft. It stays versioned, so you can see and roll back every change." },
      { title: "Ground everything", body: "Every page, follow-up, and answer the engine produces pulls from Brand Memory — accurate and on-brand by default." },
    ],
    capabilities: [
      "Auto-extracted from your website",
      "Products, personas & proof points",
      "Tone-of-voice capture",
      "Competitor context",
      "Editable & versioned",
      "Powers page-gen, leads & outreach",
    ],
    demoTab: "brand",
    related: ["platform:page-engine", "solutions:ai-search"],
  },
  {
    slug: "page-engine",
    label: "Page Engine",
    tagline: "Content & landing pages built for AI bots and human visitors",
    icon: FileText,
    kind: "platform",
    eyebrow: "Platform · Page Engine",
    title: "From a topic to a published, optimized page in minutes.",
    subtitle:
      "Research a buyer-intent topic, draft a GEO + SEO page grounded in Brand Memory, and publish to your CMS — with structured data, sitemap, and llms.txt generated automatically.",
    metaTitle: "Page Creation Engine — automated SEO + GEO pages | GEOSEO",
    metaDescription:
      "Generate and publish GEO + SEO pages grounded in Brand Memory — with JSON-LD, sitemap, and llms.txt — to WordPress, Webflow, Shopify, or a managed subdirectory.",
    problem: {
      title: "Content can't keep up with modern search.",
      body: "Teams can't produce the volume search demands — and one-off pages miss the structured signals AI engines need to cite you. The Page Engine makes both effortless.",
    },
    steps: [
      { title: "Pick a topic", body: "Choose a discovered buyer-intent opportunity, or bring your own." },
      { title: "Generate", body: "A grounded draft with per-type structure, FAQ schema, and JSON-LD — written from your real facts." },
      { title: "Review in place", body: "See keyword coverage, edit, and rewrite-with-keywords before anything ships." },
      { title: "Publish anywhere", body: "One click to WordPress, Webflow, Shopify, or a managed subdirectory — sitemap and llms.txt update automatically." },
    ],
    capabilities: [
      "Per-page-type generation",
      "Structured data + FAQ schema",
      "Keyword-coverage review",
      "Version history & rollback",
      "One-click multi-CMS publish",
      "Auto sitemap + llms.txt",
    ],
    demoTab: "pages",
    related: ["platform:brand-memory", "platform:ai-feed"],
  },
  {
    slug: "leads",
    label: "Leads",
    tagline: "See every visitor, auto-filter spam, get alerted to leads that matter",
    icon: Inbox,
    kind: "platform",
    eyebrow: "Platform · Leads",
    title: "Every visitor, scored and routed.",
    subtitle:
      "See every visitor your pages attract, auto-filter spam, score by fit and intent, and route only the leads that matter — straight to the right person on your team.",
    metaTitle: "Leads Dashboard — score & route inbound leads | GEOSEO",
    metaDescription:
      "Capture visitors from every page, filter spam, score by fit and intent with explainable reasons, route by rules, and follow up with AI-drafted emails. CRM sync included.",
    problem: {
      title: "Traffic isn't pipeline.",
      body: "Most analytics show you numbers, not the named, qualified people ready to talk. The Leads dashboard turns page visitors into a prioritized, actionable inbox.",
    },
    steps: [
      { title: "Capture", body: "Lead forms on every published page, tied to the visitor's journey." },
      { title: "Score", body: "Fit, intent, and engagement combine into an explainable score — you see why." },
      { title: "Route", body: "Rules assign each lead to the right owner automatically." },
      { title: "Follow up", body: "AI-drafted, brand-grounded follow-ups; sync qualified leads to your CRM." },
    ],
    capabilities: [
      "Visitor journey tracking",
      "Explainable lead scoring",
      "Automatic spam filtering",
      "Routing rules & assignment",
      "AI follow-up drafts",
      "CRM sync",
    ],
    demoTab: "leads",
    related: ["solutions:lead-conversion", "platform:analytics"],
  },
  {
    slug: "analytics",
    label: "Analytics",
    tagline: "Track everything AI bots and human visitors do on your site",
    icon: BarChart3,
    kind: "platform",
    eyebrow: "Platform · Analytics",
    title: "Rankings and AI citations, in one place.",
    subtitle:
      "Track what AI bots and human visitors do — search rankings, AI-engine citations, page-level ROI, and the leads each page produces — so you always know what to fix next.",
    metaTitle: "Analytics — AI citations + SEO performance | GEOSEO",
    metaDescription:
      "Track AI-engine citations, search rankings, AI-bot crawls, and page-level ROI with lead attribution — the visibility Google Analytics can't show you.",
    problem: {
      title: "AI visibility is invisible in your analytics.",
      body: "You can't improve what you can't see being cited. GEOSEO surfaces AI-engine citations and bot activity alongside classic SEO performance.",
    },
    steps: [
      { title: "Connect", body: "Link Search Console and the page tracker — honest 'connect a source' states until you do." },
      { title: "Track", body: "Ranks, impressions, clicks, and AI-bot crawls (GPTBot, PerplexityBot, and more)." },
      { title: "Attribute", body: "Tie each page to the leads and pipeline it produces." },
      { title: "Act", body: "See the highest-leverage fix and send it to the Page Engine." },
    ],
    capabilities: [
      "AI-citation tracking",
      "Rank & impression trends",
      "AI-bot crawl analytics",
      "Page-level ROI",
      "Lead attribution",
      "Honest connect-your-data states",
    ],
    demoTab: "discover",
    related: ["platform:ai-feed", "platform:leads"],
  },
  {
    slug: "ai-feed",
    label: "AI Feed",
    tagline: "Your website's protocol for the AI era",
    icon: Rss,
    kind: "platform",
    eyebrow: "Platform · AI Feed",
    title: "Your website's protocol for the AI era.",
    subtitle:
      "A clean, fast, machine-readable surface — JSON-LD, llms.txt, and answer-shaped content — that makes your pages easy for AI engines to read, trust, and cite.",
    metaTitle: "AI Feed — make your site readable to AI engines | GEOSEO",
    metaDescription:
      "The AI Feed publishes fast, structured pages with JSON-LD and llms.txt so AI crawlers can read and cite you — plus bot-hit tracking to prove it's working.",
    problem: {
      title: "AI crawlers can't read a JS-heavy site.",
      body: "If GPTBot and PerplexityBot can't parse your pages cleanly, they won't cite you. The AI Feed gives them a structured surface built for exactly this.",
    },
    steps: [
      { title: "Publish", body: "Pages land on a fast, structured public feed rendered in your brand theme." },
      { title: "Expose", body: "An llms.txt index and sitemap make every page discoverable to AI crawlers." },
      { title: "Get crawled", body: "We classify and track AI-bot hits so you can see who's reading you." },
      { title: "Get cited", body: "Clean structure + answer-shaped content is what earns the citation." },
    ],
    capabilities: [
      "Fast, structured public pages",
      "JSON-LD on every page",
      "llms.txt for AI crawlers",
      "AI-bot hit tracking",
      "Canonical + schema",
      "Native-theme rendering",
    ],
    demoTab: "pages",
    related: ["platform:page-engine", "platform:analytics"],
  },
  {
    slug: "content-authority",
    label: "Content & Authority",
    tagline: "Backlinks, content refreshes, and optimizations on autopilot",
    icon: Link2,
    kind: "platform",
    eyebrow: "Platform · Content & Authority",
    title: "Backlinks, refreshes, and optimizations on autopilot.",
    subtitle:
      "Plugs into any site. Continuously find backlink opportunities, refresh aging pages, and run the optimizations that compound authority over time.",
    metaTitle: "Content & Authority — backlinks + refreshes on autopilot | GEOSEO",
    metaDescription:
      "Discover backlink opportunities, analyze competitors, draft outreach, and auto-refresh aging pages — the continuous SEO work that compounds domain authority.",
    problem: {
      title: "SEO isn't a one-time project.",
      body: "Rankings decay, competitors move, and manual upkeep doesn't scale. GEOSEO runs the compounding authority work continuously, in the background.",
    },
    steps: [
      { title: "Audit", body: "Baseline your authority, content health, and competitor gaps." },
      { title: "Discover", body: "Surface backlink prospects and pages due for a refresh." },
      { title: "Outreach", body: "AI-drafted, brand-grounded outreach for link opportunities." },
      { title: "Refresh", body: "Auto re-draft aging pages so they keep ranking." },
    ],
    capabilities: [
      "Backlink opportunity discovery",
      "Competitor intelligence",
      "Outreach drafting",
      "Content-refresh recommendations",
      "Authority scoring",
      "Works on any CMS",
    ],
    demoTab: "discover",
    related: ["platform:analytics", "solutions:ai-search"],
  },
];

export const SOLUTIONS: FeaturePageData[] = [
  {
    slug: "ai-search",
    label: "AI Search Agent",
    tagline: "Get qualified leads from AI search engines",
    icon: Bot,
    kind: "solutions",
    eyebrow: "Solution · AI Search",
    title: "Get qualified leads from AI search engines.",
    subtitle:
      "Be the brand ChatGPT, Perplexity, and Google AI Overviews recommend — then turn that visibility into real pipeline.",
    metaTitle: "AI Search Agent — get cited & convert in AI search | GEOSEO",
    metaDescription:
      "Win the answer in ChatGPT, Perplexity, and AI Overviews: Brand Memory grounding, cited-ready pages, AI-citation tracking, and built-in lead capture.",
    problem: {
      title: "Your buyers ask AI before they search.",
      body: "AI answers collapse the results page into one cited source. If you're not that source, you're invisible — no matter how good your product is.",
    },
    steps: [
      { title: "Build Brand Memory", body: "Ground the engine in your real business so answers are accurate." },
      { title: "Generate cited-ready pages", body: "Structured, answer-shaped content engineered to be the source." },
      { title: "Get crawled & cited", body: "Publish to the AI Feed and track citations across engines." },
      { title: "Capture the leads", body: "Convert the visibility into scored, routed pipeline." },
    ],
    capabilities: [
      "GEO-optimized pages",
      "AI-citation tracking",
      "Answer-shaped content",
      "Multi-engine coverage",
      "Built-in lead capture",
      "Honest measurement",
    ],
    related: ["platform:brand-memory", "platform:page-engine", "solutions:lead-conversion"],
  },
  {
    slug: "lead-conversion",
    label: "Lead Conversion",
    tagline: "Turn more visitors into qualified conversations",
    icon: Target,
    kind: "solutions",
    eyebrow: "Solution · Lead Conversion",
    title: "Turn more visitors into qualified conversations.",
    subtitle:
      "Capture, score, and follow up with the visitors your content attracts — so more of them become real conversations with your team.",
    metaTitle: "Lead Conversion — capture, score & follow up | GEOSEO",
    metaDescription:
      "Convert page visitors into pipeline: journey tracking, explainable scoring, routing rules, AI-drafted follow-ups, a conversion audit, and CRM sync.",
    problem: {
      title: "Most visitors leave without a trace.",
      body: "Without capture, scoring, and fast follow-up, hard-won traffic never becomes pipeline. Lead Conversion closes that gap end-to-end.",
    },
    steps: [
      { title: "Capture", body: "Forms on every page, tied to each visitor's journey." },
      { title: "Score", body: "Explainable fit + intent scoring ranks who's worth your time." },
      { title: "Route", body: "Rules send each lead to the right owner instantly." },
      { title: "Follow up", body: "AI-drafted, on-brand follow-ups; sync to your CRM." },
    ],
    capabilities: [
      "Lead capture forms",
      "Explainable scoring",
      "Routing & assignment",
      "AI follow-up drafts",
      "Conversion audit",
      "CRM sync",
    ],
    related: ["platform:leads", "solutions:ai-search"],
  },
  {
    slug: "paid-boost",
    label: "Paid Boost",
    tagline: "Generate qualified leads from paid campaigns",
    icon: Megaphone,
    kind: "solutions",
    comingSoon: true,
    eyebrow: "Solution · Paid Boost",
    title: "Qualified leads from paid — coming soon.",
    subtitle:
      "We're extending the same Brand Memory and lead engine to paid campaigns, so your ads convert as well as your organic pages. Join the waitlist to get early access.",
    metaTitle: "Paid Boost (coming soon) — qualified leads from paid | GEOSEO",
    metaDescription:
      "Paid Boost is on the GEOSEO roadmap: bring Brand Memory grounding and the lead engine to paid campaigns. Join the waitlist for early access.",
    problem: {
      title: "Paid traffic deserves the same engine.",
      body: "Ads send expensive clicks to pages that aren't grounded or built to convert. Paid Boost will bring GEOSEO's grounding and lead engine to paid — without a separate tool.",
    },
    steps: [
      { title: "Ground", body: "Reuse Brand Memory so paid landing pages stay accurate and on-brand." },
      { title: "Generate", body: "Spin up campaign-specific, conversion-optimized landing pages." },
      { title: "Capture", body: "The same scoring, routing, and follow-up as your organic leads." },
      { title: "Measure", body: "One view of paid + organic pipeline." },
    ],
    capabilities: [
      "Campaign landing pages",
      "Brand-grounded copy",
      "Shared lead scoring",
      "Unified paid + organic view",
      "Conversion-first templates",
      "On the roadmap",
    ],
    related: ["solutions:lead-conversion", "platform:leads"],
  },
];

export const ALL_FEATURE_PAGES: FeaturePageData[] = [...PLATFORM, ...SOLUTIONS];

export function getFeature(kind: "platform" | "solutions", slug: string): FeaturePageData | undefined {
  return (kind === "platform" ? PLATFORM : SOLUTIONS).find((f) => f.slug === slug);
}

export function featureHref(f: { kind: "platform" | "solutions"; slug: string }): string {
  return `/${f.kind}/${f.slug}`;
}

/** Resolve a "kind:slug" related ref to its page data. */
export function resolveRelated(ref: string): FeaturePageData | undefined {
  const [kind, slug] = ref.split(":");
  return getFeature(kind as "platform" | "solutions", slug);
}
