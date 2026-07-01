import type { Article } from "@/components/resources/content-types";

export const BATCH_SCHEMA: Record<string, Article> = {
  "product-schema-for-ai": {
    slug: "product-schema-for-ai",
    metaTitle: "Product Schema for AI Search: Implementation Guide | Citensity",
    metaDescription:
      "Product structured data makes your product facts machine-readable for AI shopping answers. Here's what Product schema is, the key properties, and how to implement it without common errors.",
    updated: "2026-07-01",
    readMins: 6,
    answer:
      "Product schema is structured data (typically JSON-LD) that describes a product's name, description, price, availability, and ratings in a machine-readable form, so search and AI engines can confidently extract and cite your product facts in shopping answers. Implement it with accurate values that match what's visible on the page, include the properties engines actually use (name, offers/price, availability, aggregateRating where genuine), and validate it - mismatched or fabricated markup can be ignored or penalized.",
    takeaways: [
      "Product schema makes product facts (price, availability, ratings) machine-readable for AI shopping answers.",
      "Use JSON-LD and mirror what's visibly on the page - markup must match reality.",
      "Key properties: name, description, offers (price, currency, availability), and genuine aggregateRating.",
      "Never fake reviews or prices in markup - engines can ignore or penalize mismatched data.",
      "Validate the markup; invalid schema simply won't be used.",
    ],
    sections: [
      {
        heading: "What Product schema does",
        body: [
          "Product schema is a structured-data vocabulary that tells engines 'this page is about a product, and here are its facts.' Rendered as JSON-LD in the page, it exposes name, description, price and availability (via an offers object), and ratings in a form engines can parse without guessing. For AI shopping answers - 'how much is X', 'is X in stock', 'best-rated Y' - this machine-readable clarity makes your product facts easy to extract and confidently attribute.",
        ],
      },
      {
        heading: "The properties that matter",
        body: ["Include the fields engines actually use for shopping answers:"],
        bullets: [
          "name and description: what the product is, clearly.",
          "offers: price, priceCurrency, and availability (in stock / out of stock).",
          "aggregateRating and review: only when you have genuine ratings/reviews.",
          "brand, sku/gtin, and image where applicable, for disambiguation.",
        ],
      },
      {
        heading: "Match markup to the page",
        body: [
          "The cardinal rule: structured data must reflect what's actually visible on the page. Marking up a price of $49 while the page shows $79, or claiming ratings you don't display, is a mismatch engines detect - and it gets the markup ignored or the page penalized. Product schema supports your on-page content; it never replaces the need for the same facts in visible text.",
        ],
      },
      {
        heading: "Validate and keep it honest",
        body: [
          "Invalid Product schema simply won't be used, so validate it with a structured-data testing tool before shipping. And never fabricate: fake reviews, invented ratings, or phantom prices in markup are both an integrity problem and a citation liability, because engines corroborate against the visible page and the wider web. Genuine, validated, page-matching Product schema is what earns the shopping-answer citation.",
        ],
      },
    ],
    faqs: [
      { q: "Do I need Product schema to appear in AI shopping answers?", a: "It's not strictly required, but it's high-value - it makes price, availability, and ratings machine-readable so engines can confidently extract and cite your product facts. Pair it with the same facts in visible on-page text." },
      { q: "What are the most important Product schema properties?", a: "name, description, and the offers object (price, currency, availability) - plus genuine aggregateRating/review where you have them, and brand/sku/gtin for disambiguation. These are the fields shopping answers rely on." },
      { q: "Can I mark up ratings I don't display on the page?", a: "No - markup must match what's visible. Claiming ratings or prices not shown on the page is a mismatch engines detect, and it gets the schema ignored or the page penalized. Only mark up genuine, displayed data." },
      { q: "How do I know my Product schema works?", a: "Validate it with a structured-data testing tool before shipping - invalid markup simply won't be used. See our guide on testing and validating structured data." },
    ],
    related: [
      { label: "Optimizing product pages for AI search", href: "/resources/product-pages-for-ai-search" },
      { label: "Schema types that matter for AI", href: "/resources/schema-types-that-matter-for-ai" },
      { label: "Testing and validating structured data", href: "/resources/testing-and-validating-structured-data" },
    ],
  },

  "howto-schema-guide": {
    slug: "howto-schema-guide",
    metaTitle: "HowTo Schema Guide for AI Search | Citensity",
    metaDescription:
      "HowTo structured data marks up step-by-step instructions so engines understand your tutorial as a procedure. Here's what HowTo schema is, its key properties, and when to use it.",
    updated: "2026-07-01",
    readMins: 5,
    answer:
      "HowTo schema is structured data that marks up a set of step-by-step instructions as a procedure, telling engines your content is a tutorial with ordered steps, supplies, and an end result. It helps engines parse and present your instructions for 'how do I do X' queries. Implement it to mirror your visible numbered steps exactly, include the step text and any tools/materials, and validate it - like all schema, it supports well-structured on-page steps rather than replacing them.",
    takeaways: [
      "HowTo schema marks up instructions as an ordered procedure engines can parse and present.",
      "It maps to 'how do I do X' queries, one of the most common AI question types.",
      "Key properties: the ordered steps (name/text), plus tools, supplies, and total time where relevant.",
      "Markup must mirror the visible numbered steps on the page.",
      "It supports clear on-page steps; it doesn't substitute for them.",
    ],
    sections: [
      {
        heading: "What HowTo schema does",
        body: [
          "HowTo structured data explicitly tells engines 'this content is a procedure' and lays out its ordered steps in machine-readable form. For instructional queries - 'how to set up X', 'steps to do Y' - this helps engines understand your tutorial as a sequence they can extract and potentially present as steps. It reinforces the extractable structure that already makes how-to content citation-rich.",
        ],
      },
      {
        heading: "Key properties",
        body: ["Capture the procedure's essentials:"],
        bullets: [
          "step: each step as an ordered item with clear text (and optional name).",
          "tool and supply: what the reader needs, where relevant.",
          "totalTime: how long the whole procedure takes, when useful.",
          "An overall name and description matching the page's title and intro.",
        ],
      },
      {
        heading: "Mirror the visible steps",
        body: [
          "Your HowTo markup should reflect the actual numbered steps shown on the page - same steps, same order. Marking up steps that don't appear, or in a different sequence, is the kind of mismatch that gets schema ignored. The schema and the visible content should be two representations of the same procedure.",
        ],
      },
      {
        heading: "Use it where it fits",
        body: [
          "HowTo schema is right for genuine step-by-step procedures - not for every article. Applying it to content that isn't really a sequential how-to is misuse that engines discount. Where you do have a real tutorial, pair clean numbered on-page steps with validated HowTo markup for the strongest extractable result, and confirm it with a structured-data testing tool.",
        ],
      },
    ],
    faqs: [
      { q: "When should I use HowTo schema?", a: "For genuine step-by-step procedures - real tutorials with ordered steps. Don't apply it to content that isn't sequential instructions; misapplied schema gets discounted. Where you have a true how-to, it reinforces the extractable structure." },
      { q: "What are the key HowTo properties?", a: "The ordered steps (each with clear text), plus tools, supplies, and total time where relevant, and an overall name/description matching the page. The steps are the core." },
      { q: "Does HowTo schema guarantee rich results?", a: "No schema guarantees a specific presentation - engines decide. HowTo markup helps engines understand and potentially present your steps, but the reliable win is that it reinforces clean, extractable on-page structure." },
      { q: "Must the markup match the on-page steps?", a: "Yes - same steps, same order as shown on the page. Mismatched or invisible steps in markup get ignored. Schema and visible content should represent the same procedure." },
    ],
    related: [
      { label: "How-to content for AI search", href: "/resources/how-to-content-for-ai-search" },
      { label: "Schema types that matter for AI", href: "/resources/schema-types-that-matter-for-ai" },
      { label: "Testing and validating structured data", href: "/resources/testing-and-validating-structured-data" },
    ],
  },

  "review-schema-for-ai": {
    slug: "review-schema-for-ai",
    metaTitle: "Review & Rating Schema for AI Search | Citensity",
    metaDescription:
      "Review and aggregateRating schema make genuine ratings machine-readable - but misuse is heavily penalized. Here's how to implement review structured data correctly and honestly.",
    updated: "2026-07-01",
    readMins: 6,
    answer:
      "Review and aggregateRating schema make genuine ratings and reviews machine-readable, helping engines surface trust signals in answers - but this is among the most-abused schema, so engines enforce strict rules: only mark up reviews genuinely present on the page, never self-serving ratings of your own business on your own site where prohibited, and always match the visible content. Done honestly, it strengthens trust signals; done wrong, it gets ignored or penalized.",
    takeaways: [
      "Review/aggregateRating schema make genuine ratings machine-readable trust signals.",
      "This schema is heavily abused, so engines enforce strict eligibility and honesty rules.",
      "Only mark up reviews actually shown on the page - never invented or hidden ratings.",
      "Self-serving review markup (rating your own business on your own site) is restricted - follow the rules.",
      "Honest, page-matching review schema helps; misuse is a penalty risk.",
    ],
    sections: [
      {
        heading: "What review schema does",
        body: [
          "Review schema marks up an individual review; aggregateRating summarizes many into an average and count. Together they make rating trust signals machine-readable, so engines can factor them into answers and potentially display them. For decisions where reputation matters, genuine ratings are a strong corroborating signal - and marking them up cleanly helps engines use them.",
        ],
      },
      {
        heading: "The strict rules (because it's abused)",
        body: ["Review markup is heavily policed - stay strictly within the rules:"],
        bullets: [
          "Only mark up reviews and ratings genuinely displayed on the page.",
          "Don't mark up self-serving ratings of your own business on your own site where that's disallowed.",
          "Never invent ratings, inflate counts, or mark up hidden data.",
          "Match the aggregateRating value and count to what's actually shown.",
        ],
      },
      {
        heading: "Why honesty is enforced here specifically",
        body: [
          "Fake and self-serving review markup was so widely abused that engines tightened the rules and actively penalize violations. Because ratings directly influence trust and clicks, the incentive to cheat is high - and so is the scrutiny. Engines corroborate ratings against other sources, so inflated or invented ones fail and damage trust across your site. Genuine reviews, marked up accurately, are the only version that works.",
        ],
      },
      {
        heading: "Implement and validate",
        body: [
          "Use JSON-LD, mark up only real displayed reviews with accurate values, follow the current eligibility rules for your content type, and validate with a structured-data testing tool. When done right, review schema reinforces a genuine trust signal; the moment it drifts from the visible, honest reality, it becomes a liability rather than an asset.",
        ],
      },
    ],
    faqs: [
      { q: "Can I add review schema to my own website's product/service?", a: "Only genuine reviews actually displayed on the page, and self-serving ratings of your own business on your own site are restricted under current rules. Follow the eligibility guidelines - misuse is actively penalized because this schema is heavily abused." },
      { q: "Why is review schema so strictly policed?", a: "Because it directly influences trust and clicks, it was widely abused with fake and inflated ratings. Engines tightened the rules, corroborate ratings against other sources, and penalize violations. Only genuine, page-matching markup works." },
      { q: "What's the difference between review and aggregateRating?", a: "review marks up an individual review; aggregateRating summarizes many into an average value and count. Use aggregateRating values that exactly match what's displayed on the page." },
      { q: "Will review schema get me star ratings in results?", a: "It can make genuine ratings eligible to be surfaced, but engines decide presentation and enforce strict eligibility. Never mark up ratings to chase stars - invalid or self-serving markup gets ignored or penalized." },
    ],
    related: [
      { label: "Schema markup mistakes", href: "/resources/schema-markup-mistakes" },
      { label: "E-E-A-T for AI search", href: "/resources/eeat-for-ai-search" },
      { label: "Testing and validating structured data", href: "/resources/testing-and-validating-structured-data" },
    ],
  },

  "event-schema-for-ai": {
    slug: "event-schema-for-ai",
    metaTitle: "Event Schema for AI Search | Citensity",
    metaDescription:
      "Event structured data makes dates, locations, and ticket info machine-readable so engines can answer 'when is X' and surface your event. Here's how to implement Event schema correctly.",
    updated: "2026-07-01",
    readMins: 5,
    answer:
      "Event schema is structured data that describes an event's name, dates, location (physical or virtual), and ticket/offer details, so engines can accurately answer 'when is X', 'where is Y', and surface your event in relevant answers. Implement it with precise start/end times, a clear location (including online events), and offer/ticket info where relevant, keep it current as details change, and validate it - stale or inaccurate event data is both useless and a trust problem.",
    takeaways: [
      "Event schema makes dates, location, and ticket info machine-readable for 'when/where is X' answers.",
      "Include precise start (and end) times, location (physical or virtual), and offers/ticket info.",
      "Handle online and hybrid events explicitly with the right location type.",
      "Freshness is critical - update or mark events cancelled/postponed as details change.",
      "Match markup to the visible page and validate it.",
    ],
    sections: [
      {
        heading: "What Event schema does",
        body: [
          "Event schema tells engines the essential facts of an event: what it is, when it happens, where (a venue or an online URL), and how to attend (tickets/offers). This lets engines answer time- and location-specific questions accurately and surface your event when someone asks about it. For anything date-bound, it turns your event page into a machine-readable answer.",
        ],
      },
      {
        heading: "Key properties",
        body: ["Capture the facts an attendee needs:"],
        bullets: [
          "name, startDate, and endDate with precise date/time.",
          "location: a physical place, or a virtual location (URL) for online events.",
          "eventAttendanceMode for online/offline/hybrid.",
          "offers: ticket price, availability, and where to buy, when relevant.",
        ],
      },
      {
        heading: "Freshness is non-negotiable",
        body: [
          "Event data has a hard expiry - the date passes, details change, things get cancelled or postponed. Stale event markup is worse than none: it can surface wrong information. Keep dates, times, and status current, use the appropriate status fields for cancellations or reschedules, and remove or update past events. Accurate, current event data is the whole point.",
        ],
      },
      {
        heading: "Match the page and validate",
        body: [
          "As with all schema, the markup must match what's on the visible page, and it should be validated with a structured-data testing tool. Handle online events explicitly - don't omit location just because there's no venue; use the virtual-location approach so engines understand it's an online event. Accurate, current, validated Event schema is what earns the 'when/where is X' answer.",
        ],
      },
    ],
    faqs: [
      { q: "How do I mark up an online event?", a: "Use the virtual attendance mode and a virtual location (the event URL) rather than omitting location. Engines need to understand it's online with a way to attend - don't leave location blank just because there's no physical venue." },
      { q: "What's the most common Event schema mistake?", a: "Stale data - not updating dates, status, or details as they change. Expired or wrong event info is worse than none because it can surface incorrect answers. Keep it current and use status fields for cancellations/reschedules." },
      { q: "What are the essential Event properties?", a: "name, startDate (and endDate), location (physical or virtual), attendance mode, and offers/ticket info where relevant - the facts someone needs to know what it is, when, where, and how to attend." },
      { q: "Does Event schema need to match the page?", a: "Yes - like all structured data, the markup must reflect what's visibly on the page, and you should validate it. Mismatched event data gets ignored and undermines trust." },
    ],
    related: [
      { label: "Schema types that matter for AI", href: "/resources/schema-types-that-matter-for-ai" },
      { label: "Freshness and content decay", href: "/resources/freshness-and-content-decay" },
      { label: "Testing and validating structured data", href: "/resources/testing-and-validating-structured-data" },
    ],
  },

  "localbusiness-schema-guide": {
    slug: "localbusiness-schema-guide",
    metaTitle: "LocalBusiness Schema Guide for AI Search | Citensity",
    metaDescription:
      "LocalBusiness schema makes your name, address, hours, and location machine-readable - essential for 'near me' AI answers. Here's how to implement it and keep it consistent.",
    updated: "2026-07-01",
    readMins: 5,
    answer:
      "LocalBusiness schema is structured data that describes a business's name, address, phone, hours, geo-location, and type, making these facts machine-readable so engines can confidently surface you in local and 'near me' answers. Implement it with accurate, complete details that exactly match your listings elsewhere (NAP consistency), include opening hours and geo-coordinates, and validate it - inconsistent local data is a top reason engines hesitate to surface a business.",
    takeaways: [
      "LocalBusiness schema makes NAP, hours, and location machine-readable for local AI answers.",
      "Consistency is everything - the details must match your listings across the web (NAP consistency).",
      "Include address, phone, opening hours, geo-coordinates, and the specific business type.",
      "Inconsistent or conflicting local data is a top reason engines won't surface you.",
      "Match the page, keep hours current, and validate the markup.",
    ],
    sections: [
      {
        heading: "What LocalBusiness schema does",
        body: [
          "LocalBusiness schema (and its specific subtypes like Restaurant or Dentist) tells engines the core facts of a physical business: name, address, phone, hours, location, and type. For local and 'near me' queries - which are a huge share of AI and voice search - this machine-readable clarity helps engines confidently understand who and where you are, and surface you for relevant local questions.",
        ],
      },
      {
        heading: "Key properties",
        body: ["Capture the facts a local searcher needs:"],
        bullets: [
          "name, address (full structured postal address), and telephone.",
          "openingHours / openingHoursSpecification - kept current.",
          "geo coordinates (latitude/longitude) for precise location.",
          "The most specific business type (e.g. Restaurant, Dentist) rather than generic LocalBusiness.",
        ],
      },
      {
        heading: "Consistency is the whole game",
        body: [
          "The single biggest factor for local trust is consistency - your name, address, and phone (NAP) matching exactly across your site, your listings, and directories. Engines corroborate local businesses against many sources, and conflicting details (a different phone here, old hours there) make them hesitant to surface you. LocalBusiness schema only helps if the facts it states agree with everywhere else you appear.",
        ],
      },
      {
        heading: "Keep it current and validate",
        body: [
          "Hours change, businesses move - keep the markup current, especially opening hours and any temporary changes. Use the most specific business subtype for clarity, match the visible page, and validate with a structured-data testing tool. Accurate, consistent, current LocalBusiness schema is foundational for winning local and voice answers.",
        ],
      },
    ],
    faqs: [
      { q: "What's the most important thing for LocalBusiness schema?", a: "Consistency - your name, address, and phone (NAP) must match exactly across your site, listings, and directories. Engines corroborate local businesses across sources, and conflicting details make them hesitant to surface you. Schema only helps if it agrees with everywhere else." },
      { q: "Should I use LocalBusiness or a more specific type?", a: "Use the most specific applicable subtype (e.g. Restaurant, Dentist, Plumber) rather than generic LocalBusiness - it gives engines clearer understanding of what you are, which helps for relevant local queries." },
      { q: "What properties are essential?", a: "Full structured address, telephone, opening hours (kept current), geo-coordinates, and the specific business type. These are the facts local and 'near me' answers rely on." },
      { q: "Does LocalBusiness schema help with voice search?", a: "Yes - a large share of voice queries are local ('near me', 'what time does X open'). Accurate, consistent LocalBusiness data helps engines confidently surface you in those spoken answers." },
    ],
    related: [
      { label: "GEO for local business", href: "/resources/geo-for-local-business" },
      { label: "GEO for voice assistants", href: "/resources/geo-for-voice-assistants" },
      { label: "Testing and validating structured data", href: "/resources/testing-and-validating-structured-data" },
    ],
  },

  "organization-schema-for-ai": {
    slug: "organization-schema-for-ai",
    metaTitle: "Organization Schema for AI Search | Citensity",
    metaDescription:
      "Organization schema defines your brand as an entity engines can recognize and trust. Here's how to implement it - logo, profiles, and identifiers that strengthen your entity and E-E-A-T.",
    updated: "2026-07-01",
    readMins: 5,
    answer:
      "Organization schema is structured data that defines your company as a recognizable entity - name, logo, official profiles, and identifiers - helping engines disambiguate and trust your brand, which underpins E-E-A-T and citation confidence. Implement it site-wide (often on the homepage) with your consistent official name, logo, social/authoritative profiles (sameAs), and contact details, so engines can connect and corroborate your brand across the web.",
    takeaways: [
      "Organization schema defines your brand as an entity engines can recognize and trust.",
      "It underpins E-E-A-T and citation confidence by disambiguating who you are.",
      "Include official name, logo, sameAs profiles, and contact/identifier details.",
      "Use one consistent official name matching your presence everywhere.",
      "It's foundational entity work - pair it with a strong About page.",
    ],
    sections: [
      {
        heading: "What Organization schema does",
        body: [
          "Organization schema tells engines 'this is the entity behind this site' and provides the facts that identify it: official name, logo, profiles, and contact details. Engines increasingly reason about entities - distinct, recognizable organizations - not just pages. Defining yours clearly helps them disambiguate you from similarly-named entities and connect your brand across the web, which builds the trust that underpins citation.",
        ],
      },
      {
        heading: "Key properties",
        body: ["Give engines a clear, connectable identity:"],
        bullets: [
          "name (and legalName): your consistent official name.",
          "logo and url: for brand recognition and canonical identity.",
          "sameAs: links to your official profiles and authoritative references.",
          "contactPoint and identifiers where applicable.",
        ],
      },
      {
        heading: "Consistency and connection",
        body: [
          "Organization schema works by connection and consistency. The sameAs links tie your site to your official profiles and authoritative mentions, helping engines corroborate that all these references are the same entity - you. Use one consistent official name everywhere; naming inconsistencies fragment your entity and weaken recognition. The goal is a single, clearly-defined, well-connected identity.",
        ],
      },
      {
        heading: "Foundation for E-E-A-T",
        body: [
          "Organization schema is foundational entity work that supports E-E-A-T: it helps engines know who you are before they weigh whether to trust your content. Pair it with a strong, factual About page and consistent entity data across the web - the schema declares the entity, the About page and corroboration substantiate it. Implement it site-wide (commonly on the homepage) and validate it.",
        ],
      },
    ],
    faqs: [
      { q: "Where should Organization schema go?", a: "Site-wide, commonly declared on the homepage - it defines the entity behind the whole site. Use your consistent official name, logo, profiles (sameAs), and contact details so engines can recognize and connect your brand." },
      { q: "What does sameAs do in Organization schema?", a: "It links your site to your official profiles and authoritative references, helping engines corroborate that all those references are the same entity - you. It's key to connecting and disambiguating your brand across the web." },
      { q: "How does Organization schema relate to E-E-A-T?", a: "It's foundational - it helps engines know who you are before weighing whether to trust your content. Pair it with a factual About page and consistent web-wide entity data; the schema declares the entity, the rest substantiates it." },
      { q: "Does the name in schema need to match everywhere?", a: "Yes - use one consistent official name across your schema, site, and profiles. Naming inconsistencies fragment your entity and weaken engine recognition." },
    ],
    related: [
      { label: "Entity SEO explained", href: "/resources/entity-seo-explained" },
      { label: "About pages and E-E-A-T", href: "/resources/about-pages-and-eeat" },
      { label: "Testing and validating structured data", href: "/resources/testing-and-validating-structured-data" },
    ],
  },

  "breadcrumb-schema-explained": {
    slug: "breadcrumb-schema-explained",
    metaTitle: "Breadcrumb Schema Explained for AI Search | Citensity",
    metaDescription:
      "BreadcrumbList schema tells engines where a page sits in your site's hierarchy. Here's what it does, how to implement it, and why it helps engines understand your content structure.",
    updated: "2026-07-01",
    readMins: 4,
    answer:
      "BreadcrumbList schema is structured data that describes a page's position in your site hierarchy - the path from home to the current page - helping engines understand your site structure and how content relates. It's simple to implement (an ordered list of the breadcrumb trail with names and URLs), should mirror your visible breadcrumb navigation, and gives engines useful context about topical organization that supports both navigation clarity and topical authority.",
    takeaways: [
      "BreadcrumbList schema describes a page's position in your site hierarchy.",
      "It helps engines understand site structure and how content relates.",
      "Implementation is simple: an ordered list of the trail with names and URLs.",
      "It should mirror the visible breadcrumb navigation on the page.",
      "It reinforces topical organization, supporting topical authority.",
    ],
    sections: [
      {
        heading: "What BreadcrumbList schema does",
        body: [
          "Breadcrumb schema encodes the trail from your homepage down to the current page - for example, Home > Resources > GEO Fundamentals > This Article. This tells engines where a page sits in your site's structure and how it relates to parent topics. That structural context helps engines understand your site's organization and can inform how pages are presented and understood.",
        ],
      },
      {
        heading: "How to implement it",
        body: ["It's one of the simpler schema types:"],
        bullets: [
          "An itemListElement array, ordered from top of the hierarchy to the current page.",
          "Each item with a name and the URL it points to.",
          "Position numbers reflecting the order of the trail.",
          "Markup that mirrors the breadcrumb navigation shown on the page.",
        ],
      },
      {
        heading: "Why it helps for GEO",
        body: [
          "Breadcrumbs reinforce topical organization - they show engines that a page belongs to a coherent cluster under a parent topic. Combined with strong internal linking and content clusters, this structural clarity supports topical authority: engines understand not just the page, but its place in a well-organized body of knowledge. It's a small, low-effort signal that complements your broader content architecture.",
        ],
      },
    ],
    faqs: [
      { q: "Is breadcrumb schema worth implementing?", a: "Yes - it's low-effort and helps engines understand your site hierarchy and how pages relate, reinforcing topical organization. It complements internal linking and content clusters to support topical authority." },
      { q: "How do I implement BreadcrumbList schema?", a: "As an ordered itemListElement array from the top of the hierarchy to the current page, each item with a name, URL, and position, mirroring the visible breadcrumb navigation on the page." },
      { q: "Does it need to match visible breadcrumbs?", a: "Yes - like all structured data, it should mirror what's shown on the page. The schema and the visible breadcrumb trail should represent the same hierarchy." },
      { q: "How does breadcrumb schema help GEO specifically?", a: "It shows engines a page's place in a coherent topic cluster, reinforcing topical organization. Combined with internal linking and clusters, it supports the topical authority that helps engines trust and cite your content." },
    ],
    related: [
      { label: "Internal linking for AI search", href: "/resources/internal-linking-for-ai-search" },
      { label: "Content clusters and pillar pages", href: "/resources/content-clusters-and-pillar-pages" },
      { label: "Topical authority for GEO", href: "/resources/topical-authority-for-geo" },
    ],
  },

  "article-schema-for-ai": {
    slug: "article-schema-for-ai",
    metaTitle: "Article Schema for AI Search | Citensity",
    metaDescription:
      "Article schema marks up your content's headline, author, and dates - reinforcing authorship and freshness signals engines use. Here's how to implement Article structured data well.",
    updated: "2026-07-01",
    readMins: 5,
    answer:
      "Article schema is structured data that describes a piece of content - its headline, author, publish and modified dates, and publisher - reinforcing the authorship and freshness signals engines use to assess and cite content. Implement it on your articles with an accurate headline, a real named author (linked to their entity), genuine publish/modified dates, and publisher info, so engines can clearly attribute and date your content.",
    takeaways: [
      "Article schema marks up headline, author, dates, and publisher for content pages.",
      "It reinforces authorship (E-E-A-T) and freshness signals engines rely on.",
      "Use a real, named author linked to their entity - not a generic byline.",
      "Keep dateModified accurate when you update content - it signals freshness honestly.",
      "Match the visible page and validate.",
    ],
    sections: [
      {
        heading: "What Article schema does",
        body: [
          "Article schema tells engines the key metadata of a content piece: what it's titled, who wrote it, when it was published and last updated, and who published it. These map directly to signals engines care about - authorship (part of E-E-A-T) and freshness. Marking them up cleanly helps engines attribute your content to a credible author and understand how current it is.",
        ],
      },
      {
        heading: "Key properties",
        body: ["Capture the metadata that carries trust and freshness:"],
        bullets: [
          "headline: matching the article's actual title.",
          "author: a real, named person, ideally linked to their author entity/bio.",
          "datePublished and dateModified: genuine, accurate dates.",
          "publisher: your organization (ties to Organization schema).",
        ],
      },
      {
        heading: "Authorship and dates done honestly",
        body: [
          "Article schema is only as valuable as its honesty. A real named author linked to a genuine bio strengthens the E-E-A-T signal; a generic or fake byline doesn't. And dateModified should reflect real updates - bumping it without actually updating the content is a freshness fake that engines can see through when the content hasn't changed. Honest authorship and dating are what make the schema a genuine trust signal.",
        ],
      },
      {
        heading: "Connect and validate",
        body: [
          "Link the author to their author entity/bio and the publisher to your Organization schema, so engines connect content, author, and brand into a coherent, corroborated picture. Match the visible page (title, byline, dates) and validate the markup. Article schema is a foundational, low-effort type that reinforces the authorship and freshness engines already weigh.",
        ],
      },
    ],
    faqs: [
      { q: "What does Article schema help with?", a: "It reinforces authorship (E-E-A-T) and freshness signals by marking up headline, author, publish/modified dates, and publisher - helping engines attribute your content to a credible author and understand how current it is." },
      { q: "Should the author be a real person?", a: "Yes - a real, named author linked to a genuine bio strengthens the E-E-A-T signal. Generic or fake bylines don't help; connect the author to their entity for corroboration." },
      { q: "Can I just bump dateModified to look fresh?", a: "No - dateModified should reflect real content updates. Faking freshness without changing the content is something engines can see through, and it undermines trust. Update the content, then update the date." },
      { q: "How does Article schema connect to my brand?", a: "Via the publisher property tied to your Organization schema, and the author tied to their bio - connecting content, author, and brand into a coherent, corroborated entity picture engines can trust." },
    ],
    related: [
      { label: "Author bios and E-E-A-T", href: "/resources/author-bios-and-eeat" },
      { label: "Freshness and content decay", href: "/resources/freshness-and-content-decay" },
      { label: "Organization schema for AI search", href: "/resources/organization-schema-for-ai" },
    ],
  },

  "video-schema-for-ai": {
    slug: "video-schema-for-ai",
    metaTitle: "Video Schema (VideoObject) for AI Search | Citensity",
    metaDescription:
      "VideoObject schema tells engines what your video is about, including transcript and key moments. Here's how to implement video structured data so engines understand and surface your video.",
    updated: "2026-07-01",
    readMins: 5,
    answer:
      "VideoObject schema is structured data that describes a video - its title, description, thumbnail, upload date, duration, and ideally transcript and key moments - so engines can understand what the video covers and potentially surface it. Because engines can't watch video, this markup (especially the transcript and description) is a key way to convey the video's content, complementing the readable on-page text that actually earns citations.",
    takeaways: [
      "VideoObject schema describes a video so engines understand what it covers.",
      "Engines can't watch video - the description and transcript in markup convey the content.",
      "Include title, description, thumbnail, upload date, duration, and transcript where possible.",
      "Key moments/clips help engines understand structure and can aid presentation.",
      "Pair schema with readable on-page text - text is what actually gets cited.",
    ],
    sections: [
      {
        heading: "What VideoObject schema does",
        body: [
          "VideoObject schema tells engines the metadata of a video: what it's called, what it's about, its thumbnail, when it was uploaded, and how long it is. Since engines can't watch the video itself, this markup - especially a good description and transcript - is a primary way to communicate the video's content to them, so they understand what it covers and can potentially surface it for relevant queries.",
        ],
      },
      {
        heading: "Key properties",
        body: ["Give engines a clear picture of the video:"],
        bullets: [
          "name and description: what the video is and covers.",
          "thumbnailUrl, uploadDate, and duration.",
          "transcript: the spoken content as text (high value for understanding).",
          "clip / key moments: to convey structure and segments.",
        ],
      },
      {
        heading: "Transcript is the high-value part",
        body: [
          "Of all the properties, the transcript matters most for AI understanding - it turns the spoken, otherwise-invisible content into text engines can read. A rich description plus transcript gives engines real understanding of the video's substance, not just that a video exists. This mirrors the broader video-GEO principle: the knowledge in a video is only accessible to engines as text.",
        ],
      },
      {
        heading: "Schema supports, text gets cited",
        body: [
          "VideoObject schema helps engines understand and potentially present your video, but the citation itself typically comes from readable content - the transcript and an answer-shaped text summary on the page. Treat the schema as important context that helps engines index and understand the video, paired with the on-page text that does the citation work. Match the visible page and validate the markup.",
        ],
      },
    ],
    faqs: [
      { q: "Why does VideoObject schema matter if engines can't watch video?", a: "Precisely because they can't watch it - the markup (especially description and transcript) is how you convey the video's content to engines so they understand what it covers and can surface it. Without it, the video's substance is largely invisible." },
      { q: "What's the most valuable VideoObject property?", a: "The transcript - it turns spoken, otherwise-invisible content into readable text engines can understand. A rich description plus transcript gives engines real understanding of the video's substance." },
      { q: "Does VideoObject schema get my video cited?", a: "It helps engines understand and potentially present the video, but citations typically come from readable on-page text (transcript + answer-shaped summary). Use schema as context and rely on text for the citation." },
      { q: "What are the essential VideoObject properties?", a: "name, description, thumbnailUrl, uploadDate, and duration at minimum - plus transcript and key-moment clips where possible for richer understanding. Match the visible page and validate." },
    ],
    related: [
      { label: "Video content and GEO: making video citable", href: "/resources/video-content-and-geo" },
      { label: "Schema types that matter for AI", href: "/resources/schema-types-that-matter-for-ai" },
      { label: "Testing and validating structured data", href: "/resources/testing-and-validating-structured-data" },
    ],
  },

  "testing-and-validating-structured-data": {
    slug: "testing-and-validating-structured-data",
    metaTitle: "Testing & Validating Structured Data | Citensity",
    metaDescription:
      "Invalid schema simply won't be used. Here's how to test and validate your structured data - the tools, what to check, and how to catch the mismatches that get markup ignored.",
    updated: "2026-07-01",
    readMins: 5,
    answer:
      "Testing and validating structured data means checking your schema for syntax errors, required-property gaps, and mismatches with the visible page - because invalid markup simply won't be used, and mismatched markup can be ignored or penalized. Use structured-data validation tools to confirm the JSON-LD parses and meets each type's requirements, then verify manually that every value matches what's actually on the page before shipping.",
    takeaways: [
      "Invalid schema won't be used - validation is not optional.",
      "Use structured-data testing/validation tools to catch syntax and required-property errors.",
      "Beyond validity, verify every value matches the visible page - mismatches get ignored or penalized.",
      "Check required vs. recommended properties for each type.",
      "Re-test after content or template changes, which silently break markup.",
    ],
    sections: [
      {
        heading: "Why validation is mandatory",
        body: [
          "Structured data only helps if engines can parse and trust it. A single syntax error, a missing required property, or a wrong type can make the whole block unusable - and you'd never know without testing, because there's no visible error on the page. Validation is the difference between schema that works and schema that's silently ignored.",
        ],
      },
      {
        heading: "What to check",
        body: ["Validation has two layers - technical validity and honesty:"],
        bullets: [
          "Syntax: the JSON-LD parses without errors.",
          "Required properties: each type's mandatory fields are present and correctly typed.",
          "Recommended properties: the fields that make the markup more useful are included.",
          "Page match: every value corresponds to something actually visible on the page.",
        ],
      },
      {
        heading: "The mismatch trap",
        body: [
          "A block can be technically valid and still fail, because the values don't match the visible page - a price, rating, or date in the markup that isn't shown to users. Validators catch syntax and structure, but you must manually verify honesty: the markup and the page must tell the same story. Mismatches are a top reason valid-looking schema gets ignored or penalized.",
        ],
      },
      {
        heading: "Re-test after changes",
        body: [
          "Structured data breaks silently when templates, CMS fields, or content change - a redesign drops a property, a migration alters values, a plugin update changes output. Re-test after any change that could affect markup, and spot-check periodically. Treat structured-data validation as an ongoing check, not a one-time setup, so your schema keeps working as the site evolves.",
        ],
      },
    ],
    faqs: [
      { q: "How do I validate structured data?", a: "Use a structured-data testing/validation tool to confirm the JSON-LD parses and meets each type's required properties, then manually verify every value matches the visible page. Both layers matter - technical validity and page-match honesty." },
      { q: "Why isn't my valid schema working?", a: "Often a mismatch - the markup is technically valid but its values (price, rating, date) don't match what's shown on the page. Validators catch syntax and structure; you must manually confirm the markup and page tell the same story." },
      { q: "How often should I re-test structured data?", a: "After any change that could affect markup - redesigns, migrations, CMS/plugin updates - since schema breaks silently. Spot-check periodically too; treat validation as ongoing, not one-time." },
      { q: "What happens if my schema is invalid?", a: "It simply won't be used - engines can't parse it, and there's no visible error on the page to warn you. That's why validation is mandatory before shipping any structured data." },
    ],
    related: [
      { label: "Schema markup mistakes", href: "/resources/schema-markup-mistakes" },
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "Schema types that matter for AI", href: "/resources/schema-types-that-matter-for-ai" },
    ],
  },
};
