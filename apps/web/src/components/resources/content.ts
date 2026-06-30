import type { Article } from "./content-types";
import { PUBLISHED_SLUGS as INDEX_SLUGS } from "./resource-index";
import { BATCH_FUNDAMENTALS } from "./content-fundamentals";
import { BATCH_TACTICS } from "./content-tactics";
import { BATCH_ENGINES } from "./content-engines";
import { BATCH_FOUNDATIONS } from "./content-foundations";
import { BATCH_ADVANCED } from "./content-advanced";
import { BATCH_VERTICALS } from "./content-verticals";
import { BATCH_VERTICALS2 } from "./content-verticals2";
import { BATCH_WORKFLOWS } from "./content-workflows";
import { BATCH_OPERATIONS } from "./content-operations";
import { BATCH_VERTICALS3 } from "./content-verticals3";
import { BATCH_FORMATS } from "./content-formats";

/**
 * Authored resource content. Each entry is a real, substantive article — published only
 * when written (the [slug] route builds from these keys). Topics in topics.ts without an
 * entry here are planned, not yet published. Keep content answer-first and scannable.
 *
 * Flagship articles below are authored inline; additional clusters are merged from
 * per-batch modules. `CONTENT` (the export consumed everywhere) folds them all together.
 */
const FLAGSHIP: Record<string, Article> = {
  "what-is-generative-engine-optimization": {
    slug: "what-is-generative-engine-optimization",
    metaTitle: "What is Generative Engine Optimization (GEO)? | GEOSEO",
    metaDescription:
      "Generative Engine Optimization (GEO) is the practice of structuring content so AI answer engines cite your brand as the source. Here's how GEO works and how to start.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "Generative Engine Optimization (GEO) is the practice of creating and structuring content so that AI answer engines — ChatGPT, Perplexity, Google AI Overviews, Gemini — cite your brand as a source in their answers. Where traditional SEO competes for a ranking position on a results page, GEO competes to be the answer itself.",
    takeaways: [
      "GEO optimizes for being cited inside AI-generated answers, not for ranking links.",
      "It relies on clear, answer-shaped content, structured data, and verifiable facts.",
      "GEO complements SEO — the same authority signals feed both — it doesn't replace it.",
      "Success is measured in citations and share of voice across engines, not just clicks.",
    ],
    sections: [
      {
        heading: "Why GEO emerged",
        body: [
          "For two decades, search meant a page of ten blue links and the SEO game was to rank as high as possible on it. Generative engines changed the surface. When someone asks ChatGPT or Perplexity a question, they get a synthesized answer with a handful of cited sources — and most users never click through to a results page at all.",
          "That shift creates a new competition: not for position, but for citation. If the engine doesn't name you, you're invisible in the conversation, no matter how strong your product is. GEO is the discipline of earning that citation.",
        ],
      },
      {
        heading: "How AI engines decide what to cite",
        body: [
          "Answer engines retrieve candidate passages, then synthesize an answer and attribute it to the sources they leaned on. They favor content that is unambiguous, well-structured, and backed by evidence they can attribute confidently.",
        ],
        bullets: [
          "Clarity: a direct answer near the top, in plain language.",
          "Structure: descriptive headings, short paragraphs, lists, and FAQ blocks the model can extract.",
          "Evidence: specific facts, data, and named entities the engine can ground a claim on.",
          "Authority: corroboration across the web (links, mentions, consistent entity data).",
          "Machine-readability: clean HTML, JSON-LD structured data, and a crawlable surface.",
        ],
      },
      {
        heading: "GEO vs SEO: complementary, not competing",
        body: [
          "GEO doesn't discard SEO — it builds on it. The authority signals that help you rank (quality backlinks, topical depth, technical health) are the same signals that make an engine trust you enough to cite you. The difference is the optimization target: SEO optimizes a page to rank, GEO optimizes a passage to be quoted.",
          "In practice you run both at once. A page engineered for GEO — answer-first, structured, evidence-backed — also tends to rank well and win featured snippets, because those systems reward the same clarity.",
        ],
      },
      {
        heading: "How to start with GEO",
        body: ["You don't need a new tech stack to begin. Start with the content and structure you already control."],
        bullets: [
          "Open every key page with a direct, quotable answer to its core question.",
          "Add structured data (Article, FAQPage, Organization) so engines can parse you.",
          "Publish an llms.txt index so AI crawlers can discover your best pages.",
          "Ground claims in real facts and data — never fabricate statistics.",
          "Track which engines cite you, and for which questions, then close the gaps.",
        ],
      },
    ],
    faqs: [
      { q: "Is GEO the same as SEO?", a: "No. SEO optimizes a page to rank in search results; GEO optimizes content to be cited inside AI-generated answers. They share authority signals and are best run together." },
      { q: "Do I need special software for GEO?", a: "No — you can start with content structure, answer-first writing, and structured data. Tools help you scale and measure citations, but the fundamentals are free." },
      { q: "How is GEO measured?", a: "By citations and share of voice across AI engines — how often you're named in answers for your target questions — alongside the AI-referral traffic and leads that follow." },
      { q: "Will GEO replace SEO?", a: "No. Traditional search isn't disappearing, and the authority signals behind SEO also feed AI engines. GEO is an additional layer, not a replacement." },
    ],
    related: [
      { label: "GEO vs SEO: what's the difference?", href: "/resources/geo-vs-seo" },
      { label: "How to get cited in ChatGPT", href: "/resources/how-to-rank-in-chatgpt" },
      { label: "Brand Memory — grounded content", href: "/platform/brand-memory" },
    ],
  },

  "geo-vs-seo": {
    slug: "geo-vs-seo",
    metaTitle: "GEO vs SEO: What's the Difference? | GEOSEO",
    metaDescription:
      "GEO optimizes content to be cited by AI answer engines; SEO optimizes pages to rank in search results. Here's how they differ, overlap, and work together.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "SEO (Search Engine Optimization) optimizes a page to rank highly in a list of search results. GEO (Generative Engine Optimization) optimizes content to be cited as a source inside an AI-generated answer. They share most authority signals, so the smart play is to do both — not choose between them.",
    takeaways: [
      "SEO competes for a ranking position; GEO competes to be the cited answer.",
      "Both reward authority, clarity, and structured, evidence-backed content.",
      "GEO leans harder on answer-first writing, structured data, and machine-readability.",
      "Run them together: a GEO-optimized page usually ranks well too.",
    ],
    sections: [
      {
        heading: "The core difference",
        body: [
          "SEO's target is a position on a results page — ideally the top of the first page. GEO's target is a sentence inside an AI answer, with your brand or page named as the source. The user journey differs too: an SEO win earns a click; a GEO win earns a mention the user may act on without ever clicking.",
        ],
      },
      {
        heading: "Where they overlap",
        body: [
          "The signals that earn rankings and the signals that earn citations are mostly the same. Topical authority, quality backlinks, technical health, and clear content help in both worlds. That's why GEO is additive — improving for AI answers tends to improve classic rankings as a side effect.",
        ],
        bullets: [
          "Authority and trust (E-E-A-T, links, consistent entity data).",
          "Clear information architecture and internal linking.",
          "Fast, crawlable, well-structured pages.",
          "Content that genuinely answers the query.",
        ],
      },
      {
        heading: "Where they diverge",
        body: ["GEO puts extra weight on a few things SEO treats as optional."],
        bullets: [
          "An explicit, quotable answer near the top of the page.",
          "Structured data and an llms.txt surface for AI crawlers.",
          "Answer-shaped sections (questions as headings, concise responses).",
          "Verifiable facts the engine can attribute with confidence.",
        ],
      },
      {
        heading: "Which should you invest in?",
        body: [
          "Both, with the same content. The most efficient strategy is to write each important page answer-first and structure it well: you satisfy the AI engines and the ranking systems at once. Treating GEO and SEO as separate budgets usually means duplicated effort.",
        ],
      },
    ],
    faqs: [
      { q: "Is GEO replacing SEO?", a: "No. Traditional search still drives huge volume, and its ranking signals also feed AI answers. GEO is a layer on top of solid SEO." },
      { q: "Can one page be optimized for both?", a: "Yes — and it should be. Answer-first structure, clean schema, and real evidence serve rankings and citations simultaneously." },
      { q: "Does GEO need backlinks like SEO?", a: "Authority still matters. Links and consistent mentions build the trust that makes an engine comfortable citing you." },
    ],
    related: [
      { label: "What is Generative Engine Optimization?", href: "/resources/what-is-generative-engine-optimization" },
      { label: "GEO vs AEO vs SEO: a clear breakdown", href: "/resources/geo-vs-aeo-vs-seo" },
      { label: "How GEOSEO works", href: "/#how-it-works" },
    ],
  },

  "how-to-rank-in-chatgpt": {
    slug: "how-to-rank-in-chatgpt",
    metaTitle: "How to Get Cited in ChatGPT (2026 Guide) | GEOSEO",
    metaDescription:
      "You can't 'rank' in ChatGPT like Google — but you can become a source it cites. Here's how ChatGPT Search selects sources and how to earn citations.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "You can't buy or directly 'rank' in ChatGPT, but you can become a source it cites. ChatGPT Search retrieves and attributes content that is clearly written, well-structured, factually grounded, and crawlable by its bot (GPTBot/OAI-SearchBot). Earning citations comes down to clarity, authority, and machine-readability — not keyword stuffing.",
    takeaways: [
      "ChatGPT cites sources it can retrieve, parse, and attribute confidently.",
      "Allow OpenAI's crawlers (GPTBot / OAI-SearchBot) in robots.txt or you're invisible.",
      "Answer-first content with clear headings is far more citable than long preambles.",
      "Authority and corroboration across the web make ChatGPT trust your claims.",
    ],
    sections: [
      {
        heading: "How ChatGPT picks sources",
        body: [
          "When ChatGPT Search answers a question, it retrieves relevant pages, synthesizes a response, and cites the sources it relied on. It favors content where the answer is explicit and easy to extract, and where the claim can be attributed without ambiguity.",
          "There's no ranking dial to turn. Your job is to be the clearest, best-supported source for the questions your buyers ask.",
        ],
      },
      {
        heading: "Let the crawler in",
        body: [
          "If OpenAI's crawlers can't reach your pages, you can't be cited — full stop. Check that your robots.txt allows GPTBot and OAI-SearchBot, and that your important content renders without requiring JavaScript execution the crawler may not perform.",
        ],
        bullets: [
          "Allow GPTBot and OAI-SearchBot in robots.txt.",
          "Server-render or statically generate key content.",
          "Keep pages fast and free of crawl blockers.",
        ],
      },
      {
        heading: "Write for extraction",
        body: ["Structure each page so the answer is trivial to lift."],
        bullets: [
          "Open with a direct, 1–3 sentence answer to the page's core question.",
          "Use descriptive headings phrased the way people ask.",
          "Break content into short paragraphs, lists, and an FAQ.",
          "Add Article and FAQPage structured data.",
        ],
      },
      {
        heading: "Build the authority to be trusted",
        body: [
          "ChatGPT is more likely to cite sources that are corroborated elsewhere. Consistent entity data, quality backlinks, original data, and topical depth all raise the odds that your page becomes the attributed source rather than a competitor's.",
        ],
      },
    ],
    faqs: [
      { q: "Can I pay to appear in ChatGPT answers?", a: "No. ChatGPT Search citations are earned through retrievable, authoritative, well-structured content — not paid placement." },
      { q: "Do I need to allow GPTBot?", a: "To be eligible for citation in ChatGPT Search, yes — if you block OpenAI's crawlers, your content can't be retrieved or cited." },
      { q: "How do I know if ChatGPT cites me?", a: "Track brand citations across engines for your target questions, and watch your logs for OpenAI crawler activity. GEOSEO's analytics surface both." },
    ],
    related: [
      { label: "How to rank in Perplexity", href: "/resources/how-to-rank-in-perplexity" },
      { label: "GPTBot and AI crawlers", href: "/resources/gptbot-and-ai-crawlers" },
      { label: "AI Feed — make your site readable to AI", href: "/platform/ai-feed" },
    ],
  },

  "structured-data-for-ai-search": {
    slug: "structured-data-for-ai-search",
    metaTitle: "Structured Data (JSON-LD) for AI Search | GEOSEO",
    metaDescription:
      "Structured data helps AI engines understand and cite your pages. Here are the JSON-LD schema types that matter for AI search and how to implement them.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "Structured data is machine-readable markup (usually JSON-LD) that tells search and AI engines exactly what a page is about — its entities, author, and key facts. For AI search, the highest-leverage schema types are Article, FAQPage, Organization, and Product, because they let an engine extract and attribute your content with confidence.",
    takeaways: [
      "Structured data removes ambiguity so engines can parse and attribute your content.",
      "Article, FAQPage, Organization, and Product are the highest-value types for AI.",
      "JSON-LD is the recommended format — add it once per page in a script tag.",
      "Schema supports citation; it doesn't replace clear, well-written content.",
    ],
    sections: [
      {
        heading: "Why structured data matters for AI",
        body: [
          "AI engines do better when they don't have to guess. Structured data states a page's facts explicitly — who wrote it, what entity it's about, what the questions and answers are — so the engine can extract and attribute them without inferring from prose alone. That lowers the risk the engine mis-reads you, and raises the odds it cites you.",
        ],
      },
      {
        heading: "The schema types that matter most",
        body: ["You don't need every type. Focus on the few that map to how AI answers are built."],
        bullets: [
          "Article / BlogPosting — for guides and resources (headline, author, dates).",
          "FAQPage — exposes question/answer pairs engines love to lift.",
          "Organization — establishes your brand as a consistent entity.",
          "Product — for ecommerce items eligible to appear in AI shopping answers.",
          "BreadcrumbList — clarifies site structure and context.",
        ],
      },
      {
        heading: "How to implement it",
        body: [
          "Add a single JSON-LD script tag per page describing the primary entity. Keep it accurate — schema that contradicts the visible content is worse than none, and engines discount sites that game it. Validate with a schema testing tool before shipping.",
        ],
      },
    ],
    faqs: [
      { q: "Is JSON-LD better than microdata?", a: "Yes — JSON-LD is Google's recommended format and is far easier to maintain because it lives in one script block rather than being woven through your HTML." },
      { q: "Does structured data guarantee citations?", a: "No. It makes your content easier to parse and attribute, which helps — but the content still has to be clear, accurate, and authoritative." },
      { q: "Which schema should a blog post use?", a: "Article or BlogPosting for the post itself, FAQPage if it includes a Q&A block, plus Organization and BreadcrumbList for context." },
    ],
    related: [
      { label: "What is llms.txt?", href: "/resources/what-is-llms-txt" },
      { label: "FAQ schema for AI answers", href: "/resources/faq-schema-for-ai" },
      { label: "Page Engine — schema on every page", href: "/platform/page-engine" },
    ],
  },

  "how-to-track-ai-citations": {
    slug: "how-to-track-ai-citations",
    metaTitle: "How to Track AI Citations of Your Brand | GEOSEO",
    metaDescription:
      "You can't improve what you can't see. Here's how to track when AI engines cite your brand, measure share of voice, and find the gaps to close.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "To track AI citations, monitor whether engines like ChatGPT, Perplexity, and Google AI Overviews name your brand or pages in answers to your target questions, then measure how often you appear versus competitors (your AI share of voice). Combine that with AI-bot crawl logs and AI-referral traffic to see the full picture.",
    takeaways: [
      "Track citations per target question across each AI engine, over time.",
      "AI share of voice = how often you're cited vs competitors for your topics.",
      "Server logs reveal which AI bots crawl you and how often.",
      "Tie citations to referral traffic and leads to prove impact.",
    ],
    sections: [
      {
        heading: "What 'AI citation tracking' actually measures",
        body: [
          "Unlike a rank tracker that records a numeric position, AI citation tracking records presence: for a given question, did the engine name you, and as one of how many sources? Because answers vary by phrasing and over time, you track a set of representative questions repeatedly rather than a single query once.",
        ],
      },
      {
        heading: "The three signals to watch",
        body: ["A complete view combines what the engine says, what its bots do, and what users do next."],
        bullets: [
          "Citations: are you named in answers for your target questions, on which engines?",
          "Crawls: are GPTBot, PerplexityBot, and others fetching your pages (server logs)?",
          "Referrals: traffic and leads arriving from AI engines, attributed where possible.",
        ],
      },
      {
        heading: "Turning measurement into action",
        body: [
          "The point of tracking is to find gaps. If competitors are cited for a question and you're not, that's a content brief. If a page is crawled but never cited, it likely needs clearer, more extractable answers. Measurement closes the loop between publishing and getting cited.",
        ],
      },
    ],
    faqs: [
      { q: "Can Google Analytics show AI citations?", a: "Not directly. GA can show referral traffic from some AI engines, but it can't tell you whether you were cited in an answer — that needs citation tracking across engines." },
      { q: "How often should I check citations?", a: "Regularly and consistently — answers shift, so a recurring check on a fixed question set reveals trends a one-off look can't." },
      { q: "What is a good AI share of voice?", a: "It's relative to your category and competitors. The goal is a rising trend on the questions that matter to your buyers, not an absolute number." },
    ],
    related: [
      { label: "AI share of voice: how to measure it", href: "/resources/ai-share-of-voice" },
      { label: "Finding AI-bot traffic in your logs", href: "/resources/ai-bot-traffic-in-server-logs" },
      { label: "Analytics — AI citations + SEO performance", href: "/platform/analytics" },
    ],
  },

  "geo-for-saas": {
    slug: "geo-for-saas",
    metaTitle: "GEO for SaaS: A Practical Playbook | GEOSEO",
    metaDescription:
      "A practical Generative Engine Optimization playbook for SaaS: get cited by AI engines for comparison, alternative, and best-tool queries that drive pipeline.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "GEO for SaaS means getting your product cited when buyers ask AI engines questions like 'best tool for X', 'alternatives to Y', or 'how do I solve Z'. The playbook: ground the engine in your real product facts, publish answer-shaped comparison and use-case pages, and track citations on the buying questions that actually drive pipeline.",
    takeaways: [
      "SaaS buyers increasingly ask AI for shortlists before they ever visit a site.",
      "Comparison, alternatives, and 'best tool for' queries are the highest-intent GEO targets.",
      "Ground content in real product facts so engines describe you accurately.",
      "Measure citations on buying-stage questions, not just top-of-funnel topics.",
    ],
    sections: [
      {
        heading: "Why GEO is high-stakes for SaaS",
        body: [
          "SaaS purchases are considered decisions, and the shortlist increasingly forms inside an AI conversation. When a buyer asks 'what's the best analytics tool for a product team?', the engine names a few options. If you're not one of them, you've lost the deal before a human ever saw your site.",
        ],
      },
      {
        heading: "The pages that win SaaS citations",
        body: ["Map content to the questions buyers actually ask an engine at each stage."],
        bullets: [
          "'Best [category] for [segment]' — your strongest commercial GEO target.",
          "'[Competitor] alternatives' and '[You] vs [competitor]' comparison pages.",
          "'How to [job the product does]' — problem-aware, top-of-funnel capture.",
          "Pricing and integration questions buyers ask before committing.",
        ],
      },
      {
        heading: "Ground the engine in real facts",
        body: [
          "An engine can only describe you accurately if accurate information about you exists and is consistent. Maintain a clear source of truth — what you do, who it's for, proof points — and reflect it across your site and structured data. This is exactly what a Brand Memory layer provides, and it's why grounded SaaS pages get described correctly instead of vaguely.",
        ],
      },
      {
        heading: "Measure what drives pipeline",
        body: [
          "Top-of-funnel citations are nice, but the ones that matter are on buying-stage questions. Track whether you're cited for your category's 'best' and 'vs' queries, watch the gaps where competitors appear and you don't, and feed those gaps back into your content roadmap.",
        ],
      },
    ],
    faqs: [
      { q: "What GEO content should a SaaS build first?", a: "Start with your highest-intent buying queries — 'best [category] for [segment]', competitor comparisons, and alternatives pages — since those are where citations convert to pipeline." },
      { q: "How do I make AI describe my product accurately?", a: "Maintain a consistent source of truth about your product and expose it across your site and structured data, so engines ground their description in real facts rather than guessing." },
      { q: "Does GEO replace SaaS content marketing?", a: "No — it focuses it. The same content marketing, written answer-first and structured for extraction, now also earns AI citations." },
    ],
    related: [
      { label: "GEO for B2B", href: "/resources/geo-for-b2b" },
      { label: "Comparison pages AI engines cite", href: "/resources/comparison-pages-that-get-cited" },
      { label: "AI Search Agent — qualified leads from AI", href: "/solutions/ai-search" },
    ],
  },
};

/** All published articles, flagship + merged batches. */
export const CONTENT: Record<string, Article> = {
  ...FLAGSHIP,
  ...BATCH_FUNDAMENTALS,
  ...BATCH_TACTICS,
  ...BATCH_ENGINES,
  ...BATCH_FOUNDATIONS,
  ...BATCH_ADVANCED,
  ...BATCH_VERTICALS,
  ...BATCH_VERTICALS2,
  ...BATCH_WORKFLOWS,
  ...BATCH_OPERATIONS,
  ...BATCH_VERTICALS3,
  ...BATCH_FORMATS,
};

export function getArticle(slug: string): Article | undefined {
  return CONTENT[slug];
}

export const PUBLISHED_SLUGS = Object.keys(CONTENT);

// Build/dev-time drift guard (no-op in the serving runtime): the body-free
// resource-index.ts (consumed by the /resources hub + sitemap so article bodies never
// enter their module graph) MUST list the same slugs as the authored CONTENT. If this
// throws during `next build`, regenerate it: pnpm --filter @geoseo/web gen:resource-index.
if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV === "development") {
  const a = [...PUBLISHED_SLUGS].sort().join("\n");
  const b = [...INDEX_SLUGS].sort().join("\n");
  if (a !== b) {
    throw new Error(
      "resource-index.ts is out of sync with content.ts — regenerate: pnpm --filter @geoseo/web gen:resource-index",
    );
  }
}
