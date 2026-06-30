import type { Article } from "@/components/resources/content-types";

export const BATCH_FORMATS: Record<string, Article> = {
  "listicles-that-get-cited": {
    slug: "listicles-that-get-cited",
    metaTitle: "How to Write Listicles That Get Cited by AI | GEOSEO",
    metaDescription:
      "'Best X' and list posts are some of the most-cited content in AI answers. Here's how to structure a listicle so an engine lifts your picks - clear criteria, scannable entries, and honest reasoning.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "Listicles get cited when each entry is a self-contained, clearly-labeled item with explicit selection criteria and honest reasoning - because 'best X' and 'top tools for Y' are exactly the queries people ask AI engines, and a well-structured list is trivial for an engine to extract and attribute. The winning listicle states how it chose, makes each entry liftable on its own, and earns trust by being genuinely useful rather than a thin affiliate dump.",
    takeaways: [
      "'Best X' and 'top Y' are among the most common AI queries - listicles map directly to them.",
      "State your selection criteria up front; engines (and readers) trust a list that explains how it chose.",
      "Make each entry self-contained - name, what it is, who it's for - so it can be lifted in isolation.",
      "Honest, criteria-based reasoning beats a thin affiliate dump, which engines route around.",
      "Keep the list current; 'best of 2026' decays fast and freshness is a citation signal.",
    ],
    sections: [
      {
        heading: "Why listicles are citation magnets",
        body: [
          "A huge share of commercial AI queries are list-shaped: 'best project management tools', 'top CRMs for small business', 'cheapest ways to do X'. A listicle answers that query in the exact structure the engine wants to return - a set of named, comparable options. That structural match is why well-built lists get cited so often: the engine can lift your entries almost verbatim.",
        ],
      },
      {
        heading: "Lead with your selection criteria",
        body: [
          "The difference between a citable list and an ignorable one is transparency about how you chose. State your criteria up front - what you evaluated, who the list is for, what you excluded and why. This does two things: it builds the trust that makes an engine comfortable citing you, and it makes your list genuinely useful instead of an arbitrary ranking. A list that explains its reasoning is far more citable than one that just asserts a top 10.",
        ],
      },
      {
        heading: "Make each entry self-contained",
        body: ["Each item should stand on its own, because an engine may lift just one:"],
        bullets: [
          "A clear name/heading for the entry.",
          "What it is, in one plain sentence.",
          "Who it's best for and the key trade-off - the honest 'pick this if…'.",
          "Consistent structure across entries so they're comparable.",
        ],
      },
      {
        heading: "Honesty and freshness",
        body: [
          "Thin affiliate listicles that rank everything as 'amazing' get distrusted by engines and readers alike. Honest reasoning - including downsides and 'not for everyone' notes - is what earns the citation. And because list content (especially 'best of [year]') decays fast, dating it and keeping it current is a direct citation signal. A stale top-10 from two years ago won't be the engine's chosen answer.",
        ],
      },
    ],
    faqs: [
      { q: "Why do listicles get cited so often by AI?", a: "Because 'best X' / 'top Y' queries are extremely common, and a list's structure - named, comparable, self-contained entries - is exactly the form an engine wants to return. A well-built list is trivial to extract and attribute." },
      { q: "How do I make a listicle trustworthy?", a: "State your selection criteria up front, give honest reasoning per entry (including trade-offs), and avoid ranking everything as great. Transparency about how you chose is what makes an engine comfortable citing you." },
      { q: "How current does a listicle need to be?", a: "Very, especially 'best of [year]' posts - they decay fast. Date the content and update it as options change; freshness is a direct citation signal for list content." },
      { q: "Are affiliate listicles bad for GEO?", a: "Thin, everything-is-amazing affiliate dumps are - engines and readers distrust them. Affiliate links aren't the problem; lack of honest, criteria-based reasoning is. Genuinely useful lists with disclosed criteria get cited." },
    ],
    related: [
      { label: "Comparison pages AI engines cite", href: "/resources/comparison-pages-that-get-cited" },
      { label: "How to make your content quotable", href: "/resources/how-to-make-content-quotable" },
      { label: "Freshness and content decay", href: "/resources/freshness-and-content-decay" },
    ],
  },

  "glossary-pages-for-geo": {
    slug: "glossary-pages-for-geo",
    metaTitle: "Glossary & Definition Pages for GEO | GEOSEO",
    metaDescription:
      "Definition queries ('what is X') are pure citation opportunities. Here's how to build glossary and definition pages that AI engines lift as the canonical answer.",
    updated: "2026-06-30",
    readMins: 5,
    answer:
      "Glossary and definition pages win citations because 'what is X' is one of the most common question types in AI search, and a clean definition is the easiest possible passage to lift. The winning approach opens each term with a crisp, self-contained one-sentence definition, expands with context and examples, and links terms into a connected glossary that builds topical authority around your domain's vocabulary.",
    takeaways: [
      "'What is X' definition queries are abundant and map perfectly to citable answers.",
      "Open with a crisp, self-contained one-sentence definition - the part engines lift.",
      "Expand with context, examples, and how the term relates to others.",
      "Interlink terms into a connected glossary to build topical authority.",
      "Own your domain's vocabulary - being the cited definition makes you the category authority.",
    ],
    sections: [
      {
        heading: "Why definition pages are easy citations",
        body: [
          "Every field is full of 'what is X' and 'what does Y mean' questions, and AI engines answer them constantly. A definition page is the ideal citation target because the core answer is a single, self-contained sentence - exactly what an engine wants to lift. If you own the cleanest definition of the terms in your space, you become the engine's default source for your category's vocabulary.",
        ],
      },
      {
        heading: "Structure a citable definition",
        body: ["Lead with the definition, then add the depth that makes it genuinely useful:"],
        bullets: [
          "A crisp one-sentence definition at the very top - quotable in isolation.",
          "A short expansion: why it matters, where it's used.",
          "A concrete example that grounds the abstract term.",
          "Links to related terms so the concept sits in a web of context.",
        ],
      },
      {
        heading: "Build a connected glossary, not isolated pages",
        body: [
          "Individual definition pages are useful; an interlinked glossary is powerful. When your terms reference each other, you build a dense topical map that signals deep authority over your domain's vocabulary - and gives engines a coherent source to draw from across many related queries. A connected glossary is a topical-authority engine, not just a set of definitions.",
        ],
      },
      {
        heading: "Own the category vocabulary",
        body: [
          "Being the cited definition for the key terms in your space is a quiet but powerful position - it makes you the reference point for the whole category. Pair definitions with structured data where appropriate so they're machine-readable, and keep them accurate. This is some of the lowest-effort, highest-citation content you can build.",
        ],
      },
    ],
    faqs: [
      { q: "Are glossary pages worth building for GEO?", a: "Yes - they're among the highest-citation-per-effort content. 'What is X' queries are abundant, and a clean definition is the easiest passage for an engine to lift. They also build topical authority around your category's vocabulary." },
      { q: "How long should a definition page be?", a: "Lead with a one-sentence definition (the citable core), then expand with context, an example, and related-term links. Enough to be genuinely useful and distinct - not padded, but more than a bare dictionary line." },
      { q: "Should glossary terms link to each other?", a: "Yes. An interlinked glossary builds a dense topical map that signals deep domain authority and gives engines a coherent multi-query source - far more powerful than isolated definition pages." },
      { q: "Do definition pages need schema markup?", a: "It helps make the definition machine-readable and can support rich results, but the bigger win is the clean, self-contained definition sentence itself. Treat schema as a useful add-on, not a prerequisite." },
    ],
    related: [
      { label: "GEO glossary", href: "/resources/geo-glossary" },
      { label: "How to make your content quotable", href: "/resources/how-to-make-content-quotable" },
      { label: "Topical authority for GEO", href: "/resources/topical-authority-for-geo" },
    ],
  },

  "how-to-structure-a-pricing-page-for-geo": {
    slug: "how-to-structure-a-pricing-page-for-geo",
    metaTitle: "How to Structure a Pricing Page for GEO | GEOSEO",
    metaDescription:
      "'How much does X cost' is a high-intent AI query - but most pricing pages hide the answer. Here's how to structure a pricing page so AI engines can cite your pricing and you win the buyer.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "To make a pricing page work for GEO, state actual pricing information in clear, extractable text - because 'how much does X cost' is a high-intent buyer query, and engines can't cite pricing they can't read. Most pricing pages fail by hiding numbers behind 'contact us', graphics, or interactive widgets engines can't parse. The winning pricing page presents tiers, what's included, and at least an honest starting price or range in plain, structured text.",
    takeaways: [
      "'How much does X cost' is a top high-intent query - and a pricing page is the answer.",
      "Engines can't cite pricing locked in images, widgets, or 'contact us' - it must be readable text.",
      "State tiers, what's included, and at least a starting price or honest range in plain text.",
      "Transparency wins the buyer's trust and the citation; opacity loses both.",
      "If pricing is truly custom, give a representative range or 'starts at' rather than nothing.",
    ],
    sections: [
      {
        heading: "Why pricing is a high-intent GEO opportunity",
        body: [
          "'How much does [product/service] cost' is one of the highest-intent questions a buyer asks - they're close to a decision. AI engines field these constantly and try to answer with real numbers. If your pricing is the cited answer, you reach the buyer at the decision moment. The problem: most pricing pages make this impossible.",
        ],
      },
      {
        heading: "The mistakes that make pricing uncitable",
        body: ["These common patterns hide your pricing from engines entirely:"],
        bullets: [
          "Numbers baked into images or graphics - engines read text, not pixels.",
          "Pricing locked behind a 'contact sales' wall with no figures at all.",
          "Interactive sliders/calculators that compute client-side - the engine sees no number.",
          "Vague 'affordable / flexible pricing' copy with nothing concrete to lift.",
        ],
      },
      {
        heading: "Structure a citable pricing page",
        body: [
          "Present pricing as plain, structured text an engine can extract: clear tier names, the actual price (or an honest 'starts at' / range), and what each tier includes - ideally in a table or clean list. Even for custom/enterprise pricing, give a representative range or starting point rather than a bare 'contact us'. The goal is that an engine can answer 'how much does X cost' with a real number attributed to you.",
        ],
      },
      {
        heading: "Transparency wins twice",
        body: [
          "Pricing transparency earns the citation and the buyer's trust simultaneously. Buyers strongly prefer vendors who state their prices, and engines can only cite what they can read. Hiding pricing to 'capture the lead' increasingly backfires - the engine cites a transparent competitor instead, and you never enter the conversation. If you have any defensible number, publish it.",
        ],
      },
    ],
    faqs: [
      { q: "What if our pricing is fully custom/enterprise?", a: "Give a representative range or 'starts at' figure rather than a bare 'contact us'. Engines (and buyers) need something concrete to work with; a defensible starting point keeps you in the answer instead of ceding it to a transparent competitor." },
      { q: "Why can't AI cite our pricing page?", a: "Almost always because the numbers aren't readable text - they're in images, behind a contact-sales wall, or computed by a client-side widget. Engines read text; put your pricing in plain, structured text (ideally a table) to be citable." },
      { q: "Does hiding pricing help capture leads?", a: "Increasingly it backfires for GEO - the engine simply cites a transparent competitor and you're absent from the answer. Transparency wins both the citation and the buyer's trust at the decision moment." },
      { q: "Should pricing be in a table?", a: "A clean table or structured list is ideal - it lets engines extract tier, price, and inclusions cleanly, which is exactly the shape a pricing answer takes. Avoid image-based pricing tables." },
    ],
    related: [
      { label: "Using tables and lists so AI can extract your data", href: "/resources/how-to-use-tables-for-ai-extraction" },
      { label: "Page speed and AI crawlability", href: "/resources/page-speed-and-ai-crawlability" },
      { label: "CRO for organic landing pages", href: "/resources/cro-for-organic-landing-pages" },
    ],
  },

  "product-pages-for-ai-search": {
    slug: "product-pages-for-ai-search",
    metaTitle: "Optimizing Product Pages for AI Search | GEOSEO",
    metaDescription:
      "AI engines increasingly recommend specific products. Here's how to structure product pages - specs, use-cases, and Product schema - so engines cite yours in shopping answers.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "To optimize a product page for AI search, present clear specs, honest use-cases ('best for…'), and key attributes in extractable text plus Product structured data - because engines increasingly answer 'best product for X' and 'is [product] good for Y' by lifting product details. The winning product page reads less like a brochure and more like a structured answer to 'what is this, who is it for, and how does it compare'.",
    takeaways: [
      "Engines now recommend specific products - product pages are citation targets, not just storefronts.",
      "State specs and attributes as clean, extractable text, not just imagery.",
      "Answer 'who is this best for' and 'how does it compare' - the questions shoppers ask AI.",
      "Product structured data makes attributes machine-readable and supports rich results.",
      "Honest fit and trade-offs beat pure marketing - engines cite the trustworthy description.",
    ],
    sections: [
      {
        heading: "Why product pages now get cited",
        body: [
          "Shoppers increasingly ask engines 'best [product] for [need]', 'is [product] good for [use]', or 'alternatives to [product]'. To answer, engines lift product details - specs, use-cases, comparisons - from pages they can read. A product page built as a structured, honest answer to those questions becomes a citation target in shopping queries, not just a checkout step.",
        ],
      },
      {
        heading: "What makes a product page citable",
        body: ["Give engines the facts a recommendation needs:"],
        bullets: [
          "Clear specs and attributes in text (not only in images): size, materials, compatibility, key numbers.",
          "Honest 'best for' framing: who this product suits and who it doesn't.",
          "Comparison context: how it differs from alternatives or other tiers.",
          "Real use-cases and the practical 'what problem it solves'.",
        ],
      },
      {
        heading: "Add Product structured data",
        body: [
          "Product schema makes your attributes - name, description, price, availability, ratings - machine-readable, helping engines parse and trust your product facts and potentially earn rich results. It's the structured-data type most directly tied to shopping answers. Pair it with the readable text above; schema supports the content, it doesn't replace the need for clear on-page facts.",
        ],
      },
      {
        heading: "Honesty over brochure copy",
        body: [
          "Pure marketing copy ('the best product ever') gives an engine nothing trustworthy to lift. Honest fit and trade-offs - what it's great for, what it's not - is what makes a product description citable, because engines (and shoppers) trust balanced information. The product page that reads like an honest answer wins the recommendation over the one that reads like an ad.",
        ],
      },
    ],
    faqs: [
      { q: "Do AI engines actually recommend specific products?", a: "Increasingly, yes - shoppers ask 'best [product] for [need]' and engines answer by lifting product details from readable pages. A well-structured product page is a genuine citation target in shopping queries." },
      { q: "What's the most important thing on a product page for GEO?", a: "Clear, extractable specs and an honest 'who is this best for' framing - the facts a recommendation needs - in text, not just images. Product schema then makes those facts machine-readable." },
      { q: "Is Product schema required?", a: "Not required, but high-value - it makes attributes machine-readable and supports rich results for shopping queries. It supports clear on-page text; it doesn't replace it." },
      { q: "Should product pages mention competitors?", a: "Honest comparison context helps - shoppers ask 'how does it compare', and balanced framing makes your page more citable. You don't need a full competitor teardown, just honest 'how it differs' context." },
    ],
    related: [
      { label: "GEO for ecommerce: products in AI answers", href: "/resources/geo-for-ecommerce" },
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "Comparison pages AI engines cite", href: "/resources/comparison-pages-that-get-cited" },
    ],
  },

  "about-pages-and-eeat": {
    slug: "about-pages-and-eeat",
    metaTitle: "About Pages and E-E-A-T for AI Search | GEOSEO",
    metaDescription:
      "Your About page is an E-E-A-T signal engines actually read. Here's how to write one that establishes who you are, why you're credible, and makes your whole site more citable.",
    updated: "2026-06-30",
    readMins: 5,
    answer:
      "A strong About page raises your whole site's citability because it's where engines establish your organization as a trustworthy entity - who you are, your expertise, and why you're credible. Most About pages waste this with vague 'we're passionate about…' copy; the citable version states concrete facts about your experience, expertise, people, and track record that corroborate the authority behind every other page you publish.",
    takeaways: [
      "The About page is a primary E-E-A-T signal engines read to assess your trustworthiness as an entity.",
      "Concrete facts - experience, expertise, people, track record - beat vague 'passionate about' copy.",
      "A credible About page raises citability across your whole site, not just itself.",
      "Connect your organization to real, named people and verifiable credentials.",
      "Consistent entity data (name, founding, location) helps engines disambiguate and trust you.",
    ],
    sections: [
      {
        heading: "Why the About page matters for GEO",
        body: [
          "When an engine weighs whether to trust your content, it assesses the entity behind it - and the About page is where that entity is defined. E-E-A-T (experience, expertise, authoritativeness, trustworthiness) isn't an on-page score you set; it's inferred from signals, and your About page is one of the clearest. A credible, factual About page makes every other page on your site more citable, because it establishes the authority the content rests on.",
        ],
      },
      {
        heading: "What a citable About page contains",
        body: ["Replace vague mission-speak with concrete, verifiable substance:"],
        bullets: [
          "Who you are: real organization details, founding, location, scale.",
          "Why you're credible: experience, track record, specific expertise and results.",
          "The people: named team members with genuine credentials, linked to author bios.",
          "Proof: recognition, partnerships, data, or other verifiable trust signals.",
        ],
      },
      {
        heading: "Connect to real people and entities",
        body: [
          "Engines trust organizations connected to real, named, credentialed people. Link your About page to author bios, name your leadership and experts, and make your organization a clear entity engines can recognize and corroborate against other web sources. An anonymous 'we' is far weaker than a named, verifiable team.",
        ],
      },
      {
        heading: "Consistency disambiguates you",
        body: [
          "Consistent entity data - your exact name, founding date, location, and key facts repeated accurately across the web - helps engines disambiguate you from similarly-named entities and builds the corroboration that underpins trust. Pair your About page with Organization structured data so these facts are machine-readable.",
        ],
      },
    ],
    faqs: [
      { q: "Does an About page really affect AI citations?", a: "Yes, indirectly but significantly. It's where engines establish your organization as a trustworthy entity (E-E-A-T), which raises citability across your whole site. A vague About page wastes a real trust signal." },
      { q: "What should a GEO-optimized About page include?", a: "Concrete, verifiable substance: real org details, your experience and track record, named credentialed people (linked to author bios), and proof points - not vague 'we're passionate about' copy." },
      { q: "Should the About page name specific people?", a: "Yes. Engines trust organizations connected to real, named, credentialed individuals far more than an anonymous 'we'. Name your team and link to author bios." },
      { q: "Does Organization schema help?", a: "Yes - it makes your entity facts (name, founding, location, profiles) machine-readable and aids disambiguation and corroboration. Pair it with a factual About page." },
    ],
    related: [
      { label: "E-E-A-T for AI search", href: "/resources/eeat-for-ai-search" },
      { label: "Author bios and E-E-A-T", href: "/resources/author-bios-and-eeat" },
      { label: "Entity SEO explained", href: "/resources/entity-seo-explained" },
    ],
  },

  "author-bios-and-eeat": {
    slug: "author-bios-and-eeat",
    metaTitle: "Author Bios and E-E-A-T for AI Search | GEOSEO",
    metaDescription:
      "Named, credentialed authors make content more citable - especially for health, finance, and other high-trust topics. Here's how to build author bios that strengthen E-E-A-T.",
    updated: "2026-06-30",
    readMins: 5,
    answer:
      "Author bios strengthen citability by attaching content to a real, credentialed person engines can recognize and trust - which matters most for high-stakes (YMYL) topics like health, finance, and legal. The citable author bio states genuine credentials and relevant experience, links the author to their work across the web, and is connected via structured data so the expertise behind a page is verifiable, not anonymous.",
    takeaways: [
      "Named, credentialed authors make content more citable, especially for high-trust topics.",
      "A bio should state genuine, relevant expertise - not a generic 'content writer' line.",
      "Link authors to their body of work and external profiles to build a recognizable entity.",
      "Anonymous content is a trust liability for YMYL topics engines scrutinize heavily.",
      "Author/Person structured data makes the expertise machine-readable.",
    ],
    sections: [
      {
        heading: "Why authorship is a citation signal",
        body: [
          "Engines assess whether the person behind a claim is qualified to make it - part of the 'expertise' and 'experience' in E-E-A-T. Content attributed to a named author with relevant credentials is more trustworthy, and therefore more citable, than anonymous text. This is strongest for YMYL topics (health, finance, legal, safety) where engines apply extra scrutiny and an unqualified or anonymous source is a reason not to cite.",
        ],
      },
      {
        heading: "What a citable author bio contains",
        body: ["Make the expertise concrete and relevant to what they write:"],
        bullets: [
          "Genuine credentials relevant to the topic (degrees, licenses, years of practice).",
          "Specific experience that establishes why they can speak on it.",
          "A real name and photo - a recognizable person, not a pseudonym.",
          "Links to their other work and external profiles.",
        ],
      },
      {
        heading: "Build the author as a recognizable entity",
        body: [
          "An author bio is stronger when the author exists as a consistent entity across the web - their work on your site, contributions elsewhere, professional profiles, all connected. This lets engines recognize and corroborate the person, reinforcing the expertise signal. A one-off bio with no external footprint is weaker than a connected, verifiable author identity.",
        ],
      },
      {
        heading: "Match authors to topics honestly",
        body: [
          "The signal only works if it's genuine: the author's expertise should actually match the content. Slapping a credentialed name on content they didn't write, or claiming irrelevant expertise, is both dishonest and ineffective - engines corroborate, and mismatches erode trust. Have real experts write (or genuinely review) the content their name carries, and use Person/author structured data to make it machine-readable.",
        ],
      },
    ],
    faqs: [
      { q: "Do author bios really affect AI citations?", a: "Yes, especially for high-trust (YMYL) topics. Content attributed to a named, credentialed author is more trustworthy and citable than anonymous text - engines assess whether the person behind a claim is qualified to make it." },
      { q: "What makes an author bio strong for E-E-A-T?", a: "Genuine, topic-relevant credentials and experience, a real name and photo, and links to the author's other work and profiles - so engines can recognize and corroborate a real, qualified person." },
      { q: "Is anonymous content bad for GEO?", a: "It's a trust liability, particularly for health, finance, and legal topics under heavy scrutiny. Named, credentialed authorship is part of what makes such content citable; anonymity is a reason engines may route around it." },
      { q: "Can I put an expert's name on content they didn't write?", a: "No - that's dishonest and ineffective. Engines corroborate, and mismatched expertise erodes trust. Have real experts write or genuinely review the content their name carries." },
    ],
    related: [
      { label: "E-E-A-T for AI search", href: "/resources/eeat-for-ai-search" },
      { label: "About pages and E-E-A-T", href: "/resources/about-pages-and-eeat" },
      { label: "How AI engines choose sources", href: "/resources/how-ai-engines-choose-sources" },
    ],
  },

  "case-studies-for-geo": {
    slug: "case-studies-for-geo",
    metaTitle: "Case Studies for GEO: Proof That Gets Cited | GEOSEO",
    metaDescription:
      "Case studies are proof engines and buyers trust - if they're specific and verifiable. Here's how to write case studies with the concrete results and detail that earn AI citations.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "Case studies earn citations when they contain specific, verifiable results - real numbers, named context, and a concrete before/after - because engines and buyers both treat genuine proof as a strong trust signal. The winning case study is precise rather than vague ('cut response time from 8 hours to 40 minutes', not 'dramatically improved efficiency') and structured so the result is a self-contained, liftable claim.",
    takeaways: [
      "Case studies are proof - specific, verifiable results are a strong trust and citation signal.",
      "Precision wins: real numbers and concrete before/after beat vague 'improved efficiency'.",
      "Structure the result as a self-contained, liftable claim engines can attribute.",
      "Context matters - who, what situation, what was tried - so the result is credible, not cherry-picked.",
      "Never fabricate results; unverifiable or inflated claims fail corroboration and erode trust.",
    ],
    sections: [
      {
        heading: "Why case studies make good citations",
        body: [
          "When someone asks an engine 'does X actually work' or 'results from using Y', a concrete case study is exactly the kind of evidence the engine wants - real proof, attributable to you. Case studies also build the trust that underpins commercial decisions. But only specific ones work: a vague 'we helped a client succeed' gives the engine nothing to lift, while a precise result becomes a citable data point.",
        ],
      },
      {
        heading: "Precision is everything",
        body: ["Replace adjectives with numbers and specifics:"],
        bullets: [
          "Concrete metrics: 'reduced X from A to B', 'increased Y by Z%' - real, measured figures.",
          "A clear before/after that frames the change.",
          "The specific context: who, what situation, what was actually done.",
          "A self-contained result statement that's quotable in isolation.",
        ],
      },
      {
        heading: "Context makes results credible",
        body: [
          "A number without context reads as cherry-picked. The credible case study explains the situation, what was tried, and why the result is representative - giving engines and readers reason to trust it. Honest context (including what didn't work or caveats) makes the proof stronger, not weaker, because it signals you're not just showcasing your best-ever outcome.",
        ],
      },
      {
        heading: "Never fabricate",
        body: [
          "The fastest way to destroy a case study's value is to inflate or invent results. Engines corroborate claims, and buyers verify them; unsupportable numbers fail both tests and damage trust across your whole site. Use real, verifiable results - ideally ones the client will confirm. Genuine, modest proof beats spectacular fiction every time for citability.",
        ],
      },
    ],
    faqs: [
      { q: "What makes a case study citable by AI?", a: "Specific, verifiable results - real numbers and a concrete before/after - structured as a self-contained, liftable claim, with enough context to be credible. Vague 'we helped a client succeed' gives an engine nothing to cite." },
      { q: "How specific do case study results need to be?", a: "As specific as honestly possible: 'cut response time from 8 hours to 40 minutes' beats 'dramatically improved efficiency'. Precise, measured figures are what engines lift and buyers trust." },
      { q: "Should I include context and caveats?", a: "Yes - context (who, what situation, what was done) makes results credible rather than cherry-picked, and honest caveats strengthen trust. They signal you're showing a representative result, not just a best-case anomaly." },
      { q: "Is it okay to round up or estimate results?", a: "Use real, verifiable numbers - ideally ones the client confirms. Inflated or invented results fail corroboration and erode trust across your site. Genuine modest proof beats spectacular fiction for citability." },
    ],
    related: [
      { label: "Statistics and original data for GEO", href: "/resources/statistics-and-original-data-for-geo" },
      { label: "E-E-A-T for AI search", href: "/resources/eeat-for-ai-search" },
      { label: "How AI engines choose sources", href: "/resources/how-ai-engines-choose-sources" },
    ],
  },

  "how-to-content-for-ai-search": {
    slug: "how-to-content-for-ai-search",
    metaTitle: "How-To Content for AI Search (+ HowTo Schema) | GEOSEO",
    metaDescription:
      "Step-by-step 'how to' content is among the most-cited in AI answers. Here's how to structure tutorials - clear ordered steps, prerequisites, and HowTo schema - so engines lift your instructions.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "How-to content gets cited when it's structured as clear, ordered, self-contained steps with stated prerequisites and outcomes - because 'how do I do X' is one of the most common AI queries and a clean step sequence is ideal for an engine to extract. The winning tutorial leads with what the reader will achieve, lists prerequisites, numbers the steps so each is independently clear, and uses structured data to mark up the procedure.",
    takeaways: [
      "'How do I do X' is a dominant query type - step-by-step content maps directly to it.",
      "Use clear, ordered, numbered steps - each self-contained and actionable.",
      "State prerequisites and the end outcome up front so the reader knows scope.",
      "Genuine, tested instructions beat thin outlines - engines and readers reward accuracy.",
      "Structured data for procedures helps engines parse and present your steps.",
    ],
    sections: [
      {
        heading: "Why how-to content is citation-rich",
        body: [
          "Instructional queries - 'how to do X', 'steps to Y', 'how do I set up Z' - are a huge share of what people ask AI engines. A well-structured tutorial answers them in the exact form an engine wants: an ordered sequence of actionable steps. That structural fit makes good how-to content highly citable, because the engine can lift your steps almost directly into its answer.",
        ],
      },
      {
        heading: "Structure for extraction",
        body: ["Make the procedure easy to follow and easy to lift:"],
        bullets: [
          "Lead with the outcome: what the reader will accomplish.",
          "List prerequisites: tools, accounts, prior steps, or knowledge needed.",
          "Number the steps; keep each one a single, clear, self-contained action.",
          "Add brief context per step where it prevents mistakes, without burying the action.",
        ],
      },
      {
        heading: "Accuracy over thin outlines",
        body: [
          "Thin how-to content that lists vague steps without real detail doesn't get cited - and frustrates readers who try to follow it. Genuinely tested, accurate instructions (the actual clicks, settings, gotchas) are what earn the citation and the trust. If you've really done the thing, your steps will be specific in a way generic AI-generated outlines can't match - and that specificity is the moat.",
        ],
      },
      {
        heading: "Mark up the procedure",
        body: [
          "Structured data for how-to procedures helps engines understand your content as a step sequence and can support richer presentation. Combined with clean numbered steps in the HTML, it reinforces the extractable structure. As always, the schema supports well-structured content - it doesn't substitute for clear, accurate, ordered steps.",
        ],
      },
    ],
    faqs: [
      { q: "Why is how-to content so citable?", a: "Because 'how do I do X' is a dominant query type, and a clean ordered step sequence is exactly the form an engine wants to return. Well-structured tutorials can be lifted almost directly into AI answers." },
      { q: "How should I structure a tutorial for GEO?", a: "Lead with the outcome, list prerequisites, then number self-contained steps - each a single clear action. Add brief per-step context to prevent mistakes, and mark up the procedure with structured data." },
      { q: "Does generic AI-generated how-to content rank?", a: "Thin, vague step lists rarely get cited and frustrate readers. Genuinely tested instructions with real specifics (exact settings, gotchas) win - that specificity is the moat generic outlines can't match." },
      { q: "Is HowTo structured data worth adding?", a: "It helps engines parse your steps and can support richer presentation. Pair it with clean numbered steps in the HTML - the schema reinforces good structure but doesn't replace it." },
    ],
    related: [
      { label: "Heading structure for SEO and AI extraction", href: "/resources/heading-structure-for-seo-and-ai" },
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "How to make your content quotable", href: "/resources/how-to-make-content-quotable" },
    ],
  },

  "landing-pages-for-ai-search": {
    slug: "landing-pages-for-ai-search",
    metaTitle: "Landing Pages for AI Search Traffic | GEOSEO",
    metaDescription:
      "AI-referred visitors arrive pre-informed and high-intent. Here's how to design landing pages that convert AI-search traffic - matching the answer they came from and removing friction.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "Landing pages for AI-search traffic should match the specific answer the visitor came from and move fast to the next step - because AI-referred visitors arrive pre-informed and high-intent, having already gotten context from the engine. Unlike cold ad traffic that needs full persuasion, these visitors clicked through because they're close to acting, so the winning landing page confirms relevance immediately, avoids re-explaining what they already know, and removes friction from the conversion.",
    takeaways: [
      "AI-referred visitors arrive pre-informed and high-intent - they already got context from the engine.",
      "Match the landing page to the answer/question they came from; don't make them re-orient.",
      "Don't re-explain basics they already learned - move them toward the action.",
      "Remove friction: clear next step, fast page, no unnecessary form fields.",
      "These visitors convert differently from cold ad traffic - design for warm, informed intent.",
    ],
    sections: [
      {
        heading: "Why AI-search traffic is different",
        body: [
          "A visitor who arrives from an AI answer has already been briefed - the engine explained the topic, compared options, and named you. They click through warm, informed, and closer to a decision than cold search or ad traffic. Treating them like a stranger who needs the full pitch wastes that head start. The landing page's job is to confirm they're in the right place and accelerate the next step, not to re-teach what they just learned.",
        ],
      },
      {
        heading: "Match the page to the answer",
        body: [
          "The visitor came from a specific question and a specific framing of you. The landing page should immediately confirm relevance - reflecting the topic and intent they arrived with - so there's no jarring mismatch between 'what the engine said' and 'what the page shows'. A generic homepage often breaks this; a page that speaks to their specific need keeps the thread intact and the momentum going.",
        ],
      },
      {
        heading: "Remove friction to the next step",
        body: ["Warm, informed visitors convert when the path is clear:"],
        bullets: [
          "One obvious primary action, stated plainly.",
          "A fast-loading page - speed matters for intent that can cool quickly.",
          "Minimal form friction - ask only for what you truly need now.",
          "Trust signals (proof, reviews) to confirm the decision they're leaning toward.",
        ],
      },
      {
        heading: "Design for warm intent",
        body: [
          "Conversion best-practices built for cold ad traffic - heavy persuasion, long explainers, aggressive capture - can actually hurt with AI-referred visitors, who are further along. Lean toward confirmation and ease: reassure relevance, surface proof, and make acting effortless. Measure these visitors separately where you can, since their behavior and conversion path differ from other channels.",
        ],
      },
    ],
    faqs: [
      { q: "How is AI-search traffic different from ad traffic?", a: "AI-referred visitors arrive pre-informed and high-intent - the engine already explained the topic and named you. They need confirmation and an easy next step, not the full cold-traffic persuasion sequence." },
      { q: "Should AI traffic land on the homepage?", a: "Usually not - a generic homepage breaks the thread from the specific question they came with. A page that matches their intent and confirms relevance keeps the momentum and converts better." },
      { q: "What kills conversion for AI-referred visitors?", a: "Re-explaining what they already learned, a slow page, heavy form friction, and a mismatch between the engine's framing and the page. Warm, informed visitors want a clear, fast path to act." },
      { q: "Should I measure AI traffic separately?", a: "Where you can, yes - its behavior and conversion path differ from cold search and ads. Separate measurement lets you design and optimize specifically for warm, informed intent." },
    ],
    related: [
      { label: "CRO for organic landing pages", href: "/resources/cro-for-organic-landing-pages" },
      { label: "Turn AI traffic into leads", href: "/resources/turn-ai-traffic-into-leads" },
      { label: "Lead capture on content pages", href: "/resources/lead-capture-on-content-pages" },
    ],
  },

  "video-content-and-geo": {
    slug: "video-content-and-geo",
    metaTitle: "Video Content and GEO: Making Video Citable | GEOSEO",
    metaDescription:
      "AI engines can't watch video, but they can read transcripts. Here's how to make your video content citable - transcripts, summaries, and structured pages that surface the knowledge inside.",
    updated: "2026-06-30",
    readMins: 5,
    answer:
      "To make video content work for GEO, surface its knowledge as readable text - transcripts, summaries, and answer-shaped pages - because AI engines can't watch video but can cite the text around and inside it. The valuable knowledge in a webinar, tutorial, or talk is invisible to engines until you transcribe and structure it; the winning approach pairs every meaningful video with an extractable text version of its key answers.",
    takeaways: [
      "Engines can't watch video - the knowledge is invisible until it's available as text.",
      "Transcripts and summaries turn video knowledge into citable, extractable content.",
      "Build an answer-shaped page around the video, not just an embed.",
      "One video often contains several distinct answers - split them into focused text.",
      "Video schema and clear titles help, but readable text is what gets cited.",
    ],
    sections: [
      {
        heading: "Why video is invisible to engines without text",
        body: [
          "A webinar or tutorial may contain your best, most citable answers - but an AI engine can't watch it. To the engine, an un-transcribed video is a black box. The knowledge inside only becomes citable when it exists as text the engine can read. This is the central GEO problem with video: the value is real, but it's locked in a format engines can't extract.",
        ],
      },
      {
        heading: "Surface the knowledge as text",
        body: ["Turn each meaningful video into extractable content:"],
        bullets: [
          "Publish a transcript - the full text makes the spoken knowledge readable.",
          "Add a clear summary and key takeaways near the top of the page.",
          "Pull out the specific answers the video gives into answer-shaped sections.",
          "Use descriptive titles and headings, not just 'Webinar #14'.",
        ],
      },
      {
        heading: "One video, several answers",
        body: [
          "A single talk often answers multiple distinct questions - 'what is X', 'how to do X', 'X vs Y'. Rather than one page with a raw transcript, consider pulling those into focused, answer-shaped text (on the video page or as separate pages), each matching a specific query. This mirrors the repurposing approach: reshape the spoken knowledge into the form engines cite, don't just dump a transcript.",
        ],
      },
      {
        heading: "Schema helps, text wins",
        body: [
          "Video structured data (with transcript, description, and key moments) helps engines understand the video exists and what it covers, and can support rich presentation. But the citation itself comes from the readable text - the transcript and answer-shaped summary. Treat video schema as useful context and the text version as the thing that actually gets cited.",
        ],
      },
    ],
    faqs: [
      { q: "Can AI engines cite my video content?", a: "Not the video itself - they can't watch it. They cite the readable text around and inside it: transcripts, summaries, and answer-shaped pages. Un-transcribed video is invisible to engines, so surface its knowledge as text." },
      { q: "Is a transcript enough?", a: "It's the baseline. Better is a transcript plus a clear summary, key takeaways, and the video's specific answers pulled into answer-shaped sections - reshaping the spoken knowledge into the form engines cite, not just a raw dump." },
      { q: "Should I make separate pages for one video's topics?", a: "Often yes - a single talk usually answers several distinct questions. Splitting them into focused, answer-shaped text matches specific queries better than one page with a raw transcript." },
      { q: "Does video schema get me cited?", a: "It helps engines understand the video and can support rich presentation, but the citation comes from the readable text (transcript + summary). Use schema as context; rely on text for the citation." },
    ],
    related: [
      { label: "Repurposing existing content for AI search", href: "/resources/repurposing-content-for-ai-search" },
      { label: "How to make your content quotable", href: "/resources/how-to-make-content-quotable" },
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
    ],
  },
};
