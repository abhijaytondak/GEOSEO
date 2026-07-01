import type { Article } from "@/components/resources/content-types";

export const BATCH_INTERNATIONAL: Record<string, Article> = {
  "geo-for-non-english-markets": {
    slug: "geo-for-non-english-markets",
    metaTitle: "GEO for Non-English Markets | Citensity",
    metaDescription:
      "AI engines answer in dozens of languages, and non-English markets are often less contested. Here's how to earn citations in non-English AI answers - with genuinely localized, not translated, content.",
    updated: "2026-07-02",
    readMins: 6,
    answer:
      "To win citations in non-English markets, publish genuinely localized content in the target language - not machine-translated English - because AI engines answer in the user's language by drawing on sources in that language, and native-quality, culturally-relevant content is what they cite. Non-English markets are frequently less contested than English, so strong localized content can earn citations faster, but only if it reads as native and answers the market's real questions.",
    takeaways: [
      "AI engines answer in the user's language, drawing on sources in that language.",
      "Non-English markets are often less contested - a real opportunity to win citations faster.",
      "Localize genuinely; machine-translated English rarely reads native enough to be cited.",
      "Answer the market's real questions, which differ from the English-market ones.",
      "Native review of language and cultural fit is the difference-maker.",
    ],
    sections: [
      {
        heading: "Why non-English markets are an opportunity",
        body: [
          "AI engines serve answers in dozens of languages, pulling from sources written in each. Many businesses optimize only for English, leaving non-English AI answers less contested - which means strong, genuinely localized content can earn citations faster there than in the crowded English space. If your market includes non-English speakers, being the citable source in their language is often lower-hanging fruit than competing globally in English.",
        ],
      },
      {
        heading: "Localize, don't just translate",
        body: [
          "The critical distinction: machine-translating your English pages usually produces content that reads as non-native and answers English-market framings, which engines are less likely to cite for native speakers. Genuine localization means content written (or thoroughly adapted) in the target language, phrased the way natives actually ask questions, with local context. It's more effort than translation, but it's what earns native-language citations.",
        ],
      },
      {
        heading: "Answer the market's real questions",
        body: [
          "Questions differ by market - not just in language but in substance. Local regulations, norms, products, and concerns shape what people ask AI engines. Research the actual queries in each target market rather than translating your English question list. The winning content answers what that market asks, in its language, grounded in its context.",
        ],
      },
      {
        heading: "Native review is the difference-maker",
        body: [
          "The single biggest quality lever is native review: someone fluent who confirms the content reads naturally and is culturally appropriate. AI engines (and native readers) can tell awkward, translated-feeling content from native content, and citability tracks with quality. If you can't produce genuinely native content in a market, it's often better to wait than to publish translated content that won't get cited and may misrepresent you.",
        ],
      },
    ],
    faqs: [
      { q: "Can I just translate my English content for other markets?", a: "Machine translation rarely reads native enough to earn citations for native speakers, and it answers English-market framings. Genuine localization - content adapted in-language to how locals actually ask, with local context - is what AI engines cite. Native review is the quality difference-maker." },
      { q: "Why are non-English markets a GEO opportunity?", a: "AI engines answer in many languages from sources in each, and most businesses optimize only for English - leaving non-English answers less contested. Strong localized content can earn citations faster there than in the crowded English space." },
      { q: "Do people ask AI different questions in different markets?", a: "Yes - local regulations, norms, products, and concerns shape the questions, not just the language. Research each market's actual queries rather than translating your English list; answer what that market asks, in its context." },
      { q: "What's the minimum bar for non-English GEO content?", a: "Genuinely native quality - content that reads naturally to a fluent speaker and is culturally appropriate, ideally native-reviewed. Below that bar, translated-feeling content won't get cited and can misrepresent you; waiting beats publishing it." },
    ],
    related: [
      { label: "Multilingual GEO: getting cited across languages", href: "/resources/multilingual-geo" },
      { label: "Cultural localization for GEO", href: "/resources/cultural-localization-for-geo" },
      { label: "How AI engines handle languages", href: "/resources/how-ai-engines-handle-languages" },
    ],
  },

  "hreflang-and-international-geo": {
    slug: "hreflang-and-international-geo",
    metaTitle: "hreflang and International GEO | Citensity",
    metaDescription:
      "hreflang tells engines which language/region version of a page to serve. Here's how it works, why it matters for international AI search, and how to implement it without the common mistakes.",
    updated: "2026-07-02",
    readMins: 6,
    answer:
      "hreflang is markup that tells search and AI engines which language and regional version of a page to serve to which users, preventing the wrong-language version from being shown or cited and stopping your localized pages from competing with each other. For international GEO it ensures engines understand your language/region variants as alternates of the same content - implement it with reciprocal, correctly-coded annotations across every version, and validate, because hreflang errors are common and silently break targeting.",
    takeaways: [
      "hreflang maps language/region versions so engines serve/cite the right one to each user.",
      "It prevents localized versions from competing with each other and wrong-language display.",
      "Annotations must be reciprocal - every version references all the others, including itself.",
      "Use correct language (and optional region) codes; wrong codes silently break it.",
      "Validate - hreflang errors are common and fail quietly.",
    ],
    sections: [
      {
        heading: "What hreflang does",
        body: [
          "When you have the same content in multiple languages or regional variants, hreflang annotations tell engines 'these are alternate versions of each other - serve the right one to each user.' Without it, engines can show or cite the wrong-language version, or treat your variants as competing duplicates. For international GEO, hreflang is how you make your localized pages a coherent set rather than a confusing pile.",
        ],
      },
      {
        heading: "The rules that matter",
        body: ["hreflang is powerful but unforgiving - get these right:"],
        bullets: [
          "Reciprocal: if page A points to B as an alternate, B must point back to A (and each version should reference itself).",
          "Correct codes: valid language codes (and optional region codes) - wrong codes are ignored.",
          "Complete set: every version links to every other version.",
          "Consistent method: implement via HTML head, HTTP headers, or the sitemap - and be consistent.",
        ],
      },
      {
        heading: "Common mistakes",
        body: [
          "hreflang errors are among the most common international-SEO problems because they fail silently - no visible breakage, just wrong targeting. The usual culprits: non-reciprocal annotations (A points to B, B doesn't point back), invalid or region-only codes, missing self-references, and incomplete sets. Because nothing looks broken, these persist until you specifically validate.",
        ],
      },
      {
        heading: "Validate and pair with real localization",
        body: [
          "Always validate hreflang with a dedicated tool - it's the only way to catch the silent errors. And remember hreflang only routes users to the right version; it doesn't make thin or translated content citable. Pair correct hreflang with genuinely localized content: the markup ensures the right version is served, and the localization quality is what earns the citation in that market.",
        ],
      },
    ],
    faqs: [
      { q: "What does hreflang do for international GEO?", a: "It tells engines which language/region version of a page to serve or cite to which users, preventing wrong-language display and stopping your localized versions from competing as duplicates. It makes your variants a coherent alternate set." },
      { q: "What's the most common hreflang mistake?", a: "Non-reciprocal annotations - page A references B as an alternate but B doesn't reference back (and missing self-references). These, plus invalid language/region codes, fail silently with no visible breakage, so they persist until you specifically validate." },
      { q: "Where do I put hreflang annotations?", a: "In the HTML head, HTTP headers, or the XML sitemap - pick one method and be consistent. Whichever you use, annotations must be reciprocal and complete across every version." },
      { q: "Does hreflang make my localized pages citable?", a: "No - it only routes the right version to the right user. Citability comes from genuinely localized, high-quality content. Pair correct hreflang with real localization; the markup handles targeting, the content earns the citation." },
    ],
    related: [
      { label: "GEO for multi-region brands", href: "/resources/geo-for-multi-region-brands" },
      { label: "Multilingual GEO: getting cited across languages", href: "/resources/multilingual-geo" },
      { label: "GEO for non-English markets", href: "/resources/geo-for-non-english-markets" },
    ],
  },

  "geo-for-multi-region-brands": {
    slug: "geo-for-multi-region-brands",
    metaTitle: "GEO for Multi-Region Brands | Citensity",
    metaDescription:
      "Serving several countries or regions? Here's how to structure GEO for multi-region brands - region-specific content, correct targeting, and consistent global authority.",
    updated: "2026-07-02",
    readMins: 6,
    answer:
      "For multi-region brands, GEO means balancing region-specific content (localized to each market's language, regulations, and questions) with a consistent global brand entity, and using correct technical targeting (hreflang, regional URLs) so engines serve and cite the right version per market. The challenge is coherence at scale: each region needs genuinely local content, but they must ladder up to one recognizable, authoritative brand rather than fragmenting into disconnected sites.",
    takeaways: [
      "Balance region-specific localized content with a consistent global brand entity.",
      "Each region needs genuinely local content - language, regulations, and real questions.",
      "Use correct targeting (hreflang, regional URL structure) so engines cite the right version.",
      "Maintain one coherent brand entity so authority ladders up, not fragments.",
      "Coordinate centrally to avoid inconsistent or competing regional content.",
    ],
    sections: [
      {
        heading: "The multi-region balancing act",
        body: [
          "Multi-region GEO is a balance between two forces: local relevance (each market needs content in its language, tuned to its regulations, norms, and questions) and global coherence (all regions should reinforce one recognizable, authoritative brand). Lean too far local and you get fragmented, inconsistent sites; too far global and you get generic content that doesn't win any specific market. The art is genuine localization that still ladders up to one brand.",
        ],
      },
      {
        heading: "Region-specific content done right",
        body: [
          "Each region's content should be genuinely localized - not translated - answering that market's real questions with local context. This is the same localize-don't-translate principle applied at scale. Prioritize by opportunity: not every region needs the same depth, so invest most where the market is biggest or least contested, and be honest about where you can produce native-quality content.",
        ],
      },
      {
        heading: "Technical targeting",
        body: ["Make engines serve and cite the right version per market:"],
        bullets: [
          "hreflang across all language/region versions (reciprocal, correctly coded).",
          "A clear regional URL structure (subdirectories, subdomains, or ccTLDs - pick one and be consistent).",
          "Region-appropriate entity and local business data where relevant.",
          "Localized metadata and structured data per version.",
        ],
      },
      {
        heading: "One coherent brand entity",
        body: [
          "The through-line is entity consistency: engines should understand all your regional presences as one authoritative brand. Consistent core brand data, Organization schema, and cross-linking help authority ladder up rather than splitting across disconnected regional sites. Central coordination - shared standards, one quality bar - is what keeps multi-region GEO coherent instead of a pile of competing local efforts.",
        ],
      },
    ],
    faqs: [
      { q: "How do I balance local vs global in multi-region GEO?", a: "Genuinely localize each market's content (language, regulations, real questions) while keeping one consistent, recognizable brand entity so authority ladders up. Too local fragments you; too global wins no specific market. Central coordination and shared standards hold it together." },
      { q: "What URL structure should multi-region brands use?", a: "Subdirectories, subdomains, or country-code TLDs all work - pick one and be consistent, paired with correct hreflang. Consistency and correct targeting matter more than which structure you choose." },
      { q: "Do all regions need equal investment?", a: "No - prioritize by opportunity (biggest or least-contested markets) and by where you can produce native-quality content. Uneven depth is fine; thin or translated content in a market you can't localize well is not." },
      { q: "How do I keep authority from fragmenting across regions?", a: "Entity consistency - consistent core brand data, Organization schema, and cross-linking - so engines understand all regional presences as one authoritative brand. Central coordination and a shared quality bar prevent disconnected, competing sites." },
    ],
    related: [
      { label: "hreflang and international GEO", href: "/resources/hreflang-and-international-geo" },
      { label: "GEO and brand building", href: "/resources/geo-and-brand-building" },
      { label: "Entity SEO explained", href: "/resources/entity-seo-explained" },
    ],
  },

  "cultural-localization-for-geo": {
    slug: "cultural-localization-for-geo",
    metaTitle: "Cultural Localization for GEO | Citensity",
    metaDescription:
      "Real localization goes beyond language to culture - examples, norms, and framing. Here's why cultural localization matters for AI citations and how to do it credibly.",
    updated: "2026-07-02",
    readMins: 5,
    answer:
      "Cultural localization for GEO means adapting content to a market's culture - its examples, norms, references, and how people frame problems - not just its language, because content that feels culturally native is more trustworthy and citable to that market's AI answers. Genuine cultural fit signals authentic local relevance, which engines and native readers reward; culturally off content reads as foreign even when the translation is technically correct.",
    takeaways: [
      "Localization is cultural, not just linguistic - examples, norms, references, framing.",
      "Culturally native content is more trustworthy and citable to a market's AI answers.",
      "Technically-correct translation can still read as culturally foreign.",
      "Local examples, units, currencies, and references signal authentic relevance.",
      "Local expertise (not just translation) is what produces genuine cultural fit.",
    ],
    sections: [
      {
        heading: "Beyond language to culture",
        body: [
          "Two pieces of content can be in the same language yet feel native to one market and foreign to another. Cultural localization is the layer beyond translation: the examples you use, the norms you assume, the references you make, and how you frame problems. Content that gets these right feels genuinely local; content that's merely translated often feels imported, even when every word is correct.",
        ],
      },
      {
        heading: "Why cultural fit affects citability",
        body: [
          "AI engines aim to serve answers that are relevant to the user, and cultural relevance is part of that. Content that reflects a market's real context - its examples, concerns, and framing - reads as authentically for that audience, which supports the trust that underpins citation. Native readers (and the signals they generate) reward it too. Culturally off content, by contrast, signals that you're not really of that market.",
        ],
      },
      {
        heading: "What to localize culturally",
        body: ["Adapt the details that make content feel native:"],
        bullets: [
          "Examples and scenarios drawn from the local context, not translated foreign ones.",
          "Units, currencies, dates, and formats the market actually uses.",
          "References, norms, and framing that resonate locally.",
          "The specific concerns and questions that market raises around the topic.",
        ],
      },
      {
        heading: "Local expertise, not just translators",
        body: [
          "Genuine cultural localization usually needs local expertise, not only translation - someone who knows the market's context and can adapt content to feel native. This is more effort than translation, but it's the difference between content a market's AI answers cite and content they pass over as foreign. Where you lack that local depth, it's honest to localize fewer markets well rather than many poorly.",
        ],
      },
    ],
    faqs: [
      { q: "Isn't translation enough for local markets?", a: "No - technically-correct translation can still read as culturally foreign. Cultural localization adapts examples, units, references, norms, and framing to the market so content feels genuinely native, which is what supports trust and citability in that market's AI answers." },
      { q: "Why does cultural fit affect AI citations?", a: "Engines aim for answers relevant to the user, and cultural relevance is part of that. Content reflecting a market's real context and framing reads as authentically for that audience, supporting the trust behind citation; culturally off content signals you're not of that market." },
      { q: "What should I culturally localize?", a: "Local examples and scenarios (not translated foreign ones), local units/currencies/date formats, culturally-resonant references and framing, and the specific concerns that market raises around the topic." },
      { q: "Do I need local experts, or are translators enough?", a: "Genuine cultural localization usually needs local expertise, not just translation - someone who can adapt content to feel native. Where you lack it, localize fewer markets well rather than many poorly." },
    ],
    related: [
      { label: "GEO for non-English markets", href: "/resources/geo-for-non-english-markets" },
      { label: "Multilingual GEO: getting cited across languages", href: "/resources/multilingual-geo" },
      { label: "GEO for multi-region brands", href: "/resources/geo-for-multi-region-brands" },
    ],
  },

  "regional-ai-engines": {
    slug: "regional-ai-engines",
    metaTitle: "Regional AI Engines: Baidu, Yandex, Naver & More | Citensity",
    metaDescription:
      "The dominant AI engines aren't dominant everywhere. Here's why regional engines like Baidu, Yandex, and Naver matter for international GEO - and how to approach them.",
    updated: "2026-07-02",
    readMins: 5,
    answer:
      "Regional engines - Baidu in China, Yandex in Russia, Naver in South Korea, and others - dominate their markets and are building AI answer features, so international GEO must account for them rather than optimizing only for the globally-dominant engines. The approach is the same fundamentals (citable, structured, authoritative, localized content) applied to each region's leading engine, plus awareness that some have distinct requirements and that local-language content and presence matter most.",
    takeaways: [
      "Globally-dominant engines aren't dominant everywhere - regional engines lead key markets.",
      "Baidu (China), Yandex (Russia), Naver (South Korea) and others matter for those markets.",
      "They're building AI answer features too - the same GEO fundamentals apply.",
      "Local-language, locally-relevant content and presence matter most for regional engines.",
      "Some have distinct technical requirements - research each market's leading engine.",
    ],
    sections: [
      {
        heading: "Why regional engines matter",
        body: [
          "If your market includes China, Russia, South Korea, or other regions with a dominant local engine, optimizing only for the globally-popular engines leaves you invisible where it counts. Baidu, Yandex, Naver and others lead their markets and are adding AI answer capabilities of their own. International GEO that ignores them ignores the actual search behavior of those markets.",
        ],
      },
      {
        heading: "The fundamentals still apply",
        body: [
          "Regional engines, like the global ones, reward citable content: clear, structured, authoritative, and - crucially here - genuinely localized to the market's language. The core GEO discipline transfers. What changes is that the content must be native to the market and that your presence and authority need to be built within that market's web ecosystem, not just the global one.",
        ],
      },
      {
        heading: "Local presence matters most",
        body: [
          "Regional engines weight local relevance heavily - local-language content, local hosting or presence, and authority within that market's web. Being a recognized, corroborated entity in the local ecosystem matters more than global authority that doesn't translate. This is why regional GEO is closely tied to genuine local operation, not just translated pages served from afar.",
        ],
      },
      {
        heading: "Research each engine's specifics",
        body: [
          "Some regional engines have distinct technical requirements, verification processes, or ranking factors that differ from the global norm. Before investing in a market, research its leading engine's specifics rather than assuming the global playbook applies unchanged. The GEO principles are universal; the implementation details and market presence needed vary by engine and region.",
        ],
      },
    ],
    faqs: [
      { q: "Do I need to optimize for Baidu, Yandex, or Naver?", a: "Only if your market includes their regions (China, Russia, South Korea, etc.), where they dominate and are adding AI answer features. If so, optimizing only for globally-popular engines leaves you invisible where those markets actually search." },
      { q: "Is GEO different for regional engines?", a: "The fundamentals (citable, structured, authoritative, localized content) transfer, but local-language content and presence matter most, and some engines have distinct technical/verification requirements. Research each market's leading engine before investing." },
      { q: "Does my global authority help with regional engines?", a: "Partially - but regional engines weight local relevance and authority within their market's web heavily. Being a recognized, corroborated entity in the local ecosystem matters more than distant global authority that doesn't translate." },
      { q: "How do I start with a regional engine?", a: "Research that specific engine's requirements and ranking factors (they can differ from the global norm), then apply the GEO fundamentals with genuinely native local-language content and real market presence." },
    ],
    related: [
      { label: "Multi-engine GEO strategy", href: "/resources/multi-engine-geo-strategy" },
      { label: "GEO for non-English markets", href: "/resources/geo-for-non-english-markets" },
      { label: "How AI engines handle languages", href: "/resources/how-ai-engines-handle-languages" },
    ],
  },

  "translating-vs-localizing-for-geo": {
    slug: "translating-vs-localizing-for-geo",
    metaTitle: "Translating vs Localizing Content for GEO | Citensity",
    metaDescription:
      "Translation converts words; localization adapts meaning. For AI citations in other markets, the difference is decisive. Here's when each is enough and why localization usually wins.",
    updated: "2026-07-02",
    readMins: 5,
    answer:
      "Translation converts your words into another language; localization adapts the content - language plus examples, framing, and cultural context - to feel native to the market. For GEO, localization usually wins because AI engines cite content that reads as genuinely native and answers the market's real questions, which translation alone rarely achieves. Translation can suffice for simple, universal, factual content, but anything nuanced or competitive needs localization to be citable.",
    takeaways: [
      "Translation converts words; localization adapts meaning and cultural context.",
      "For citability, localization usually wins - engines cite native-feeling content.",
      "Translation can suffice for simple, universal, factual content.",
      "Nuanced or competitive content needs localization to earn citations.",
      "The choice is a spectrum - match the effort to the content's stakes and competitiveness.",
    ],
    sections: [
      {
        heading: "The core difference",
        body: [
          "Translation and localization aren't the same thing. Translation renders your existing words in another language, keeping your original framing and examples. Localization goes further: it adapts the content to the target market - its examples, references, norms, and the way locals ask questions - so it reads as if written for them. For GEO, that difference determines whether a market's AI answers cite you.",
        ],
      },
      {
        heading: "Why localization usually wins for GEO",
        body: [
          "AI engines cite content that's the best, most native-feeling answer to a market's question. Translated content often keeps English-market framing and reads as imported, so it's less likely to be cited by native speakers even when linguistically correct. Localized content answers the market's real questions in its own context and reads native - which is what earns the citation. In competitive or nuanced topics, this gap is decisive.",
        ],
      },
      {
        heading: "When translation is enough",
        body: [
          "Localization is more effort, so it's not always warranted. For simple, universal, factual content - where framing and cultural context barely matter and there's little competition - good translation can suffice to be citable. The judgment call is about stakes and competitiveness: the more nuanced, high-value, or contested the topic, the more localization pays off over translation.",
        ],
      },
      {
        heading: "Treat it as a spectrum",
        body: [
          "In practice, translating vs localizing is a spectrum, not a binary. Match the investment to the content: lightly-adapted translation for simple universal pages, full localization for your most important, competitive, market-specific content. Deciding deliberately - rather than defaulting to cheap translation everywhere - is how you get citable content in each market without over-investing where it isn't needed.",
        ],
      },
    ],
    faqs: [
      { q: "What's the difference between translating and localizing?", a: "Translation renders your words in another language keeping the original framing; localization adapts the content - examples, references, norms, and how locals ask - to feel native to the market. For GEO, that difference determines whether a market's AI answers cite you." },
      { q: "Which is better for GEO?", a: "Localization usually - engines cite native-feeling content that answers the market's real questions, which translation alone rarely achieves. Translation can suffice for simple, universal, factual content; nuanced or competitive topics need localization." },
      { q: "When is translation good enough?", a: "For simple, universal, factual content where framing and cultural context barely matter and competition is low. The more nuanced, high-value, or contested the topic, the more localization pays off over translation." },
      { q: "Do I have to fully localize everything?", a: "No - treat it as a spectrum. Lightly-adapted translation for simple universal pages, full localization for your most important, competitive, market-specific content. Decide deliberately rather than defaulting to cheap translation everywhere." },
    ],
    related: [
      { label: "Cultural localization for GEO", href: "/resources/cultural-localization-for-geo" },
      { label: "GEO for non-English markets", href: "/resources/geo-for-non-english-markets" },
      { label: "Repurposing existing content for AI search", href: "/resources/repurposing-content-for-ai-search" },
    ],
  },

  "geo-for-global-and-local-intent": {
    slug: "geo-for-global-and-local-intent",
    metaTitle: "GEO for Global vs Local Intent | Citensity",
    metaDescription:
      "Some questions have one global answer; others depend entirely on where you are. Here's how to tell global from local intent and structure GEO content for each.",
    updated: "2026-07-02",
    readMins: 5,
    answer:
      "Global-intent questions have one answer regardless of location ('what is generative engine optimization'), while local-intent questions depend on where the user is ('best accountant near me', 'tax rules for freelancers'), and GEO content must be structured differently for each: one authoritative global page for global intent, and location- or region-specific pages for local intent. Misjudging which is which - a global page for a local question, or vice versa - is a common reason content doesn't get cited.",
    takeaways: [
      "Global intent: one answer regardless of location - one authoritative page.",
      "Local intent: the answer depends on location - location/region-specific pages.",
      "Structure content to match the intent type, or it won't get cited.",
      "Many topics have both global and local facets - address them separately.",
      "Misjudging intent (global page for a local question) is a common citation failure.",
    ],
    sections: [
      {
        heading: "Two kinds of intent",
        body: [
          "Some questions have a single correct answer anywhere in the world - definitions, universal how-tos, concepts. Others have answers that change entirely by location - anything involving local regulations, providers, prices, or 'near me'. Recognizing which type a question is determines how you should build content for it, because engines serve global answers globally and local answers by location.",
        ],
      },
      {
        heading: "Structuring for global intent",
        body: [
          "For global-intent questions, build one authoritative, comprehensive page - the definitive answer, in the relevant language(s). You don't need location variants; you need the best single source. Fragmenting a global-intent topic into many location pages just splits authority and creates thin duplicates. Concentrate quality into one strong page (per language) and earn the global citation.",
        ],
      },
      {
        heading: "Structuring for local intent",
        body: [
          "For local-intent questions, the answer genuinely differs by place, so you need location- or region-specific content that's accurate for each - local regulations, providers, prices, context. This is where location and regional pages earn their place (unlike for global intent). Each must add real, correct local value, not be a templated location-swap, or it risks thin-content problems.",
        ],
      },
      {
        heading: "Handling topics with both facets",
        body: [
          "Many topics have both a global facet and local facets - 'how does X work' (global) plus 'X rules in [country]' (local). Address them separately: an authoritative global explainer, plus focused local pages for the location-dependent aspects, interlinked. Matching each facet to the right structure - rather than forcing one page to serve both intents - is what makes both citable.",
        ],
      },
    ],
    faqs: [
      { q: "How do I tell global from local intent?", a: "Ask whether the answer changes by location. Definitions, concepts, and universal how-tos are global (one answer anywhere). Anything involving local regulations, providers, prices, or 'near me' is local (the answer depends on place). The type dictates how to structure content." },
      { q: "Should I make location pages for a global-intent topic?", a: "No - that splits authority and creates thin duplicates. Global intent needs one authoritative page (per language). Location variants are for local-intent questions where the answer genuinely differs by place." },
      { q: "How do I handle a topic that's both global and local?", a: "Address the facets separately: an authoritative global explainer for the universal part, plus focused local pages for the location-dependent aspects, interlinked. Forcing one page to serve both intents makes neither citable." },
      { q: "What happens if I mismatch intent and structure?", a: "It's a common citation failure - a global page can't win location-specific queries, and scattered location pages for a global question split authority into thin duplicates. Match structure to intent so each gets cited." },
    ],
    related: [
      { label: "Search intent explained", href: "/resources/search-intent-explained" },
      { label: "GEO for local business", href: "/resources/geo-for-local-business" },
      { label: "GEO for multi-region brands", href: "/resources/geo-for-multi-region-brands" },
    ],
  },

  "how-ai-engines-handle-languages": {
    slug: "how-ai-engines-handle-languages",
    metaTitle: "How AI Engines Handle Languages | Citensity",
    metaDescription:
      "AI engines answer in many languages, but how do they choose sources across them? Here's how language works in AI retrieval and citation - and what it means for multilingual GEO.",
    updated: "2026-07-02",
    readMins: 6,
    answer:
      "AI engines generally answer in the language of the question and prefer sources in that language, though they can draw on and translate content from other languages when in-language sources are thin. For multilingual GEO this means the surest way to be cited in a language is to have genuinely native content in it - relying on the engine to translate your English content is less reliable, because it favours native-language sources and translation can distort your meaning.",
    takeaways: [
      "Engines usually answer in the question's language and prefer sources in that language.",
      "They can translate from other languages when in-language sources are thin - but less reliably.",
      "The surest path to a language's citations is genuinely native content in it.",
      "Relying on the engine to translate your English content is a weaker strategy.",
      "Language-native authority (presence, corroboration) matters within each language's ecosystem.",
    ],
    sections: [
      {
        heading: "Language in retrieval and answering",
        body: [
          "When someone asks an AI engine a question in a given language, the engine generally answers in that language and leans toward sources written in it - because those are the most directly relevant and trustworthy for that user. This is the core dynamic behind multilingual GEO: the language you publish in strongly influences which language-answers you can be cited in.",
        ],
      },
      {
        heading: "Cross-language fallback",
        body: [
          "Engines can draw on content from other languages - translating or synthesizing across them - especially when in-language sources are thin. So your English content isn't invisible to a non-English answer. But this cross-language path is less reliable: the engine favours native-language sources when they exist, and translating your content risks distorting nuance. Counting on it is weaker than having native content.",
        ],
      },
      {
        heading: "The implication for GEO",
        body: [
          "The practical takeaway: to reliably earn citations in a language, publish genuinely native content in it, rather than hoping the engine translates your English pages. In markets where in-language content is thin, your English content may still surface via cross-language fallback - a reason non-English markets can be an opportunity - but native content is the durable strategy where competition exists.",
        ],
      },
      {
        heading: "Language-native authority",
        body: [
          "Authority is also somewhat language- and market-scoped. Being corroborated and recognized within a language's web ecosystem strengthens your citability in that language, much as broad web authority does globally. So multilingual GEO isn't only about publishing translations - it's about building genuine presence and authority within each language's ecosystem you want to win.",
        ],
      },
    ],
    faqs: [
      { q: "Do AI engines answer in the user's language?", a: "Generally yes - they answer in the question's language and prefer sources written in that language, as those are most directly relevant and trustworthy for that user. The language you publish in strongly influences which language-answers you can be cited in." },
      { q: "Will engines translate my English content for other languages?", a: "They can, especially when in-language sources are thin - so your English content isn't invisible to a non-English answer. But it's less reliable: engines favour native-language sources when they exist, and translation risks distorting nuance. Native content is the durable strategy." },
      { q: "What's the most reliable way to be cited in a language?", a: "Publish genuinely native content in it, rather than relying on the engine to translate your English pages. In markets where in-language content is thin, cross-language fallback may still surface you - a real opportunity - but native content wins where there's competition." },
      { q: "Does authority carry across languages?", a: "Partially - authority is somewhat language- and market-scoped. Being corroborated and recognized within a language's web ecosystem strengthens citability in that language, so multilingual GEO includes building genuine presence per language, not just translating pages." },
    ],
    related: [
      { label: "Multilingual GEO: getting cited across languages", href: "/resources/multilingual-geo" },
      { label: "How LLMs retrieve information to answer questions", href: "/resources/how-llms-retrieve-information" },
      { label: "GEO for non-English markets", href: "/resources/geo-for-non-english-markets" },
    ],
  },

  "geo-for-emerging-markets": {
    slug: "geo-for-emerging-markets",
    metaTitle: "GEO for Emerging Markets | Citensity",
    metaDescription:
      "AI adoption is growing fast in emerging markets, often with less competition for citations. Here's how to approach GEO in emerging markets - and the practical realities to plan for.",
    updated: "2026-07-02",
    readMins: 5,
    answer:
      "GEO in emerging markets can be a high-opportunity, lower-competition play - AI adoption is growing quickly and native-language content is often scarce, so genuinely local, citable content can win citations faster than in saturated markets. The practical realities to plan for are language and cultural localization, mobile-first and connectivity considerations, and local presence - the fundamentals apply, but native-language content and genuine market relevance matter most.",
    takeaways: [
      "Emerging markets: fast-growing AI adoption, often less competition for citations.",
      "Native-language content is frequently scarce - a real opportunity to win early.",
      "Language and cultural localization matter most - genuinely local, not translated.",
      "Plan for mobile-first usage and connectivity realities in many emerging markets.",
      "The GEO fundamentals apply; local relevance and presence are the differentiators.",
    ],
    sections: [
      {
        heading: "Why emerging markets can be high-opportunity",
        body: [
          "AI adoption is growing rapidly in many emerging markets, while genuinely local, native-language content on many topics is still scarce. That combination - rising demand, thin supply - is exactly where citations are easier to win than in saturated markets. For businesses operating in or serving these markets, being an early, genuinely local citable source can establish authority before the space gets crowded.",
        ],
      },
      {
        heading: "Localization matters most",
        body: [
          "As everywhere, the winning content is genuinely localized - native language, local context, real local questions - not translated. In emerging markets this is often the biggest differentiator, because the scarcity of quality native content means good localized content stands out sharply. The localize-don't-translate principle is especially valuable where native content is thin.",
        ],
      },
      {
        heading: "Practical realities to plan for",
        body: ["Emerging markets have context worth designing for:"],
        bullets: [
          "Mobile-first: much usage is on mobile, so fast, mobile-friendly pages matter.",
          "Connectivity: lighter, faster pages serve users on slower or metered connections.",
          "Local language and dialects: match how the market actually communicates.",
          "Local presence and relevance: authority within the market's own web ecosystem.",
        ],
      },
      {
        heading: "Fundamentals plus local relevance",
        body: [
          "The GEO fundamentals - citable, structured, authoritative content - apply in emerging markets as everywhere. What tips the balance is genuine local relevance: native-language content answering the market's real questions, delivered in a fast, accessible way, backed by real presence. Get that right and the lower competition means citations can come faster than in mature markets.",
        ],
      },
    ],
    faqs: [
      { q: "Are emerging markets a good GEO opportunity?", a: "Often yes - AI adoption is growing fast while quality native-language content is scarce, so genuinely local citable content can win citations faster than in saturated markets. Being an early local source can establish authority before the space crowds." },
      { q: "What matters most for GEO in emerging markets?", a: "Genuine localization - native language, local context, real local questions - not translation. Where quality native content is thin, good localized content stands out sharply, making it the biggest differentiator." },
      { q: "What practical realities should I plan for?", a: "Mobile-first usage (fast, mobile-friendly pages), connectivity constraints (lighter pages for slower/metered connections), local language and dialects, and building presence within the market's own web ecosystem." },
      { q: "Do the GEO fundamentals still apply in emerging markets?", a: "Yes - citable, structured, authoritative content is universal. What tips the balance is genuine local relevance delivered accessibly; combined with lower competition, citations can come faster than in mature markets." },
    ],
    related: [
      { label: "GEO for non-English markets", href: "/resources/geo-for-non-english-markets" },
      { label: "Cultural localization for GEO", href: "/resources/cultural-localization-for-geo" },
      { label: "Page speed and AI crawlability", href: "/resources/page-speed-and-ai-crawlability" },
    ],
  },

  "country-specific-geo-strategy": {
    slug: "country-specific-geo-strategy",
    metaTitle: "Building a Country-Specific GEO Strategy | Citensity",
    metaDescription:
      "Entering a new country for GEO? Here's a practical framework - assess the engine landscape, localize genuinely, get targeting right, and build local authority - to win citations market by market.",
    updated: "2026-07-02",
    readMins: 6,
    answer:
      "A country-specific GEO strategy works through four steps for each target country: assess the engine landscape (which engines dominate there), produce genuinely localized content in the local language, get technical targeting right (hreflang, regional URLs), and build authority within that country's web ecosystem. Rather than a single global program, this treats each country as its own GEO effort tuned to its engines, language, and market - prioritized by opportunity.",
    takeaways: [
      "Treat each target country as its own GEO effort, not a single global program.",
      "Step 1: assess which engines dominate that country.",
      "Step 2: produce genuinely localized (not translated) local-language content.",
      "Step 3: get technical targeting right (hreflang, regional URLs).",
      "Step 4: build authority within that country's web ecosystem; prioritize by opportunity.",
    ],
    sections: [
      {
        heading: "Country by country, not one-size-fits-all",
        body: [
          "International GEO fails when it's treated as one global program bolted onto translated pages. Countries differ in which engines dominate, what language and culture demand, and where authority comes from. A country-specific strategy treats each target market as its own GEO effort - tuned to that country's realities - while laddering up to one coherent brand. You don't do every country at once; you prioritize and go deep where the opportunity is.",
        ],
      },
      {
        heading: "Step 1-2: engine landscape + localization",
        body: [
          "Start by assessing the engine landscape: do globally-dominant engines lead there, or a regional one (Baidu, Yandex, Naver, etc.)? That shapes where you optimize. Then produce genuinely localized content - native language, local questions, cultural context - not translation. These two steps (know the engines, localize for real) are the foundation of any country's GEO.",
        ],
      },
      {
        heading: "Step 3-4: targeting + local authority",
        body: ["With content in place, make engines serve it right and trust it:"],
        bullets: [
          "Technical targeting: correct hreflang and a consistent regional URL structure.",
          "Local entity and business data where relevant.",
          "Authority within the country's web ecosystem - local mentions, corroboration, presence.",
          "Measurement per country - track citations in that market's engines.",
        ],
      },
      {
        heading: "Prioritize by opportunity",
        body: [
          "You can't enter every country at once, and shouldn't. Prioritize by opportunity - market size, competition level, and where you can genuinely produce native-quality content and build real presence. Go deep on a few countries rather than shallow across many; a handful of well-executed country strategies beats translated pages sprayed globally. Then expand as each proves out.",
        ],
      },
    ],
    faqs: [
      { q: "Should I run one global GEO program or country-specific ones?", a: "Country-specific efforts that ladder up to one brand - because countries differ in dominant engines, language/culture, and where authority comes from. A single global program on translated pages fails; treat each target country as its own tuned GEO effort, prioritized by opportunity." },
      { q: "What are the steps for entering a new country?", a: "Assess the engine landscape (which engines dominate), produce genuinely localized local-language content, get technical targeting right (hreflang, regional URLs), and build authority within that country's web ecosystem. Measure citations per country." },
      { q: "How many countries should I target at once?", a: "Few, done deep - prioritize by market size, competition, and where you can produce native-quality content and real presence. A handful of well-executed country strategies beats translated pages sprayed globally; expand as each proves out." },
      { q: "Does the dominant engine vary by country?", a: "Yes - globally-popular engines lead many markets, but regional engines (Baidu in China, Yandex in Russia, Naver in South Korea, etc.) dominate others. Assessing the engine landscape is step one because it shapes where you optimize." },
    ],
    related: [
      { label: "Regional AI engines: Baidu, Yandex, Naver & more", href: "/resources/regional-ai-engines" },
      { label: "GEO for multi-region brands", href: "/resources/geo-for-multi-region-brands" },
      { label: "hreflang and international GEO", href: "/resources/hreflang-and-international-geo" },
    ],
  },
};
