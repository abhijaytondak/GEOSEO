import type { LucideIcon } from "lucide-react";
import { FileText, Layers, ShoppingBag } from "lucide-react";

export interface IntegrationData {
  slug: string;
  name: string;
  icon: LucideIcon;
  /** Hero */
  eyebrow: string;
  h1: string;
  subtitle: string;
  /** SEO */
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  /** "What Citensity publishes" bullets — grounded in the real adapter capability. */
  publishes: string[];
  /** Numbered connect steps. */
  steps: { title: string; body: string }[];
  /** Platform-specific reassurance points. */
  notes: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
}

/**
 * Integration page content. Every capability claim is grounded in the real CMS-publish
 * adapters (apps/api/src/modules/cms-publish.service.ts): WordPress via REST API +
 * application password, Webflow via the CMS Items API into a rich-text field, Shopify
 * via the Admin API Online Store Pages. Nothing here is aspirational — if the adapter
 * doesn't do it, the page doesn't claim it. All three fall back to managed /feeds
 * publishing when not connected, and every page is draft-first (generate → review → publish).
 */
export const INTEGRATIONS: IntegrationData[] = [
  {
    slug: "wordpress",
    name: "WordPress",
    icon: FileText,
    eyebrow: "WordPress integration",
    h1: "Publish GEO-optimized content to WordPress",
    subtitle:
      "Rank in Google and get cited by AI answer engines — then publish straight to WordPress. Citensity writes answer-first, schema-rich posts and pushes them to your site via the WordPress REST API. You review every draft before it goes live.",
    metaTitle: "AI SEO for WordPress — Publish GEO Content | Citensity",
    metaDescription:
      "Generate answer-first, schema-rich content and publish it to WordPress via the REST API. Works alongside Yoast and Rank Math. Draft-first — review before publishing.",
    primaryKeyword: "AI SEO WordPress",
    publishes: [
      "Full posts — title, body, and clean HTML structure (headings, lists, FAQ blocks)",
      "SEO meta title and description, length-clamped for Google",
      "JSON-LD structured data (Article, FAQ, Organization) so AI engines can cite the page",
      "The hero image and internal links to your related content",
    ],
    steps: [
      {
        title: "Create an application password in WordPress",
        body: "In WordPress, go to Users → Profile → Application Passwords and generate one for Citensity. This is the standard, revocable way to authorize the REST API — no plugin required.",
      },
      {
        title: "Connect it in Citensity",
        body: "Paste your site URL, WordPress username, and the application password into Citensity's publishing settings. We verify the connection against the REST API.",
      },
      {
        title: "Generate, review, publish",
        body: "Citensity drafts the page grounded in your Brand Memory. You review it, then publish — Citensity pushes it to WordPress and records the live URL. Until you connect WordPress, pages publish to a managed Citensity feed instead.",
      },
    ],
    notes: [
      {
        title: "Works alongside Yoast, Rank Math & AIOSEO",
        body: "Citensity isn't a replacement for your SEO plugin — it's the content engine on top. Your plugin keeps managing sitemaps and on-page checks; Citensity writes, optimizes for AI search, and publishes the content itself.",
      },
      {
        title: "Draft-first by default",
        body: "Nothing auto-posts. Every page is generated as a draft you review and approve before it reaches your live site.",
      },
    ],
    faqs: [
      {
        q: "Does Citensity replace my existing SEO plugin like Yoast or Rank Math?",
        a: "No. Citensity complements them. Yoast and Rank Math score your drafts and manage technical SEO settings; Citensity writes the content, optimizes it for AI answer engines with structured data, and publishes it to WordPress. They run together.",
      },
      {
        q: "How does Citensity connect to WordPress — a plugin or the API?",
        a: "Through the built-in WordPress REST API using an application password you generate in your profile. No plugin to install, and you can revoke access at any time.",
      },
      {
        q: "Can I review AI-generated posts before they publish?",
        a: "Yes. Citensity is draft-first: every page is generated for review, and nothing publishes to your live site until you approve it.",
      },
      {
        q: "Does it add schema so AI engines can cite my pages?",
        a: "Yes. Every page ships with a JSON-LD graph (Article, FAQ, Organization, and a speakable block) so Google and AI answer engines like ChatGPT and Perplexity can read and quote it.",
      },
    ],
  },
  {
    slug: "webflow",
    name: "Webflow",
    icon: Layers,
    eyebrow: "Webflow integration",
    h1: "Programmatic GEO/SEO content for Webflow CMS",
    subtitle:
      "Publish answer-first, schema-rich pages straight into your Webflow CMS. Citensity maps content into your existing collection template via the Webflow API, so your design stays exactly as you built it — and you approve every draft first.",
    metaTitle: "Webflow CMS Publishing — Programmatic GEO/SEO | Citensity",
    metaDescription:
      "Auto-publish optimized content into your Webflow CMS via the API. Content maps into your existing collection template — your design stays intact. Draft-first.",
    primaryKeyword: "publish to Webflow CMS",
    publishes: [
      "CMS collection items — title maps to your name field, body to a rich-text field",
      "SEO meta title and description, plus the URL slug",
      "JSON-LD structured data for AI-answer citation",
      "Published straight to the live site or held as a draft, your choice",
    ],
    steps: [
      {
        title: "Generate a Webflow API token",
        body: "In your Webflow site settings, create an API token with CMS read/write access. This authorizes Citensity to add items to your collection.",
      },
      {
        title: "Point Citensity at your collection",
        body: "Add the API token, your collection ID, and site host in Citensity's publishing settings. Your target collection needs a rich-text field for the body content.",
      },
      {
        title: "Generate, review, publish",
        body: "Citensity drafts the page, you review it, and it publishes into your Webflow collection via the CMS Items API. Not connected yet? Pages publish to a managed Citensity feed until you are.",
      },
    ],
    notes: [
      {
        title: "Your Webflow design stays intact",
        body: "Citensity writes content into your existing collection template — it doesn't touch your layout, styles, or components. The page looks exactly like the rest of your site.",
      },
      {
        title: "Requires a CMS-enabled plan",
        body: "Webflow's CMS API needs a CMS plan or higher (the Starter plan has no CMS). Your collection must include a rich-text field so the body keeps its heading and list structure.",
      },
    ],
    faqs: [
      {
        q: "What Webflow plan do I need?",
        a: "A CMS plan or higher, since the integration uses the Webflow CMS API. The Starter plan doesn't include CMS collections.",
      },
      {
        q: "Will publishing break my Webflow design or template?",
        a: "No. Content is mapped into your existing collection template through the API, so your design, styles, and components are untouched — only the collection fields are populated.",
      },
      {
        q: "Do I need to install a Webflow app?",
        a: "No app install. Citensity authenticates with a Webflow API token you generate in your site settings, and you can revoke it anytime.",
      },
      {
        q: "Does the body keep its formatting?",
        a: "Yes, as long as your collection has a rich-text field for the body — Citensity publishes real headings, lists, and FAQ structure rather than a flat block of text.",
      },
    ],
  },
  {
    slug: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    eyebrow: "Shopify integration",
    h1: "AI SEO & GEO content pages for Shopify",
    subtitle:
      "Publish answer-first, schema-rich pages to your Shopify store via the Admin API — guides, comparisons, and landing pages built to rank in Google and get cited in AI answers. Connect a custom app, review each draft, and publish to your existing theme.",
    metaTitle: "Shopify SEO & GEO Content Pages | Citensity",
    metaDescription:
      "Publish optimized Online Store pages to Shopify via the Admin API — no public app install. Guides, comparisons, and landing pages with schema for AI search. Draft-first.",
    primaryKeyword: "Shopify SEO automation",
    publishes: [
      "Online Store pages — guides, comparisons, and landing content native to your store",
      "SEO title and description on every page",
      "JSON-LD structured data so pages can be cited in AI shopping answers",
      "Published through your existing theme via the Shopify Admin API",
    ],
    steps: [
      {
        title: "Create a custom app in Shopify",
        body: "In your Shopify admin, go to Settings → Apps and sales channels → Develop apps, create a custom app, and grant it Admin API access to Online Store pages.",
      },
      {
        title: "Connect it to Citensity",
        body: "Paste your store domain and the custom app's Admin API access token into Citensity's publishing settings. No public App Store install — it's a direct, private connection you control.",
      },
      {
        title: "Generate, review, publish",
        body: "Citensity drafts the page, you review it, and it publishes as an Online Store page via the Admin API. Before you connect Shopify, pages publish to a managed Citensity feed.",
      },
    ],
    notes: [
      {
        title: "Goes beyond blog-only apps",
        body: "Most Shopify content apps only post to your blog. Citensity publishes native Online Store pages — the guides, comparisons, and buyer-intent landing pages that rank and get cited — with structured data built in.",
      },
      {
        title: "Theme-safe, no public app install",
        body: "Pages publish through the Admin API into your existing theme, so nothing about your storefront design changes. Because it's a custom app, you keep full control and can revoke access anytime.",
      },
    ],
    faqs: [
      {
        q: "Do I need to install an app from the Shopify App Store?",
        a: "No. Citensity connects through a custom app you create in your own Shopify admin, using an Admin API access token. It's a private, direct connection with no public App Store listing involved.",
      },
      {
        q: "Will it work with my current theme?",
        a: "Yes. Pages are published through the Shopify Admin API into your existing theme, so your storefront design is untouched.",
      },
      {
        q: "What does Citensity publish to Shopify?",
        a: "Native Online Store pages — guides, comparisons, and landing pages optimized for Google and AI answer engines, each with SEO metadata and JSON-LD schema.",
      },
      {
        q: "Can I review pages before they go live?",
        a: "Yes. Citensity is draft-first — every page is generated for your review and only publishes once you approve it.",
      },
    ],
  },
];

export function getIntegration(slug: string): IntegrationData | undefined {
  return INTEGRATIONS.find((i) => i.slug === slug);
}
