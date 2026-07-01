import type { Article } from "@/components/resources/content-types";

export const BATCH_ADVANCED: Record<string, Article> = {
  "how-to-get-cited-in-ai-answers": {
    slug: "how-to-get-cited-in-ai-answers",
    metaTitle: "How to Get Cited in AI Answers: Full Guide | Citensity",
    metaDescription:
      "To get cited in AI answers, publish accurate, self-contained passages that directly resolve real questions and are easy for engines to retrieve and attribute.",
    updated: "2026-06-25",
    readMins: 7,
    answer:
      "You get cited in AI answers by publishing content that an answer engine can retrieve, trust, and quote on its own. In practice that means answering a real question directly near the top, structuring the page so each claim is a self-contained passage, backing claims with verifiable evidence, and making the page technically crawlable - because engines cite the source that resolves the query most clearly, not the one that ranks highest by tradition.",
    takeaways: [
      "Citations go to retrievable, self-contained passages - not to whole pages.",
      "Lead with a direct answer; engines lift the clearest sentence that resolves the query.",
      "Trust signals (named author, evidence, consistency) decide which source gets credited.",
      "Technical access matters: if AI crawlers can't fetch the page, it can't be cited.",
      "Track which engines cite you so you can double down on what works.",
    ],
    sections: [
      {
        heading: "How an AI answer actually gets built",
        body: [
          "When someone asks ChatGPT, Perplexity, or Google AI Mode a question, the engine doesn't reason over the whole web. It retrieves a small set of candidate passages, scores them for how directly they resolve the query, and synthesizes an answer from the strongest few - usually naming the sources it leaned on. Getting cited is therefore a passage-level contest, not a page-level one.",
          "This reframes the whole task. You are not trying to make a page that ranks; you are trying to write individual passages that win retrieval for specific questions and read cleanly when lifted out of context. A page can be comprehensive and still go uncited because its best sentence is buried, hedged, or dependent on the paragraph above it.",
        ],
      },
      {
        heading: "The four things every cited passage has",
        body: [
          "Across engines, the passages that get cited tend to share the same properties. Optimize for these and you optimize for citation in general rather than for one model's quirks.",
        ],
        bullets: [
          "Retrievable: the page is crawlable and the passage sits near a heading that matches the question.",
          "Self-contained: it answers completely without 'this', 'as above', or an unresolved pronoun.",
          "Trustworthy: a named source, specific evidence, and a date make the claim safe to attribute.",
          "Consistent: the body substantiates the summary instead of quietly contradicting it.",
        ],
      },
      {
        heading: "A practical workflow to earn citations",
        body: [
          "Start from the questions, not the keywords. List the exact questions a buyer would ask an AI about your category, then make sure each high-value question has a page (or a section) whose opening sentence answers it outright. Write that opener so it could be pasted into someone else's answer and still be true.",
          "Then add the evidence that makes you the safest source to credit: original data, a named expert, a clear methodology. Finally, structure the page with descriptive headings, short paragraphs, and tables or lists where data belongs - the formats engines parse most reliably. The goal is a page that is easy to retrieve from, easy to quote, and easy to trust.",
        ],
      },
      {
        heading: "Measure, then concentrate your effort",
        body: [
          "You cannot improve what you do not watch. Run your priority questions through the major engines, record whether your brand appears and in what context, and note which pages win citations. Patterns emerge quickly - certain formats and topics get picked up far more than others - and that tells you where to invest.",
          "A platform like Citensity closes this loop: Brand Memory keeps a grounded source of truth so generated pages never fabricate, the Page Engine publishes answer-first pages at scale, and Analytics tracks AI citations across engines so you know which work actually moved visibility.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long does it take to get cited in AI answers?",
        a: "It varies by engine. Retrieval-augmented engines that crawl live (like Perplexity) can pick up a new page within days of it being indexed; engines that lean on a training snapshot update far less often. Technical crawlability and clear structure shorten the lag in every case.",
      },
      {
        q: "Do backlinks still matter for AI citations?",
        a: "Yes, indirectly. Links remain a strong signal of authority and help pages get discovered and trusted, which feeds the retrieval and ranking layers that AI engines draw from. But on their own they don't earn a citation - a clear, attributable passage does.",
      },
      {
        q: "Can I get cited without ranking on Google?",
        a: "Sometimes. Engines like Perplexity retrieve from their own index and may cite a page that ranks modestly on Google if it answers the query most directly. Strong traditional ranking still helps, but citation is decided by passage quality and retrievability, not rank alone.",
      },
      {
        q: "Does fabricating impressive stats help me get cited faster?",
        a: "No - it backfires. Invented numbers can be contradicted by other sources, which makes an engine treat your page as unreliable and drop it from answers. Only publish figures you can stand behind with a stated method.",
      },
    ],
    related: [
      { label: "What is generative engine optimization?", href: "/resources/what-is-generative-engine-optimization" },
      { label: "How to write a TL;DR that gets cited", href: "/resources/how-to-write-a-tldr-that-gets-cited" },
      { label: "Analytics - AI citation tracking", href: "/platform/analytics" },
    ],
  },

  "heading-structure-for-seo-and-ai": {
    slug: "heading-structure-for-seo-and-ai",
    metaTitle: "Heading Structure for SEO and AI | Citensity",
    metaDescription:
      "Good heading structure uses one H1 and descriptive, question-shaped H2s in logical order - so both search crawlers and AI engines can locate the right answer fast.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "Heading structure for SEO and AI means one clear H1 that states the page's topic, followed by descriptive H2s and H3s in logical nesting order. It matters because both search crawlers and AI answer engines use headings to map a page's structure and to locate the passage that answers a query - so a heading phrased as the question gives the engine a direct route to your answer.",
    takeaways: [
      "Use exactly one H1 that states what the page is about.",
      "Phrase H2s as the questions readers ask; the answer goes in the paragraph right below.",
      "Never skip levels (H2 to H4) - logical nesting is a parsing signal.",
      "Headings are navigation, not decoration; don't style normal text as a heading.",
      "Front-load the keyword or entity in the heading text.",
    ],
    sections: [
      {
        heading: "Why headings are a machine-readable map",
        body: [
          "A heading hierarchy is the outline of your page expressed in markup. Crawlers build a structural model from it, accessibility tools navigate by it, and AI answer engines use it to segment a page into passages they can score against a query. When your headings are descriptive and well-ordered, you are handing every one of those systems a table of contents.",
          "When they are vague or out of order, the opposite happens. A heading like 'Going deeper' tells a machine nothing, and a jump from H2 to H4 breaks the implied nesting. The engine has to guess at structure, which makes it harder for your answer to be located and lifted.",
        ],
      },
      {
        heading: "Phrase headings as the question",
        body: [
          "The single highest-leverage move is to write H2s in the words people actually search and ask. If a buyer asks an AI 'how much does X cost', a section titled 'How much does X cost?' with the answer in the first sentence below it is a near-perfect match for retrieval. The heading and the query line up, and the answer is exactly where the engine expects it.",
          "This also improves the page for people. Question-shaped headings let a reader scan to the exact section they need, which is the same scannability that drives featured snippets and AI extraction.",
        ],
      },
      {
        heading: "Rules for a clean hierarchy",
        body: ["A few mechanical rules keep the structure parseable."],
        bullets: [
          "One H1 per page, stating the topic - usually matching the title.",
          "H2s for the main questions or subtopics; H3s for sub-points under an H2.",
          "Never skip a level: don't go H2 straight to H4.",
          "Keep headings short and specific; put the keyword or entity first.",
          "Use headings for structure only - don't bold a paragraph and call it a heading.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I have more than one H1?",
        a: "Stick to one. HTML5 technically allows multiple H1s inside sectioning elements, but a single H1 that names the page topic is the clearest signal for both search and AI parsers, and it avoids ambiguity about what the page is primarily about.",
      },
      {
        q: "Do headings need to contain keywords?",
        a: "They should contain the natural language of the question, which usually includes the keyword or entity. Front-load it, but don't stuff - a heading written for a human who is scanning is also the heading an engine parses best.",
      },
      {
        q: "Does the order of headings affect AI citations?",
        a: "Yes. Logical nesting helps an engine understand which passage belongs to which question, so your answer is matched to the right query. Out-of-order or skipped levels force the engine to guess and reduce the odds your passage is retrieved cleanly.",
      },
    ],
    related: [
      { label: "Content structure for AI citations", href: "/resources/content-structure-for-ai-citations" },
      { label: "Answer-shaped content", href: "/resources/answer-shaped-content" },
      { label: "Page Engine - structured pages", href: "/platform/page-engine" },
    ],
  },

  "how-to-use-tables-for-ai-extraction": {
    slug: "how-to-use-tables-for-ai-extraction",
    metaTitle: "Using Tables and Lists for AI Extraction | Citensity",
    metaDescription:
      "Tables and lists make structured data easy for AI engines to parse and quote. Use real HTML tables with clear headers so comparisons and specs extract accurately.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "Tables and lists help AI engines extract your data because they encode relationships explicitly - a table cell ties a value to a row and a column, and a list item is a discrete, liftable fact. Use real HTML tables with header cells (not images of tables or grid-styled divs), and engines can parse comparisons, specs, and steps far more reliably than from prose.",
    takeaways: [
      "Real HTML tables (with header cells) are machine-readable; image or div 'tables' are not.",
      "Use tables for relationships (X vs Y, spec vs value) and lists for sequences or sets.",
      "Give every table a clear header row so each value has a labeled column.",
      "Keep one fact per cell and one idea per list item so each is independently quotable.",
      "Add a sentence of context near the table - engines often quote that alongside the data.",
    ],
    sections: [
      {
        heading: "Why structure beats prose for data",
        body: [
          "When a fact lives in a sentence, an engine has to infer the relationship between the numbers and what they describe. When the same fact lives in a table, the relationship is explicit: this cell is the value, that column header is what it measures, that row label is what it belongs to. Explicit structure is faster and safer to parse, so comparison and specification data is more likely to be extracted accurately and quoted.",
          "Lists do the same job for sequences and sets. A numbered list of steps or a bulleted list of options gives the engine discrete, ordered items it can lift one at a time, instead of a run-on paragraph it has to split apart.",
        ],
      },
      {
        heading: "Use real HTML, not pictures of structure",
        body: [
          "The most common mistake is structure that looks right to a human but is invisible to a parser. A screenshot of a comparison table, or a layout built from styled divs with no table semantics, carries no machine-readable relationships. To an engine it is an image or a wall of unrelated text.",
          "Use genuine table and list markup. A table needs a header row so each column is labeled; a list needs list markup, not dashes typed at the start of paragraphs. This is also an accessibility win - the same semantics that screen readers rely on are the ones AI parsers use.",
        ],
        bullets: [
          "Tables: header cells for every column, one fact per cell, consistent units.",
          "Comparison tables: rows = options, columns = attributes (or vice versa, consistently).",
          "Ordered lists: for steps and ranked items where sequence carries meaning.",
          "Unordered lists: for sets of options, features, or criteria with no inherent order.",
          "Avoid: images of tables, PDF-only data, div grids without table semantics.",
        ],
      },
      {
        heading: "Frame the data so it gets quoted with context",
        body: [
          "Engines frequently quote a data point together with the sentence that introduces it. So precede a table with a short lead-in that states what the table shows and where the numbers come from, and follow it with a one-line takeaway. That framing sentence is often the citable passage, with the table as supporting evidence.",
          "Keep each cell and each list item self-contained. A value with no unit, or a list item that only makes sense after reading the one above it, is hard to extract cleanly - the same self-containment rule that governs sentences applies to cells and items.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will an AI engine read a table I save as an image?",
        a: "Generally no, not reliably. Some engines run OCR or vision models, but you should never depend on it for data you want extracted. Publish the table as real HTML so the values and their labels are explicitly machine-readable.",
      },
      {
        q: "Are tables or lists better for AI extraction?",
        a: "It depends on the data. Use a table when each fact relates a value to two dimensions (an option and an attribute), and a list when you have a sequence of steps or a flat set of items. Match the format to the shape of the information.",
      },
      {
        q: "Should I add structured data (schema) to my tables?",
        a: "It can help for specific types - for example, marking up steps with HowTo-style schema or a dataset with Dataset schema where appropriate. But the first priority is clean HTML table and list markup; schema is an additional, complementary signal.",
      },
    ],
    related: [
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "Content structure for AI citations", href: "/resources/content-structure-for-ai-citations" },
      { label: "AI Feed - JSON-LD and llms.txt", href: "/platform/ai-feed" },
    ],
  },

  "image-seo-and-alt-text-for-ai": {
    slug: "image-seo-and-alt-text-for-ai",
    metaTitle: "Image SEO and Alt Text in the AI Era | Citensity",
    metaDescription:
      "In the AI era, descriptive alt text and the copy around an image tell engines what it shows. Write alt text that conveys meaning, and never lock facts inside images.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "Image SEO in the AI era still rests on text: descriptive alt attributes, meaningful filenames, and the surrounding copy tell search and AI engines what an image depicts. The biggest rule is to never trap facts inside an image - if a number, comparison, or step only appears in a graphic, an answer engine usually cannot extract it, so the text around the image must carry the meaning.",
    takeaways: [
      "Alt text should describe what the image shows in plain, specific language.",
      "Never lock a citable fact inside an image - state it in the body text too.",
      "Use descriptive filenames and keep images compressed for crawl performance.",
      "Caption and surrounding text give engines the context an image alone can't.",
      "Decorative images get empty alt text so assistive tech and parsers skip them.",
    ],
    sections: [
      {
        heading: "Engines read images through their text",
        body: [
          "While some engines apply vision models, you cannot rely on a machine to read a chart, infographic, or screenshot the way a person does. The dependable signal is text: the alt attribute, the filename, the caption, and the paragraphs around the image. Together these tell an engine what the image is and why it is there.",
          "The practical consequence is a hard rule: do not let an image be the only place a fact lives. If your best statistic appears only in an infographic, it is effectively invisible to extraction. Put the number in the body text as a self-contained sentence, and let the image illustrate it rather than carry it.",
        ],
      },
      {
        heading: "How to write alt text that works",
        body: [
          "Good alt text describes the content and function of the image in plain language, specific enough that someone who cannot see it understands what it conveys. It is written for a human using a screen reader first - and that same description is what parsers use to understand the image.",
        ],
        bullets: [
          "Describe what the image shows, not just that an image exists ('bar chart of X by year', not 'chart').",
          "Be specific but concise - a sentence, not a paragraph; no 'image of' preamble.",
          "Include the relevant entity or term naturally where it genuinely describes the image.",
          "For charts, summarize the takeaway in the alt and the exact numbers in the body.",
          "Use empty alt (alt=\"\") for purely decorative images so they're skipped.",
        ],
      },
      {
        heading: "The technical basics still apply",
        body: [
          "Image SEO fundamentals haven't gone away. Descriptive, hyphenated filenames give a small but real signal. Compressed, appropriately sized files and modern formats keep pages fast, which protects crawlability and the user experience that AI traffic lands on. An image sitemap or proper markup helps discovery for image-heavy sites.",
          "None of this replaces the core idea: the meaning has to be available as text. Treat every important image as a visual aid to a claim you have already stated in words, and you satisfy both the human reader and the engine trying to cite you.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do AI engines actually read alt text?",
        a: "Alt text is part of the page's text content, so engines that parse the HTML can use it to understand an image and its context. It also drives accessibility and image search. It's the most reliable way to communicate what an image shows.",
      },
      {
        q: "If an engine has vision, do I still need alt text?",
        a: "Yes. Vision capability is uneven across engines and not guaranteed for any given crawl, and alt text remains essential for accessibility. Treat machine vision as a bonus, never as a substitute for describing the image in text.",
      },
      {
        q: "What's the worst image SEO mistake for AI?",
        a: "Putting a key fact only inside an image - a price, a comparison, a process diagram - with no text equivalent. The fact becomes unciteable. Always restate the substance of an infographic in the body copy.",
      },
    ],
    related: [
      { label: "Content structure for AI citations", href: "/resources/content-structure-for-ai-citations" },
      { label: "Using tables and lists for AI extraction", href: "/resources/how-to-use-tables-for-ai-extraction" },
      { label: "Page Engine - generated pages", href: "/platform/page-engine" },
    ],
  },

  "content-clusters-and-pillar-pages": {
    slug: "content-clusters-and-pillar-pages",
    metaTitle: "Content Clusters and Pillar Pages | Citensity",
    metaDescription:
      "Content clusters pair a broad pillar page with focused supporting articles, interlinked to build topical authority - the depth AI engines reward in a source.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "A content cluster is a broad pillar page on a core topic linked to a set of focused articles that each cover one subtopic in depth, with internal links connecting them. The structure builds topical authority - it signals to search and AI engines that you cover a subject comprehensively, which makes you a safer, more complete source for engines to cite across many related questions.",
    takeaways: [
      "A pillar page covers a topic broadly; cluster pages each go deep on one subtopic.",
      "Internal links between pillar and cluster pages are what make it a cluster, not a list.",
      "Comprehensive coverage signals topical authority, which engines reward.",
      "One canonical page per question avoids cannibalization and dilution.",
      "Map the cluster from real questions so each page answers something specific.",
    ],
    sections: [
      {
        heading: "Why clusters build authority engines trust",
        body: [
          "AI answer engines, like search engines, prefer sources that demonstrably understand a topic in full. A single good article is a data point; a connected set of articles covering a topic from every angle is evidence of expertise. When you have the pillar plus deep coverage of every subtopic, you become a candidate source for a whole family of related queries rather than one.",
          "Internal linking is the mechanism that turns isolated pages into a cluster an engine can see. Links from the pillar to each supporting page, and back from each page to the pillar and to siblings, define the topic's shape and pass relevance between pages. Without the links you have a content library; with them you have a topical authority structure.",
        ],
      },
      {
        heading: "How to design a cluster",
        body: [
          "Start with the pillar: the broad question at the center of your topic - the one a newcomer would ask first. The pillar page answers it at an overview level and links out to the detail. Then map the subtopics by listing the real follow-up questions a reader or an AI user would ask, and give each its own focused page.",
        ],
        bullets: [
          "Pillar: the broad topic, answered at overview depth, linking to every cluster page.",
          "Cluster pages: one focused question each, answered in full, linking back to the pillar.",
          "Sibling links: connect related cluster pages so the topic graph is dense, not a hub-and-spoke only.",
          "Canonical coverage: exactly one page per distinct question - don't write three near-duplicates.",
          "Consistent terminology: use the same terms across the cluster so entities are unambiguous.",
        ],
      },
      {
        heading: "Avoid the failure modes",
        body: [
          "The two ways clusters go wrong are thinness and overlap. Thin cluster pages - short, padded, written to fill a slot rather than answer a question - hurt rather than help, because they dilute the perception of quality across the whole topic. If a subtopic doesn't warrant a substantive page yet, fold it into a related one until it does.",
          "Overlap is the other trap: multiple pages targeting the same question compete with each other and split the signal, so no single page becomes the clear answer. Maintain one canonical page per question, and when topics converge, consolidate rather than duplicate. Depth, not page count, is what earns authority.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many cluster pages does a pillar need?",
        a: "As many as there are genuine, distinct subtopics - and no more. The number is dictated by the topic, not a quota. A focused topic might warrant five deep pages; a broad one might justify thirty. Quality and distinctness matter far more than count.",
      },
      {
        q: "Do content clusters help with AI citations specifically?",
        a: "Yes. Comprehensive, interlinked coverage signals topical authority, which makes engines more likely to treat you as a reliable source across the whole topic - so you can be cited for many related questions, not just the one the pillar answers.",
      },
      {
        q: "Should the pillar page rank, or the cluster pages?",
        a: "Both, for different queries. The pillar targets the broad head term and overview questions; each cluster page targets a specific long-tail question. The internal links let authority flow between them so the whole structure performs better than its parts.",
      },
    ],
    related: [
      { label: "Topical authority for GEO", href: "/resources/topical-authority-for-geo" },
      { label: "Internal linking for AI search", href: "/resources/internal-linking-for-ai-search" },
      { label: "Content & Authority", href: "/platform/content-authority" },
    ],
  },

  "how-to-optimize-for-google-ai-mode": {
    slug: "how-to-optimize-for-google-ai-mode",
    metaTitle: "How to Optimize for Google AI Mode | Citensity",
    metaDescription:
      "Optimize for Google AI Mode by earning organic relevance, structuring answers clearly, and covering follow-up questions - AI Mode draws from Google's index.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "You optimize for Google AI Mode by strengthening the same foundations Google ranks on - relevant, authoritative, well-structured content - and then making your answers easy to extract for conversational, multi-step queries. AI Mode generates responses from Google's index using a query fan-out, so being a strong, clearly-structured result for the cluster of related questions is what gets you surfaced and linked.",
    takeaways: [
      "AI Mode builds on Google's index and ranking - core SEO is the foundation, not separate.",
      "It fans a query out into related sub-questions; cover the whole cluster, not just the head term.",
      "Clear, answer-first structure makes your content easy to lift into the generated response.",
      "E-E-A-T signals still decide which sources Google trusts enough to surface.",
      "Track AI Mode appearances separately - they behave differently from classic blue links.",
    ],
    sections: [
      {
        heading: "What Google AI Mode is doing under the hood",
        body: [
          "Google AI Mode is a generative, conversational search experience that answers complex questions with a synthesized response and supporting links. Rather than matching a single query to a page, it uses a query fan-out technique: it breaks your question into many related sub-questions, runs searches for each, and assembles an answer from the strongest results across that cluster.",
          "The strategic implication is that you are no longer competing for one keyword. You are competing to be a good answer for the whole neighborhood of questions around a topic. Depth and breadth of coverage - the cluster, not the single page - is what makes you a likely source.",
        ],
      },
      {
        heading: "The foundation is still Google ranking",
        body: [
          "Because AI Mode draws from Google's existing index and ranking systems, there is no separate 'AI Mode SEO' that bypasses fundamentals. Content that is relevant, demonstrably expert, technically crawlable, and trustworthy is what's eligible to be surfaced. If a page can't rank or be crawled, it can't be pulled into an AI Mode answer.",
          "So the baseline is unchanged: satisfy intent, demonstrate experience and expertise, earn authority, and keep the site technically sound. AI Mode raises the ceiling on how that content can be surfaced; it does not lower the bar for quality.",
        ],
      },
      {
        heading: "What to do differently for AI Mode",
        body: [
          "On top of the foundation, optimize for extraction and for the fan-out. That means answer-first writing, clear headings phrased as questions, and coverage that anticipates the follow-ups a conversational searcher would ask next.",
        ],
        bullets: [
          "Answer the core question in the first sentence under a matching heading.",
          "Cover follow-up and adjacent questions on the page or in a linked cluster.",
          "Use clear structure - headings, lists, tables - so passages are easy to extract.",
          "Strengthen E-E-A-T: named authors, evidence, citations, real experience.",
          "Keep facts current; AI Mode favors fresh, accurate information for many queries.",
        ],
      },
      {
        heading: "Measure AI Mode visibility distinctly",
        body: [
          "AI Mode surfaces and links differently from the classic ten blue links, so treat its visibility as its own metric. Watch how your priority questions render in AI Mode, whether you're cited, and how that correlates with traffic and conversions, because click behavior in a generative result differs from a standard SERP.",
          "This is exactly where AI-visibility tracking earns its keep. Citensity Analytics monitors whether and how your brand appears across AI surfaces - including Google's AI experiences - so you can tie structural changes to citation outcomes instead of guessing.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is optimizing for AI Mode different from regular SEO?",
        a: "It shares the same foundation - AI Mode draws on Google's index and ranking. The differences are additive: you optimize harder for answer extraction and for covering the cluster of related questions a fan-out generates, rather than a single keyword.",
      },
      {
        q: "Will AI Mode reduce my organic clicks?",
        a: "It can change click patterns, since some users get their answer in the generated response. The counter-move is to be the cited source and to design pages that earn the click for deeper or transactional intent - and to track visibility, not just raw clicks.",
      },
      {
        q: "Does structured data help with Google AI Mode?",
        a: "It helps Google understand your content and entities, which supports eligibility to be surfaced. It's a complementary signal, not a shortcut - clear on-page structure and strong relevance remain the primary drivers.",
      },
    ],
    related: [
      { label: "How to appear in Google AI Overviews", href: "/resources/how-to-appear-in-google-ai-overviews" },
      { label: "How AI Overviews work", href: "/resources/how-ai-overviews-work" },
      { label: "Solutions - AI search", href: "/solutions/ai-search" },
    ],
  },

  "multilingual-geo": {
    slug: "multilingual-geo",
    metaTitle: "Multilingual GEO: Cited Across Languages | Citensity",
    metaDescription:
      "Multilingual GEO means earning AI citations in every language you serve - through native-quality content, correct hreflang, and locale-specific answers.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "Multilingual GEO is the practice of earning AI citations in every language your audience asks questions in, by publishing native-quality content per language, signaling language and region correctly with hreflang, and answering the questions people actually ask in that locale. Engines retrieve and cite in the user's language, so thin machine translation that misses local phrasing and intent rarely gets cited.",
    takeaways: [
      "AI engines answer in the user's language and retrieve content in that language.",
      "Native-quality, locale-aware content beats raw machine translation for citations.",
      "Use hreflang to map each language/region version so engines serve the right one.",
      "Localize the questions, not just the words - intent and terminology differ by market.",
      "Keep a single source of truth so facts stay consistent across all language versions.",
    ],
    sections: [
      {
        heading: "Why language is a retrieval boundary",
        body: [
          "When a user asks a question in Spanish or German, the answer engine retrieves and synthesizes primarily from content in that language. Your excellent English page is not in the candidate set for a German query unless there is a German version that resolves it. Citation, in other words, is gated by language: you can only be cited in a language you have published credibly in.",
          "This makes multilingual GEO less about translation and more about coverage. Each language you serve is a separate citation market with its own questions, phrasing, and competitors. Winning citations there requires content that reads as if it were written by someone fluent in both the language and the local context.",
        ],
      },
      {
        heading: "Localize intent, not just words",
        body: [
          "The questions people ask differ by market - in wording, in the terms they use for the same concept, and sometimes in the underlying need. A direct translation of an English page can answer a question nobody in the target market actually asks, while missing the phrasing that would have matched. Effective multilingual content starts from the local questions and writes native answers to them.",
          "Raw machine translation tends to fail here. It can be a starting draft, but unreviewed it produces stilted phrasing, wrong terminology, and answers that don't match local intent - all of which reduce both human trust and the odds an engine treats the page as the best answer. Human review by a native speaker is what makes the difference.",
        ],
      },
      {
        heading: "Get the technical signals right",
        body: [
          "Beyond the content, the technical layer tells engines which version to serve to whom. Done wrong, the right page never reaches the right user.",
        ],
        bullets: [
          "hreflang: annotate each version with its language (and region, if relevant) and link them reciprocally.",
          "Self-referencing: every language version references itself plus all alternates.",
          "URLs: use a consistent structure (subdirectory, subdomain, or ccTLD) per language.",
          "One canonical per language: don't let translated pages compete as duplicates.",
          "Consistent facts: source numbers and claims from one place so versions never disagree.",
        ],
      },
      {
        heading: "Keep facts consistent across versions",
        body: [
          "A multilingual footprint multiplies the risk of contradiction - a price or statistic updated in one language but not another. Engines penalize sources that contradict themselves, and a user who gets a different answer per language loses trust. A grounded source of truth that every version draws from prevents drift.",
          "This is where Brand Memory matters for multilingual programs: it holds the canonical facts about your brand once, so content generated or written in each language stays accurate and aligned. You localize the language and intent while the underlying facts stay identical everywhere.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I just machine-translate my content for multilingual GEO?",
        a: "Not reliably. Raw translation misses local phrasing, terminology, and intent, which lowers both human trust and citation odds. Use it as a draft at most, then have a native speaker localize the questions and answers so the page reads as natively written.",
      },
      {
        q: "Does hreflang affect AI citations?",
        a: "Indirectly but importantly. hreflang helps engines and search serve the correct language/region version to each user, so the right page is in the candidate set for the right query. Misconfigured hreflang can leave the wrong version - or none - eligible to be cited.",
      },
      {
        q: "Should I prioritize languages or just translate everything?",
        a: "Prioritize. Treat each language as a citation market and invest where you have real audience and intent. A few languages done to native quality earn more citations than many done as thin translations.",
      },
    ],
    related: [
      { label: "Entity SEO explained", href: "/resources/entity-seo-explained" },
      { label: "Topical authority for GEO", href: "/resources/topical-authority-for-geo" },
      { label: "Brand Memory - grounded facts", href: "/platform/brand-memory" },
    ],
  },

  "meta-descriptions-for-ai-search": {
    slug: "meta-descriptions-for-ai-search",
    metaTitle: "Do Meta Descriptions Matter for AI Search? | Citensity",
    metaDescription:
      "Meta descriptions aren't a direct AI ranking factor, but a clear, accurate one still earns clicks and frames your page - the on-page answer is what actually gets cited.",
    updated: "2026-06-25",
    readMins: 4,
    answer:
      "Meta descriptions are not a direct ranking or citation factor for AI search - engines build answers from the page's body content, not the meta description. They still matter, though: a clear, accurate description earns clicks when your page is surfaced, and it accurately frames the page. The work that actually wins citations is the on-page answer, structure, and evidence.",
    takeaways: [
      "Meta descriptions aren't a ranking signal and aren't where citations come from.",
      "They still drive click-through when your page appears in a result or answer.",
      "Engines may rewrite the snippet anyway; treat yours as a strong default, not a guarantee.",
      "Spend the real effort on the on-page answer - that's what gets extracted.",
      "Keep it accurate; a misleading description erodes trust and lifts bounce.",
    ],
    sections: [
      {
        heading: "What meta descriptions do and don't do",
        body: [
          "A meta description is the short summary a search engine may display under your title in results. It has never been a ranking factor, and AI answer engines don't synthesize answers from it - they read and quote the page's actual content. So no amount of meta-description tuning will get you cited if the body doesn't contain a clear, retrievable answer.",
          "What the meta description does do is influence whether someone clicks when your page is shown, and it gives a compact, accurate framing of the page. Search engines also frequently rewrite the displayed snippet to better match the query, so your description is a strong default rather than a fixed promise.",
        ],
      },
      {
        heading: "Why the on-page answer is the real lever",
        body: [
          "Citations come from passages an engine retrieves from your page. That means the highest-leverage 'description' is the answer-first opening sentence in your body content - the self-contained statement that resolves the query. Invest there: make the first thing under your matching heading a quotable, accurate answer.",
          "In short, write the meta description for the human deciding whether to click, and write the page opening for the engine deciding whether to cite. They are two different jobs, and conflating them leads people to over-invest in the one that doesn't move citations.",
        ],
      },
      {
        heading: "How to write a meta description that still earns its place",
        body: ["Keep it useful and honest - it's a click and framing tool, so optimize it for that."],
        bullets: [
          "Lead with what the reader gets; mirror the query's language.",
          "Keep it roughly 150-160 characters so it isn't truncated.",
          "Make it accurate - overpromising raises bounce and erodes trust.",
          "Write a unique description per page; don't reuse a boilerplate.",
          "Don't keyword-stuff; write a sentence a person would want to click.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do meta descriptions affect AI Overviews or ChatGPT citations?",
        a: "No, not directly. Those engines build answers from the page's body content, not the meta description. A clear meta description can earn the click when your page is linked, but the citation itself comes from the on-page answer.",
      },
      {
        q: "Should I still write meta descriptions?",
        a: "Yes. They influence click-through from search results and give an accurate framing of the page. Just don't expect them to drive citations - treat them as a conversion tool for the human reader, separate from your extraction work.",
      },
      {
        q: "Why does Google sometimes ignore my meta description?",
        a: "Search engines often rewrite the displayed snippet to better match the specific query, pulling a more relevant sentence from your page. Write a strong default, but accept that the engine may show its own snippet when it judges that more useful.",
      },
    ],
    related: [
      { label: "Answer-shaped content", href: "/resources/answer-shaped-content" },
      { label: "How to write a TL;DR that gets cited", href: "/resources/how-to-write-a-tldr-that-gets-cited" },
      { label: "Page Engine - generated pages", href: "/platform/page-engine" },
    ],
  },

  "how-to-make-content-quotable": {
    slug: "how-to-make-content-quotable",
    metaTitle: "How to Make Your Content Quotable by AI | Citensity",
    metaDescription:
      "Make content quotable by AI with self-contained, specific, conclusion-first sentences that resolve a question on their own - so an engine can lift them cleanly.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "Content is quotable by AI when individual sentences can be lifted out of the page and remain true, clear, and complete on their own. You achieve that by writing conclusion-first, self-contained, specific statements - no unresolved pronouns, no dependence on the sentence before - because an answer engine quotes the passage that resolves a query without needing the rest of your page.",
    takeaways: [
      "The test: could this sentence be pasted into someone else's answer and still be true and clear?",
      "Lead with the conclusion, then the qualifier - so the liftable part stands alone.",
      "Kill unresolved references: no 'this', 'that', 'as above', 'the former'.",
      "Be specific - name the thing, the number, the mechanism, not 'it depends'.",
      "Match the phrasing of the question so the passage is an obvious fit.",
    ],
    sections: [
      {
        heading: "Quotability is a sentence-level property",
        body: [
          "Engines don't quote pages; they quote passages. When an answer is assembled, the model lifts the clearest sentence or two that resolve the query and attributes them. So quotability is decided at the level of individual sentences, not the document. A brilliant page made of sentences that only make sense in sequence gives an engine nothing it can safely extract.",
          "The single best diagnostic is the paste test: take any sentence, drop it into a stranger's answer with no surrounding context, and ask whether it is still true and comprehensible. If it depends on the previous sentence, names an unresolved 'this', or trails off into 'it depends', it fails - and the engine will likely pass it over.",
        ],
      },
      {
        heading: "The shape of a quotable sentence",
        body: [
          "Quotable sentences share a recognizable structure. They state the conclusion first, scope it second, and stay concrete throughout. They echo the language of the question so the match is obvious, and they avoid the hedge-stacking ('may sometimes possibly') that leaves no firm claim to quote.",
        ],
        bullets: [
          "Conclusion-first: 'X does Y' before 'because' or 'when'.",
          "Self-contained: every pronoun and reference resolves within the sentence.",
          "Specific: a named entity, number, or mechanism - not a vague gesture.",
          "Plain: short clauses and common words; one idea per sentence.",
          "Question-shaped: reuse the words people use to ask, so retrieval matches.",
        ],
      },
      {
        heading: "Make the whole page reinforce the quote",
        body: [
          "A quotable sentence is stronger when the page around it backs it up consistently. Put the most quotable statement high on the page, under a heading that matches the question, then have the body substantiate the same claim rather than introduce a competing one. Engines reward consistency; a page that contradicts its own headline answer is a weaker source.",
          "Evidence raises quotability too. A claim attached to a specific figure, a named source, or a clear method is safer for an engine to attribute, so it's more likely to be the sentence chosen. The aim is a page where the best sentence is easy to find, easy to lift, and easy to trust.",
        ],
      },
    ],
    faqs: [
      {
        q: "How is making content quotable different from writing a TL;DR?",
        a: "A TL;DR applies the quotability principles to one place - the page's opening answer. Making content quotable applies the same rules everywhere: every section's key sentence should pass the paste test, so any of them can be cited for the question it answers.",
      },
      {
        q: "Does quotable writing hurt readability for humans?",
        a: "No - it improves it. Conclusion-first, specific, self-contained sentences are easier for people to scan and understand too. The clarity that earns AI citations is the same clarity that keeps human readers engaged.",
      },
      {
        q: "Should every sentence be quotable?",
        a: "Not literally every one - transitions and context have their place. But the key claim in each section should be quotable, because that's the sentence an engine will reach for when answering the question that section addresses.",
      },
    ],
    related: [
      { label: "How to write a TL;DR that gets cited", href: "/resources/how-to-write-a-tldr-that-gets-cited" },
      { label: "Answer-shaped content", href: "/resources/answer-shaped-content" },
      { label: "Statistics and original data for GEO", href: "/resources/statistics-and-original-data-for-geo" },
    ],
  },

  "best-geo-tools": {
    slug: "best-geo-tools",
    metaTitle: "The Best GEO Tools in 2026 | Citensity",
    metaDescription:
      "The best GEO tools track AI citations, audit content for extractability, and publish answer-first pages. Here are the capability categories that matter and how to evaluate them.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "The best GEO tools in 2026 do three things well: they track whether AI engines cite your brand, they help you produce extractable, well-structured content grounded in real facts, and they audit your technical and structural readiness for AI retrieval. Rather than chasing a single brand, evaluate tools by these capabilities - citation tracking, grounded content production, and AI-readiness auditing - and how honestly they report what they actually measure.",
    takeaways: [
      "Judge GEO tools by capability category, not brand hype.",
      "Citation tracking is core - but ask exactly which engines and how it's measured.",
      "Content tooling should ground output in your real facts to avoid fabrication.",
      "AI-readiness auditing covers crawlability, structure, schema, and llms.txt.",
      "Favor tools that report honestly - heuristic estimates labeled as such, not as truth.",
    ],
    sections: [
      {
        heading: "How to evaluate a GEO tool",
        body: [
          "GEO tooling is young, and the category is noisy with products that rebrand old SEO features. The useful way to compare them is by the jobs they actually do, and by how honestly they describe their own measurement. A tool that claims to 'track every AI citation everywhere' without explaining its method should be treated with caution - the engines differ in how observable they are.",
          "Three capability areas matter most. Measurement (do you appear in AI answers, and where), production (can you create content engines want to cite), and readiness (is your site technically and structurally fit for AI retrieval). A complete GEO program touches all three; many tools cover one.",
        ],
      },
      {
        heading: "Capability 1: AI citation and visibility tracking",
        body: [
          "The defining GEO capability is knowing whether engines cite you. Good tracking runs your priority questions through engines, records whether your brand appears and in what context, and trends it over time and against competitors (share of voice). The key evaluation question is method: which engines, sampled how, and is a figure a measured citation or a heuristic estimate?",
        ],
        bullets: [
          "Coverage: which engines (ChatGPT, Perplexity, Google AI surfaces, Gemini, Copilot, Claude).",
          "Method transparency: measured citations vs. modeled estimates, clearly labeled.",
          "Competitive view: share of voice against the brands you actually compete with.",
          "Attribution: can it connect AI visibility to traffic and pipeline.",
        ],
      },
      {
        heading: "Capability 2: grounded content production",
        body: [
          "The second area is producing content engines want to cite - answer-first, well-structured, and, critically, grounded in your real facts. The biggest risk in AI-assisted content is fabrication; a tool that generates confident but invented claims will get you contradicted and dropped from answers. Look for a grounded source of truth that constrains generation to facts you've verified.",
          "Strong production tooling also handles structure (headings, tables, schema, llms.txt) and publishing, so the output is extractable end to end. This is the model Citensity follows: Brand Memory holds the verified facts, the Page Engine generates and publishes answer-first pages from them, and the AI Feed emits the structured signals engines consume.",
        ],
      },
      {
        heading: "Capability 3: AI-readiness auditing",
        body: [
          "The third area is diagnosing whether your site is fit for AI retrieval at all. This covers the technical layer (can AI crawlers fetch your pages, is robots.txt configured for them, is the site fast and renderable) and the structural layer (are answers extractable, is schema valid, is there an llms.txt). A great content strategy fails silently if engines can't access or parse the pages.",
          "When assembling a stack, prioritize honest measurement and grounded production over feature count. A tool that tells you plainly what it can and can't see is more valuable than one that paints an optimistic picture you can't act on.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do I need a dedicated GEO tool, or is SEO tooling enough?",
        a: "SEO tools cover crawlability and ranking, which remain foundational, but they don't tell you whether AI engines cite you or whether your answers are extractable. A GEO capability - citation tracking plus grounded, structured content production - is what's distinct, whether it's a dedicated tool or a feature set added to your stack.",
      },
      {
        q: "How can a tool track ChatGPT citations if there's no public API for it?",
        a: "Most tracking works by sampling: running a set of representative prompts through engines and recording outcomes. That's a valid signal but it's a sample, not a census. The tools worth trusting say so plainly and distinguish measured results from heuristic estimates.",
      },
      {
        q: "What's the single most important GEO tool capability?",
        a: "Honest citation tracking, because it's the only way to know if anything you do is working. Production and auditing tools are how you act on what tracking reveals - but without measurement you're optimizing blind.",
      },
    ],
    related: [
      { label: "How to track AI citations", href: "/resources/how-to-track-ai-citations" },
      { label: "AI share of voice", href: "/resources/ai-share-of-voice" },
      { label: "Analytics - AI citation tracking", href: "/platform/analytics" },
    ],
  },

  "how-to-audit-your-ai-visibility": {
    slug: "how-to-audit-your-ai-visibility",
    metaTitle: "How to Audit Your AI Visibility | Citensity",
    metaDescription:
      "Audit AI visibility by testing your priority questions across engines, checking crawl access for AI bots, and assessing whether your answers are extractable and well-structured.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "To audit your AI visibility, run your most important questions through the major answer engines and record whether and how your brand appears, then check the two things that determine that outcome: technical access (can AI crawlers reach and render your pages) and content readiness (are your answers extractable, structured, and grounded). The audit's job is to turn a vague sense of 'are we showing up in AI?' into a specific list of fixes.",
    takeaways: [
      "Start from real questions: test the queries your buyers actually ask AI.",
      "Record presence and context per engine, not a single yes/no.",
      "Check AI-crawler access - robots.txt, rendering, speed - or content can't be cited.",
      "Assess extractability: answer-first openings, clear headings, tables, valid schema.",
      "Output a prioritized fix list, then re-audit to confirm the changes worked.",
    ],
    sections: [
      {
        heading: "Step 1: define the questions that matter",
        body: [
          "An AI visibility audit is only as good as the questions you test. Don't start from keywords; start from the real questions a prospect would ask an answer engine on the way to choosing a product like yours - including comparison and 'best X for Y' queries where recommendations are made. Twenty to fifty well-chosen questions usually cover the surface that matters.",
          "Group them by intent (informational, comparison, transactional) so you can see where you're strong and where you're invisible. The comparison and recommendation questions are often the highest-value and the easiest to be absent from.",
        ],
      },
      {
        heading: "Step 2: test across engines and record context",
        body: [
          "Run each question through the engines your audience uses and capture more than a binary. Note whether your brand is mentioned, whether it's cited with a link, the context (recommended, listed, described accurately or not), and which competitors appear. Inaccurate mentions are a finding too - they point to facts engines have wrong about you.",
        ],
        bullets: [
          "Per engine: ChatGPT, Perplexity, Google AI surfaces, Gemini, Copilot, Claude as relevant.",
          "Per question: mentioned? cited with a source link? accurate? recommended or just listed?",
          "Competitors: who shows up where you don't - that's your gap list.",
          "Sample more than once: answers vary, so a single run isn't conclusive.",
        ],
      },
      {
        heading: "Step 3: diagnose why - access and extractability",
        body: [
          "Where you're absent or misrepresented, the cause is almost always one of two things. First, access: if AI crawlers are blocked in robots.txt, the page renders only via heavy client-side JavaScript, or the site is too slow, engines may never fetch the content. Second, extractability: even when fetched, a page with buried answers, vague headings, no structure, or invalid schema is hard to retrieve and quote.",
          "Check both. Confirm the relevant AI user-agents are allowed and that key content is in the served HTML. Then read your top pages as an engine would: is the answer first, are headings question-shaped, are data and steps in tables and lists, is the schema valid? Each 'no' is a concrete fix.",
        ],
      },
      {
        heading: "Step 4: prioritize, fix, and re-audit",
        body: [
          "Turn findings into a ranked action list - access blockers first (they gate everything), then high-value questions where you're absent but the page exists, then structural fixes to make existing answers extractable. Tie each item to the question it should help you win, so the work is measurable.",
          "Then close the loop: re-run the same questions after changes ship. AI visibility auditing is continuous, not one-off, because engines and your content both change. A platform like Citensity automates the tracking and re-testing so the audit becomes an ongoing signal rather than a quarterly project.",
        ],
      },
    ],
    faqs: [
      {
        q: "How often should I audit AI visibility?",
        a: "Treat it as continuous monitoring with deeper reviews monthly or quarterly. Engine answers shift over time and after your own content changes, so a one-off audit goes stale quickly. Ongoing tracking of your priority questions is what catches regressions and wins.",
      },
      {
        q: "Why does the same question give different AI answers each time?",
        a: "Answer engines have inherent variability and may retrieve slightly different sources per run. That's why you sample a question more than once and look at patterns rather than a single response - consistent absence or presence is the signal, not one result.",
      },
      {
        q: "What's the most common reason a brand has zero AI visibility?",
        a: "Usually a combination of access and extractability: AI crawlers can't fully fetch the pages, and the answers aren't structured to be lifted. Less often it's a genuine content gap - no page addresses the question at all. The audit tells you which.",
      },
    ],
    related: [
      { label: "How to track AI citations", href: "/resources/how-to-track-ai-citations" },
      { label: "AI bot traffic in server logs", href: "/resources/ai-bot-traffic-in-server-logs" },
      { label: "Analytics - AI citation tracking", href: "/platform/analytics" },
    ],
  },

  "how-to-set-up-ai-citation-monitoring": {
    slug: "how-to-set-up-ai-citation-monitoring",
    metaTitle: "How to Set Up AI Citation Monitoring | Citensity",
    metaDescription:
      "Set up AI citation monitoring by defining priority prompts, testing them across engines on a schedule, and tracking presence and share of voice over time.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "You set up AI citation monitoring by defining a fixed set of priority prompts, running them across the engines your audience uses on a regular schedule, and recording whether your brand appears, whether it's cited with a source, and how it compares to competitors. The point is a repeatable signal over time - a one-off check tells you almost nothing because engine answers vary.",
    takeaways: [
      "Monitoring is a repeatable process on a fixed prompt set - not a one-time check.",
      "Define priority prompts from the questions buyers actually ask AI.",
      "Run them across engines on a schedule and sample each prompt more than once.",
      "Record presence, citation-with-source, accuracy, and competitor mentions.",
      "Track the trend and share of voice; alert on regressions and new wins.",
    ],
    sections: [
      {
        heading: "Step 1: lock a priority prompt set",
        body: [
          "Monitoring needs a stable input or you can't compare across time. Build a fixed list of the questions that matter - the informational, comparison, and recommendation queries a prospect asks an AI on the way to choosing your category. Keep the set stable so week-over-week changes reflect reality, not a changing question list, and version it when you deliberately add prompts.",
          "Prioritize ruthlessly. A focused set of high-intent prompts you watch consistently is far more useful than a sprawling list you sample erratically. Comparison and 'best tool for X' prompts usually deserve top priority because that's where recommendations get made.",
        ],
      },
      {
        heading: "Step 2: run across engines on a schedule",
        body: [
          "Run the prompt set through each engine your audience uses, on a cadence (weekly is a common starting point). Because answers vary run to run, sample each prompt more than once and look at the pattern. Consistency of method matters more than frequency - same prompts, same engines, same way of recording.",
        ],
        bullets: [
          "Engines: cover the ones your buyers actually use, not every engine that exists.",
          "Cadence: pick an interval you can sustain; weekly is a sensible default.",
          "Sampling: multiple runs per prompt to smooth out variability.",
          "Consistency: hold the method fixed so trends are comparable over time.",
        ],
      },
      {
        heading: "Step 3: record the right fields",
        body: [
          "Capture more than 'mentioned: yes/no'. For each prompt and engine, record whether your brand appears, whether it's cited with a source link, whether the mention is accurate, what context it appears in (recommended vs. merely listed), and which competitors show up. Accuracy is its own field - an engine confidently stating something wrong about you is a monitoring alert, not noise.",
          "Structured records turn into the metrics that matter: presence rate, citation rate, accuracy rate, and share of voice against competitors. Those are what you trend.",
        ],
      },
      {
        heading: "Step 4: trend, alert, and act",
        body: [
          "The output of monitoring is a trend line and a comparison, not a snapshot. Watch presence and share of voice over time, alert when you lose a citation you used to win or when a competitor takes a prompt you held, and feed wins back into your content strategy - the formats and topics that get cited tell you where to invest next.",
          "Doing this by hand across many prompts and engines doesn't scale, which is the case for tooling. Citensity Analytics runs this loop continuously - tracking AI citations and share of voice across engines and surfacing regressions - so monitoring is a standing signal rather than a manual chore. Be clear-eyed about method: distinguish measured citations from heuristic estimates so the numbers stay trustworthy.",
        ],
      },
    ],
    faqs: [
      {
        q: "How is citation monitoring different from a one-time AI visibility audit?",
        a: "An audit is a deep, point-in-time diagnosis; monitoring is the ongoing, repeatable signal that tells you whether things are improving. You typically audit to find issues, then monitor a fixed prompt set to confirm fixes worked and to catch regressions early.",
      },
      {
        q: "How many prompts should I monitor?",
        a: "Enough to cover your high-intent questions and no more than you can sample consistently - often a few dozen. A smaller set you watch reliably beats a large set you sample erratically, because comparability over time is the whole point.",
      },
      {
        q: "Can I trust a tool that claims to count every AI citation?",
        a: "Be skeptical of 'every'. Most monitoring is sample-based - running prompts and recording outcomes - which is a valid signal but not a census. Trustworthy tools label measured citations versus heuristic estimates so you know what the number means.",
      },
    ],
    related: [
      { label: "How to track AI citations", href: "/resources/how-to-track-ai-citations" },
      { label: "AI share of voice", href: "/resources/ai-share-of-voice" },
      { label: "Analytics - AI citation tracking", href: "/platform/analytics" },
    ],
  },

  "robots-txt-for-ai-crawlers": {
    slug: "robots-txt-for-ai-crawlers",
    metaTitle: "robots.txt for AI Crawlers: Config Guide | Citensity",
    metaDescription:
      "Configure robots.txt for AI crawlers per user-agent. Allowing answer-engine bots is what makes your content eligible to be retrieved and cited in live answers.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "robots.txt controls which AI crawlers may access your site, and you configure it per user-agent. The key decision is to allow the bots that power answer engines - if you block them, your content cannot be retrieved or cited. Many operators allow answer/retrieval bots while making a separate, deliberate choice about training bots, since those serve different purposes.",
    takeaways: [
      "robots.txt directives are per user-agent; you can allow some AI bots and block others.",
      "Blocking an answer-engine's crawler usually means you can't be cited by it.",
      "Distinguish training crawlers from live answer/retrieval crawlers - they differ.",
      "robots.txt is a public, voluntary standard - it's a request, not an enforced lock.",
      "Verify with server logs that the bots you intend to allow are actually getting through.",
    ],
    sections: [
      {
        heading: "How robots.txt and AI crawlers interact",
        body: [
          "robots.txt is a file at your site root that tells crawlers which paths they may request, addressed per user-agent. AI companies operate named crawlers, and you can write rules for each one - allowing a search/answer bot while disallowing another. The mechanism is the same one that's governed search crawlers for years; what's new is the set of user-agents and the stakes.",
          "The crucial point for GEO: if you disallow the crawler that an answer engine uses to fetch live content, that engine generally cannot retrieve your pages and therefore cannot cite them. So robots.txt is not just a technical hygiene file anymore - it's a direct lever on whether you're eligible to appear in AI answers.",
        ],
      },
      {
        heading: "Training bots vs. answer/retrieval bots",
        body: [
          "Not all AI crawlers do the same job, and conflating them leads to mistakes. Broadly, some crawlers gather content to train or update models, while others fetch pages in real time to ground an answer the user is asking right now. The retrieval/answer crawlers are the ones whose access most directly affects whether you get cited in live answers.",
          "This is why the decision is per user-agent rather than all-or-nothing. A publisher might choose to allow answer/retrieval bots (to remain citable) while making a separate, considered decision about training bots based on its own policy. Decide each deliberately rather than blanket-blocking or blanket-allowing, and document why.",
        ],
        bullets: [
          "Identify the named user-agent for each crawler you care about before writing a rule.",
          "Allow answer/retrieval crawlers if you want to be eligible for live citations.",
          "Make a separate, explicit decision on training crawlers per your content policy.",
          "Don't accidentally catch AI bots in a broad 'Disallow: /' meant for something else.",
          "Re-check periodically - crawler names and behaviors change over time.",
        ],
      },
      {
        heading: "robots.txt is voluntary - know its limits",
        body: [
          "robots.txt is a public, voluntary standard. Well-behaved crawlers honor it, but it is a request, not an enforced barrier - it does not authenticate or block anything at the network level. If you need to actually prevent access, that requires real access controls (authentication, server-side blocking), not a robots rule. And because the file is public, your directives are visible to anyone.",
          "The practical takeaway: use robots.txt to express intent to compliant crawlers, but verify reality in your server logs. Confirm the bots you meant to allow are getting 200s and the ones you meant to block aren't being served - intent and outcome can diverge, especially after a config change.",
        ],
      },
    ],
    faqs: [
      {
        q: "If I block AI training bots, will I lose AI citations?",
        a: "Not necessarily - it depends which bot. Citations in live answers depend on the answer/retrieval crawler being allowed. Some engines separate the crawler that trains models from the one that fetches pages to ground a live answer, so the per-user-agent decision matters; blocking the wrong one can cost citations.",
      },
      {
        q: "Does robots.txt actually stop a crawler from accessing my site?",
        a: "Only voluntarily. It's a standard that well-behaved crawlers obey, but it doesn't authenticate or block at the network level. To truly prevent access you need server-side controls. Treat robots.txt as a clearly-stated request, and verify behavior in your logs.",
      },
      {
        q: "How do I know which AI crawler user-agents to list?",
        a: "Each AI company publishes the user-agent strings for its crawlers, and you can see what's actually hitting your site in server logs. Identify the named agents for the engines your audience uses, then write per-agent rules - don't guess or rely on a generic wildcard.",
      },
    ],
    related: [
      { label: "GPTBot and AI crawlers", href: "/resources/gptbot-and-ai-crawlers" },
      { label: "AI bot traffic in server logs", href: "/resources/ai-bot-traffic-in-server-logs" },
      { label: "What is llms.txt?", href: "/resources/what-is-llms-txt" },
    ],
  },

  "schema-markup-mistakes": {
    slug: "schema-markup-mistakes",
    metaTitle: "Schema Markup Mistakes That Cost Citations | Citensity",
    metaDescription:
      "Common schema mistakes - marking up content not on the page, wrong types, invalid syntax, and inconsistency with visible text - undermine the trust signals AI engines rely on.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "The schema markup mistakes that cost citations all break the link between your structured data and what's actually on the page: marking up content that isn't visible, choosing the wrong type, shipping invalid syntax, and letting the schema contradict the page text. Schema works as a trust and disambiguation signal only when it accurately mirrors the page - inaccurate markup is worse than none, because it erodes the trust it's meant to build.",
    takeaways: [
      "Don't mark up content that isn't visible on the page - that's a guidelines violation.",
      "Use the correct, specific type; the wrong type misdescribes your content.",
      "Invalid JSON-LD syntax can void the whole block - validate every time.",
      "Schema must match the visible text; contradictions destroy trust.",
      "More schema isn't better - relevant, accurate markup beats a kitchen sink.",
    ],
    sections: [
      {
        heading: "Why schema mistakes hurt more than missing schema",
        body: [
          "Structured data is a machine-readable description of your page - it helps engines disambiguate entities, understand content types, and trust what the page is about. But its entire value rests on accuracy. When the markup says something the page doesn't, you haven't added a helpful signal; you've added a misleading one, and engines learn to distrust a source whose schema and content disagree.",
          "That's why a few specific mistakes are so costly. Each one breaks the correspondence between the structured claim and the visible reality, which is exactly the correspondence engines use schema to verify.",
        ],
      },
      {
        heading: "The mistakes that recur",
        body: [
          "Most schema problems fall into a short list. Watch for these specifically - they're the ones that show up again and again in audits.",
        ],
        bullets: [
          "Marking up invisible content: schema describing things not present on the page.",
          "Wrong type: using a generic or mismatched type instead of the specific correct one.",
          "Invalid syntax: a malformed JSON-LD block that a parser rejects entirely.",
          "Contradicting the page: a rating, price, or fact in schema that differs from the visible text.",
          "Incompleteness: omitting properties an engine needs to use the markup at all.",
          "Over-marking: stuffing irrelevant schema types hoping more is better.",
        ],
      },
      {
        heading: "How to keep schema clean",
        body: [
          "The discipline is simple: mark up only what's on the page, with the most specific correct type, in valid syntax, kept consistent with the visible content. Validate every block with a structured-data testing tool before and after publishing, and re-validate when the page changes, because a content edit can silently break the correspondence.",
          "Treat schema as a complement to good on-page structure, not a substitute for it. Engines extract answers from your visible content; schema helps them interpret and trust that content. Get the page right first, then add accurate markup that mirrors it. An AI Feed that generates JSON-LD from your actual page content - rather than hand-maintained markup that drifts - is one reliable way to keep the two aligned.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is bad schema worse than no schema?",
        a: "Yes, in the sense that inaccurate or invalid markup can mislead engines and erode trust, while a clean page with no schema is simply neutral. If you can't keep schema accurate and consistent with the page, it's better to ship none than to ship markup that contradicts your content.",
      },
      {
        q: "Can I mark up content that's only in a hidden tab or accordion?",
        a: "Be careful. Marking up content users can reach by interacting with the page is generally fine, but marking up content that isn't actually present is a guidelines violation. The rule of thumb: the schema must describe what's genuinely on the page.",
      },
      {
        q: "Does adding more schema types improve AI citations?",
        a: "No - relevance and accuracy matter, not volume. Use the specific types that correctly describe your content. Piling on irrelevant types adds noise, risks contradictions, and can look manipulative. A few accurate types beat a long list of loosely-applicable ones.",
      },
    ],
    related: [
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "Schema types that matter for AI", href: "/resources/schema-types-that-matter-for-ai" },
      { label: "AI Feed - JSON-LD and llms.txt", href: "/platform/ai-feed" },
    ],
  },

  "how-often-to-publish-for-geo": {
    slug: "how-often-to-publish-for-geo",
    metaTitle: "How Often Should You Publish for GEO? | Citensity",
    metaDescription:
      "For GEO, publishing cadence matters less than quality and coverage. Publish as often as you can produce genuinely useful, citable pages - and refresh existing ones.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "There's no fixed publishing frequency for GEO - cadence matters far less than the quality and topical coverage of what you publish. The right pace is the fastest at which you can produce genuinely useful, citable, well-structured pages without thinning quality, paired with regularly refreshing existing pages. Volume of mediocre content hurts; depth of coverage and accuracy help.",
    takeaways: [
      "There's no magic number - quality and coverage beat raw frequency.",
      "Publish as fast as you can without diluting quality; thin content backfires.",
      "Refreshing existing pages often beats publishing new ones, for both freshness and accuracy.",
      "Match cadence to topical coverage goals, not to an arbitrary content calendar.",
      "Some topics need recency; others stay valid for years - cadence should follow the topic.",
    ],
    sections: [
      {
        heading: "Why frequency is the wrong question",
        body: [
          "People want a number - 'publish X posts a week' - but GEO doesn't reward cadence for its own sake. Answer engines cite the source that resolves a question best, and a flood of thin, padded pages makes you a worse source, not a better one, because it dilutes the perceived quality of your whole domain. There's no credit for posting often; there's credit for being the clearest, most trustworthy answer to real questions.",
          "So reframe it from 'how often' to 'how completely and how well'. The useful target is coverage - having a strong page for every high-value question in your topic - and quality - each of those pages being genuinely citable. Cadence is just the rate at which you close coverage gaps, bounded by the quality you can sustain.",
        ],
      },
      {
        heading: "Refresh is often higher-leverage than new",
        body: [
          "A trap in cadence thinking is treating 'publishing' as only new pages. For GEO, updating existing pages is frequently the higher-return activity. Engines favor accurate, current information for many queries, and an outdated fact or stale statistic on a page you already rank for can quietly cost you citations or get you contradicted.",
          "So allocate part of your cadence to refresh: revisit your top pages, correct anything that's drifted, deepen answers, and keep facts current. A well-maintained library of accurate pages outperforms a constantly-growing pile where older pages rot. This is the freshness-and-accuracy lever, and it doesn't require a single new URL.",
        ],
      },
      {
        heading: "Let the topic set the pace",
        body: [
          "Different topics decay at different rates. A page on a fast-moving area (pricing, a tool comparison in an active market, anything tied to current platform behavior) needs frequent updates to stay accurate and citable. A foundational explainer can stay valid for a long time with only light maintenance. Cadence should follow this, not a uniform calendar.",
        ],
        bullets: [
          "Time-sensitive topics: shorter refresh intervals; recency is a citation factor.",
          "Evergreen explainers: publish well once, then maintain lightly and accurately.",
          "Coverage gaps: prioritize new pages where a high-value question has no answer yet.",
          "Sustainable quality: never publish faster than you can keep it genuinely useful.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does publishing more frequently improve GEO performance?",
        a: "Not on its own. Frequency only helps if every page is genuinely useful and citable; a high volume of thin content dilutes quality signals and can hurt. The better goals are complete topical coverage and accurate, well-structured pages - publish as fast as you can hit that bar, no faster.",
      },
      {
        q: "Is it better to publish new pages or update old ones?",
        a: "Often updating, especially once you have coverage. Engines favor accurate, current content, so refreshing top pages to keep facts right and answers deep frequently returns more than adding new URLs. Split effort: close real coverage gaps with new pages, and maintain the rest.",
      },
      {
        q: "How do I know if I'm publishing too much?",
        a: "If quality is slipping to hit a cadence - thinner answers, padded sections, near-duplicate pages - you're publishing too much. The right rate is the maximum you can sustain while every page stays genuinely useful and accurate. Quality is the constraint, not the schedule.",
      },
    ],
    related: [
      { label: "Freshness and content decay", href: "/resources/freshness-and-content-decay" },
      { label: "Content refresh strategy", href: "/resources/content-refresh-strategy" },
      { label: "Content & Authority", href: "/platform/content-authority" },
    ],
  },
};