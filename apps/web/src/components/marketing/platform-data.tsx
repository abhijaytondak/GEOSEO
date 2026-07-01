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
import type { Block } from "./feature-sections";

/** A platform/solution page — drives the mega-menu (label/tagline/icon) and the
 *  [slug] page (hero from eyebrow/title/subtitle; body from the per-product `sections`). */
export interface FeaturePageData {
  slug: string;
  label: string;
  tagline: string;
  icon: LucideIcon;
  kind: "platform" | "solutions";
  comingSoon?: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  /** Ordered, product-specific page structure — varies per product. */
  sections: Block[];
  /** Cross-link slugs ("kind:slug"). */
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
      "Brand Memory is a structured profile of your business — products, audience, proof, and voice — that grounds every page and answer Citensity generates, so nothing is ever fabricated.",
    metaTitle: "Brand Memory — grounded AI content | Citensity",
    metaDescription:
      "Brand Memory is a structured source of truth — products, personas, proof, and voice — extracted from your site to ground every page Citensity generates. No fabricated claims.",
    sections: [
      {
        kind: "callout",
        title: "AI writes confidently — and wrongly.",
        body: "Without a grounded source of truth, generated content invents claims, drifts off-brand, and erodes the trust you spent years building. Brand Memory fixes that at the root: every word the engine writes traces back to a fact you approved.",
      },
      {
        kind: "split",
        eyebrow: "What's inside",
        title: "Your business, structured.",
        body: "We turn your public site into a reviewable profile the engine can reason over — not a vague prompt, but concrete facts with provenance.",
        bullets: [
          "Brand identity & value proposition",
          "Products and services you actually sell",
          "Buyer personas with their pains and goals",
          "Proof points — stats, case studies, awards",
          "Tone of voice and terminology to match",
        ],
      },
      {
        kind: "steps",
        title: "How Brand Memory is built",
        items: [
          { title: "Scan your site", body: "We read your public pages and extract what your business actually is — no manual data entry." },
          { title: "Structure it", body: "Products, personas, proof points, terminology, and tone become a structured, reviewable profile." },
          { title: "Review & refine", body: "You confirm and edit the draft. It's versioned, so you can see and roll back every change." },
          { title: "Ground everything", body: "Every page, follow-up, and answer pulls from Brand Memory — accurate and on-brand by default." },
        ],
      },
      { kind: "demo", tab: "brand", title: "A living profile, not a static brief" },
      {
        kind: "checklist",
        eyebrow: "Capabilities",
        title: "Grounded, not guessed.",
        items: [
          "Auto-extracted from your website",
          "Products, personas & proof points",
          "Tone-of-voice capture",
          "Competitor context",
          "Editable & fully versioned",
          "Powers page-gen, leads & outreach",
        ],
      },
    ],
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
    metaTitle: "Page Creation Engine — automated SEO + GEO pages | Citensity",
    metaDescription:
      "Generate and publish GEO + SEO pages grounded in Brand Memory — with JSON-LD, sitemap, and llms.txt — to WordPress, Webflow, Shopify, or a managed subdirectory.",
    sections: [
      {
        kind: "callout",
        title: "Content can't keep up with modern search.",
        body: "Teams can't produce the volume search demands — and one-off pages miss the structured signals AI engines need to cite you. The Page Engine makes both effortless, without sacrificing accuracy.",
      },
      {
        kind: "pipeline",
        title: "One continuous pipeline",
        subtitle: "Every stage runs grounded in your Brand Memory — not a generic prompt.",
        steps: ["Research", "Blueprint", "Draft", "Review", "Publish"],
      },
      {
        kind: "split",
        eyebrow: "Built for the answer",
        title: "Every page type, done right.",
        body: "Comparisons, guides, landing pages, and FAQs each get the structure, schema, and depth their intent demands — not a single flattened template.",
        bullets: [
          "Per-page-type generation (guide, comparison, landing, FAQ)",
          "JSON-LD + FAQ schema on every page",
          "Answer-shaped sections engineered to be cited",
          "Keyword-coverage review before you ship",
          "Version history and one-click rollback",
        ],
      },
      { kind: "demo", tab: "pages", title: "Research → review → publish, in one place" },
      {
        kind: "split",
        flip: true,
        eyebrow: "Publish anywhere",
        title: "It ships to your real site.",
        body: "One click pushes the page to your CMS — or a managed subdirectory if you don't have one — and updates the machine-readable surface AI crawlers rely on.",
        bullets: [
          "WordPress, Webflow & Shopify adapters",
          "Managed subdirectory — no developer needed",
          "Sitemap.xml updated automatically",
          "llms.txt entry so AI engines can find it",
          "Native-theme rendering in your brand",
        ],
      },
      {
        kind: "checklist",
        eyebrow: "Capabilities",
        title: "An engine, not a generator.",
        items: [
          "Per-page-type generation",
          "Structured data + FAQ schema",
          "Keyword-coverage review",
          "Version history & rollback",
          "One-click multi-CMS publish",
          "Auto sitemap + llms.txt",
        ],
      },
    ],
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
    metaTitle: "Leads Dashboard — score & route inbound leads | Citensity",
    metaDescription:
      "Capture visitors from every page, filter spam, score by fit and intent with explainable reasons, route by rules, and follow up with AI-drafted emails. CRM sync included.",
    sections: [
      {
        kind: "callout",
        title: "Traffic isn't pipeline.",
        body: "Most analytics show you numbers, not the named, qualified people ready to talk. The Leads dashboard turns page visitors into a prioritized, actionable inbox — with the reasoning attached.",
      },
      {
        kind: "split",
        eyebrow: "Explainable scoring",
        title: "Know who's worth your time — and why.",
        body: "Every lead gets a transparent score from three signals, so your team trusts it instead of second-guessing it.",
        bullets: [
          "Fit — how well they match your ideal customer",
          "Intent — what their behavior signals",
          "Engagement — how deeply they've explored",
          "Spam risk — filtered out automatically",
          "A plain-English 'why this score' for every lead",
        ],
      },
      {
        kind: "funnel",
        title: "Traffic in, qualified pipeline out.",
        subtitle: "Spam and tire-kickers fall away — your team sees only the conversations worth having.",
        stages: [
          { label: "Visitors captured", value: "100%", pct: 100 },
          { label: "Real (spam filtered)", value: "62%", pct: 74 },
          { label: "Scored & routed", value: "38%", pct: 52 },
          { label: "Qualified — ready to talk", value: "19%", pct: 34 },
        ],
      },
      {
        kind: "steps",
        title: "From visitor to conversation",
        items: [
          { title: "Capture", body: "Lead forms on every published page, tied to the visitor's full journey." },
          { title: "Score", body: "Fit, intent, and engagement combine into an explainable score." },
          { title: "Route", body: "Rules assign each lead to the right owner automatically." },
          { title: "Follow up", body: "AI-drafted, brand-grounded follow-ups; sync qualified leads to your CRM." },
        ],
      },
      { kind: "demo", tab: "leads", title: "A prioritized inbox, not a spreadsheet" },
      {
        kind: "checklist",
        eyebrow: "Capabilities",
        title: "Turn pages into pipeline.",
        items: [
          "Visitor journey tracking",
          "Explainable lead scoring",
          "Automatic spam filtering",
          "Routing rules & assignment",
          "AI follow-up drafts",
          "CRM sync",
        ],
      },
    ],
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
    metaTitle: "Analytics — AI citations + SEO performance | Citensity",
    metaDescription:
      "Track AI-engine citations, search rankings, AI-bot crawls, and page-level ROI with lead attribution — the visibility Google Analytics can't show you.",
    sections: [
      {
        kind: "callout",
        title: "AI visibility is invisible in your analytics.",
        body: "You can't improve what you can't see being cited. Citensity surfaces AI-engine citations and bot activity alongside classic SEO performance — and ties it all to pipeline.",
      },
      {
        kind: "split",
        eyebrow: "Finally measurable",
        title: "The metrics the AI era added.",
        body: "Classic analytics stops at the click. Citensity tracks the layer above it — who's citing you, which bots are reading you, and what it's worth.",
        bullets: [
          "AI-engine citations across ChatGPT, Perplexity & more",
          "AI-bot crawls (GPTBot, PerplexityBot, Google-Extended)",
          "Search ranks, impressions & clicks",
          "Page-level ROI with lead attribution",
          "Honest 'connect a source' states — never fake numbers",
        ],
      },
      { kind: "demo", tab: "discover", title: "One view, from crawl to closed lead" },
      {
        kind: "steps",
        title: "How measurement works",
        items: [
          { title: "Connect", body: "Link Search Console and the page tracker — clear 'connect a source' states until you do." },
          { title: "Track", body: "Ranks, impressions, clicks, and AI-bot crawls, updated continuously." },
          { title: "Attribute", body: "Tie each page to the leads and pipeline it produces." },
          { title: "Act", body: "See the highest-leverage fix and send it straight to the Page Engine." },
        ],
      },
      {
        kind: "checklist",
        eyebrow: "Capabilities",
        title: "Measurement you can act on.",
        items: [
          "AI-citation tracking",
          "Rank & impression trends",
          "AI-bot crawl analytics",
          "Page-level ROI",
          "Lead attribution",
          "Honest connect-your-data states",
        ],
      },
    ],
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
    metaTitle: "AI Feed — make your site readable to AI engines | Citensity",
    metaDescription:
      "The AI Feed publishes fast, structured pages with JSON-LD and llms.txt so AI crawlers can read and cite you — plus bot-hit tracking to prove it's working.",
    sections: [
      {
        kind: "callout",
        title: "AI crawlers can't read a JS-heavy site.",
        body: "If GPTBot and PerplexityBot can't parse your pages cleanly, they won't cite you. The AI Feed gives them a structured surface built for exactly this — fast, semantic, and discoverable.",
      },
      {
        kind: "pipeline",
        title: "From published to cited",
        steps: ["Publish", "Expose via llms.txt", "Get crawled", "Get cited"],
      },
      {
        kind: "schema",
        title: "Structured the way engines expect.",
        subtitle: "Every page emits clean JSON-LD, so an AI engine can extract who you are and what you do — no scraping guesswork.",
        note: "Generated automatically on every page",
        lines: [
          { k: "@type", v: "Article" },
          { k: "headline", v: "Best analytics for product teams" },
          { k: "about", v: "Product analytics" },
          { k: "author", v: "Your Brand" },
          { k: "isPartOf", v: "llms.txt + sitemap.xml" },
        ],
      },
      {
        kind: "split",
        eyebrow: "Machine-readable by design",
        title: "Built for machines to read — and humans to trust.",
        body: "Every page ships fast and structured, so an answer engine can extract your facts without guesswork.",
        bullets: [
          "JSON-LD structured data on every page",
          "An llms.txt index for AI crawlers",
          "Canonical URLs and clean semantics",
          "Answer-shaped content, not walls of text",
          "Rendered in your native brand theme",
        ],
      },
      {
        kind: "split",
        flip: true,
        eyebrow: "Proof it's working",
        title: "See which bots are reading you.",
        body: "We classify and track AI-bot hits, so 'are we discoverable?' stops being a guess.",
        bullets: [
          "GPTBot, PerplexityBot, ClaudeBot & Google-Extended detection",
          "Per-bot crawl activity over time",
          "Tied back to the pages they read",
          "No-ops on human traffic — bots only",
        ],
      },
      {
        kind: "checklist",
        eyebrow: "Capabilities",
        title: "The surface AI engines prefer.",
        items: [
          "Fast, structured public pages",
          "JSON-LD on every page",
          "llms.txt for AI crawlers",
          "AI-bot hit tracking",
          "Canonical + schema",
          "Native-theme rendering",
        ],
      },
    ],
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
    metaTitle: "Content & Authority — backlinks + refreshes on autopilot | Citensity",
    metaDescription:
      "Discover backlink opportunities, analyze competitors, draft outreach, and auto-refresh aging pages — the continuous SEO work that compounds domain authority.",
    sections: [
      {
        kind: "callout",
        title: "SEO isn't a one-time project.",
        body: "Rankings decay, competitors move, and manual upkeep doesn't scale. Citensity runs the compounding authority work continuously, in the background — so your gains hold and grow.",
      },
      {
        kind: "steps",
        title: "The authority flywheel",
        items: [
          { title: "Audit", body: "Baseline your authority, content health, and the gaps competitors leave open." },
          { title: "Discover", body: "Surface backlink prospects and the pages most due for a refresh." },
          { title: "Outreach", body: "AI-drafted, brand-grounded outreach for every link opportunity." },
          { title: "Refresh", body: "Auto re-draft aging pages so they keep their rank instead of slipping." },
        ],
      },
      {
        kind: "flywheel",
        title: "A loop that compounds.",
        subtitle: "Each turn feeds the next — authority you build keeps paying off instead of decaying.",
        steps: ["Audit", "Discover", "Outreach", "Refresh"],
        center: "Compounding authority",
      },
      {
        kind: "split",
        eyebrow: "Compounding, not one-off",
        title: "The work that pays off for years.",
        body: "Authority is the moat AI engines weigh most heavily. Citensity does the unglamorous, compounding work on a schedule.",
        bullets: [
          "Backlink opportunity discovery",
          "Competitor gap analysis",
          "Brand-grounded outreach drafts",
          "Content-refresh recommendations",
          "Works on any CMS — plugs into your stack",
        ],
      },
      {
        kind: "checklist",
        eyebrow: "Capabilities",
        title: "Continuous SEO, handled.",
        items: [
          "Backlink opportunity discovery",
          "Competitor intelligence",
          "Outreach drafting",
          "Content-refresh recommendations",
          "Authority scoring",
          "Works on any CMS",
        ],
      },
    ],
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
    metaTitle: "AI Search Agent — get cited & convert in AI search | Citensity",
    metaDescription:
      "Win the answer in ChatGPT, Perplexity, and AI Overviews: Brand Memory grounding, cited-ready pages, AI-citation tracking, and built-in lead capture.",
    sections: [
      {
        kind: "callout",
        title: "Your buyers ask AI before they search.",
        body: "AI answers collapse the results page into one cited source. If you're not that source, you're invisible — no matter how good your product is. This solution makes you the answer.",
      },
      {
        kind: "answerbox",
        title: "This is what winning looks like.",
        subtitle: "When a buyer asks an engine, you're the brand it names — with your own pages cited as the source.",
        query: "What's the best analytics tool for a product team?",
        brand: "your brand",
        answer: "For product teams, your brand is a top recommendation — it's built for self-serve analytics and activation tracking, with strong adoption among startups.",
        cited: ["yourbrand.com/guides", "yourbrand.com/vs", "yourbrand.com/product-analytics"],
      },
      {
        kind: "steps",
        title: "How you win the answer",
        items: [
          { title: "Build Brand Memory", body: "Ground the engine in your real business so answers are accurate." },
          { title: "Generate cited-ready pages", body: "Structured, answer-shaped content engineered to be the source." },
          { title: "Get crawled & cited", body: "Publish to the AI Feed and track citations across engines." },
          { title: "Capture the leads", body: "Convert the visibility into scored, routed pipeline." },
        ],
      },
      {
        kind: "compare",
        title: "GEO vs. the old playbook",
        subtitle: "Traditional SEO optimizes for a results page buyers increasingly skip.",
        columns: ["Citensity (GEO)", "Traditional SEO"],
        highlight: 0,
        rows: [
          { label: "Goal", cells: ["Be the cited answer", "Rank in the blue links"] },
          { label: "Surface", cells: ["AI answers + search", "Search results only"] },
          { label: "Content", cells: ["Answer-shaped + schema", "Keyword-shaped"] },
          { label: "Grounding", cells: ["Your Brand Memory", "Whatever you write"] },
          { label: "Outcome", cells: ["Cited + captured leads", "Clicks, maybe"] },
        ],
      },
      {
        kind: "checklist",
        eyebrow: "What's included",
        title: "Everything to win — and measure — the answer.",
        items: [
          "GEO-optimized pages",
          "AI-citation tracking",
          "Answer-shaped content",
          "Multi-engine coverage",
          "Built-in lead capture",
          "Honest measurement",
        ],
      },
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
    metaTitle: "Lead Conversion — capture, score & follow up | Citensity",
    metaDescription:
      "Convert page visitors into pipeline: journey tracking, explainable scoring, routing rules, AI-drafted follow-ups, a conversion audit, and CRM sync.",
    sections: [
      {
        kind: "callout",
        title: "Most visitors leave without a trace.",
        body: "Without capture, scoring, and fast follow-up, hard-won traffic never becomes pipeline. Lead Conversion closes that gap end-to-end — every visitor accounted for.",
      },
      {
        kind: "funnel",
        title: "More of every visit becomes a conversation.",
        subtitle: "Capture, score, and follow up automatically — so fewer hard-won visits slip away.",
        stages: [
          { label: "Page visitors", value: "100%", pct: 100 },
          { label: "Captured", value: "41%", pct: 70 },
          { label: "Qualified & routed", value: "23%", pct: 48 },
          { label: "In conversation", value: "12%", pct: 30 },
        ],
      },
      {
        kind: "steps",
        title: "From click to conversation",
        items: [
          { title: "Capture", body: "Forms on every page, tied to each visitor's journey." },
          { title: "Score", body: "Explainable fit + intent scoring ranks who's worth your time." },
          { title: "Route", body: "Rules send each lead to the right owner instantly." },
          { title: "Follow up", body: "AI-drafted, on-brand follow-ups; sync to your CRM." },
        ],
      },
      {
        kind: "split",
        eyebrow: "No lead left behind",
        title: "Built to convert, not just collect.",
        body: "Capturing an email is the easy part. Lead Conversion does the work that actually turns it into a meeting.",
        bullets: [
          "Explainable fit + intent scoring",
          "Automatic routing & owner assignment",
          "AI-drafted, brand-grounded follow-ups",
          "A conversion audit that finds the friction",
          "CRM sync to your existing pipeline",
        ],
      },
      {
        kind: "checklist",
        eyebrow: "What's included",
        title: "The full conversion loop.",
        items: [
          "Lead capture forms",
          "Explainable scoring",
          "Routing & assignment",
          "AI follow-up drafts",
          "Conversion audit",
          "CRM sync",
        ],
      },
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
    metaTitle: "Paid Boost (coming soon) — qualified leads from paid | Citensity",
    metaDescription:
      "Paid Boost is on the Citensity roadmap: bring Brand Memory grounding and the lead engine to paid campaigns. Join the waitlist for early access.",
    sections: [
      {
        kind: "callout",
        eyebrow: "On the roadmap",
        title: "Paid traffic deserves the same engine.",
        body: "Ads send expensive clicks to pages that aren't grounded or built to convert. Paid Boost will bring Citensity's grounding and lead engine to paid — without a separate tool. It's in active development.",
      },
      {
        kind: "split",
        eyebrow: "What it'll do",
        title: "Your organic engine, pointed at paid.",
        body: "The same Brand Memory, the same scoring, the same follow-up — applied to campaign landing pages so paid and organic finally share one system.",
        bullets: [
          "Campaign-specific, conversion-first landing pages",
          "Brand-grounded ad and page copy",
          "The same explainable lead scoring",
          "One unified paid + organic pipeline view",
          "No separate tool to learn",
        ],
      },
      {
        kind: "steps",
        title: "The planned flow",
        items: [
          { title: "Ground", body: "Reuse Brand Memory so paid landing pages stay accurate and on-brand." },
          { title: "Generate", body: "Spin up campaign-specific, conversion-optimized landing pages." },
          { title: "Capture", body: "The same scoring, routing, and follow-up as your organic leads." },
          { title: "Measure", body: "One view of paid + organic pipeline together." },
        ],
      },
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
