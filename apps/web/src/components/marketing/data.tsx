import {
  BrainCircuit,
  Telescope,
  FileText,
  Send,
  BarChart3,
  Inbox,
  ShieldCheck,
  Sparkles,
  Globe,
  Quote,
  type LucideIcon,
} from "lucide-react";

/** Public site origin used for canonical URLs + structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://geoseo-tau.vercel.app").replace(/\/+$/, "");
export const BRAND = "Citensity";
export const TAGLINE = "Be the answer buyers find — in Google and AI.";

/** Top nav — anchors into the long-form landing + the public content hub. */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Product", href: "#product" },
  { label: "Why Citensity", href: "#why" },
  { label: "FAQ", href: "#faq" },
  { label: "Resources", href: "/feeds" },
];

/** AI answer engines Citensity is engineered to get you cited in (honest — these are the GEO targets). */
export const ENGINES: string[] = ["ChatGPT", "Perplexity", "Google AI Overviews", "Gemini", "Copilot", "Claude"];

export interface Step {
  n: string;
  icon: LucideIcon;
  title: string;
  body: string;
}
export const STEPS: Step[] = [
  {
    n: "01",
    icon: BrainCircuit,
    title: "Build Brand Memory",
    body: "We scan your public site and build a structured memory of what you do, who you serve, and the entities you own — the source of truth for everything we create.",
  },
  {
    n: "02",
    icon: Telescope,
    title: "Discover real demand",
    body: "Surface buyer-intent topics and the exact questions people ask AI — not just keyword volume — so you build pages that match how buyers actually search now.",
  },
  {
    n: "03",
    icon: FileText,
    title: "Generate cited-ready pages",
    body: "Draft GEO + SEO pages grounded in Brand Memory: structured data, entity coverage, and answer-shaped content — on-brand, never fabricated.",
  },
  {
    n: "04",
    icon: Send,
    title: "Publish anywhere",
    body: "One click to WordPress, Webflow, Shopify, or a managed subdirectory — each page ships with JSON-LD, an updated sitemap, and llms.txt for AI crawlers.",
  },
  {
    n: "05",
    icon: BarChart3,
    title: "Get cited & capture leads",
    body: "Track AI citations and search rankings as they land, then capture, score, and route the qualified leads that arrive — straight into your pipeline.",
  },
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}
export const FEATURES: Feature[] = [
  { icon: Sparkles, title: "GEO-optimized pages", body: "Structured data, entity coverage, and answer-shaped content engineered to be the source AI engines cite." },
  { icon: BrainCircuit, title: "Brand Memory grounding", body: "Every page is grounded in your real business facts — so the engine stays on-message and never invents claims." },
  { icon: Telescope, title: "Buyer-intent discovery", body: "Find the topics and AI-search questions your buyers ask — and the gaps your competitors leave open." },
  { icon: Globe, title: "Publish anywhere", body: "Native publishing to WordPress, Webflow, Shopify, or a managed subdirectory — with sitemap + llms.txt." },
  { icon: BarChart3, title: "AI-citation & rank tracking", body: "See where you're cited across answer engines and how your pages move in search — in one place." },
  { icon: Inbox, title: "Lead capture & scoring", body: "Turn page visitors into scored, routed leads — with the journey and intent attached for your team." },
];

export interface Metric {
  value: string;
  label: string;
}
export const METRICS: Metric[] = [
  { value: "6", label: "AI answer engines targeted" },
  { value: "3", label: "Native CMS integrations" },
  { value: "JSON-LD + llms.txt", label: "On every page we publish" },
  { value: "Minutes", label: "From research to published page" },
];

export interface CompareRow {
  label: string;
  geoseo: string;
  agency: string;
  diy: string;
}
export const COMPARE: CompareRow[] = [
  { label: "Visibility in AI answers", geoseo: "Engineered in", agency: "Rarely", diy: "Manual, ad-hoc" },
  { label: "Time to a published page", geoseo: "Minutes", agency: "Weeks", diy: "Hours each" },
  { label: "Grounded in your brand", geoseo: "Always", agency: "Varies", diy: "You write it" },
  { label: "Publishes to your CMS", geoseo: "One click", agency: "Hand-off", diy: "Copy-paste" },
  { label: "Lead capture built in", geoseo: "Yes", agency: "No", diy: "No" },
];

export interface Faq {
  q: string;
  a: string;
}
export const FAQS: Faq[] = [
  {
    q: "What is Generative Engine Optimization (GEO)?",
    a: "GEO is the practice of structuring your content so AI answer engines — ChatGPT, Perplexity, Gemini, Google AI Overviews — cite your brand as the source. Where traditional SEO competes for ten blue links, GEO competes to be the answer itself.",
  },
  {
    q: "How is this different from a normal SEO tool?",
    a: "Most SEO tools report on keywords. Citensity is an engine: it learns your brand, finds demand, drafts and publishes optimized pages to your site, and tracks both search rankings and AI citations — then captures the leads those pages produce.",
  },
  {
    q: "Does it publish to my actual website?",
    a: "Yes. Citensity publishes natively to WordPress, Webflow, or Shopify, or to a managed subdirectory on your domain — no developer needed. Every page ships with JSON-LD structured data, an updated sitemap, and an llms.txt entry so AI crawlers can find it.",
  },
  {
    q: "Will it make things up about my business?",
    a: "No. Every page is grounded in Brand Memory — a structured profile extracted from your own site and reviewed by you. The engine writes from your real facts, products, and positioning, not invented claims.",
  },
  {
    q: "Is my data safe?",
    a: "We read public pages only to build your Brand Memory. We never access your CMS or publish anything without your approval, and nothing goes live until you say so.",
  },
  {
    q: "How fast can I see results?",
    a: "Your free audit runs in minutes. From there, the engine can take a topic from research to a published, optimized page in minutes — and citation and ranking signals build from there.",
  },
];

export const PROOF_ICON = Quote;
export const SHIELD_ICON = ShieldCheck;
