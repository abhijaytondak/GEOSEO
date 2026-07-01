import type { Article } from "@/components/resources/content-types";

export const BATCH_WORKFLOWS: Record<string, Article> = {
  "how-ai-engines-choose-sources": {
    slug: "how-ai-engines-choose-sources",
    metaTitle: "How Do AI Engines Choose Which Sources to Cite? | Citensity",
    metaDescription:
      "AI engines retrieve candidate passages, rank them for relevance and trust, then attribute the answer to the few they actually leaned on. Here's the mechanism — and what makes a passage citable.",
    updated: "2026-06-30",
    readMins: 7,
    answer:
      "AI engines choose sources in two stages: first they retrieve a set of candidate passages that match the query (via search APIs and their own index), then they synthesize an answer and attribute it to the handful of passages they actually relied on. A passage gets cited when it is the clearest, most directly relevant, and most trustworthy answer to the specific question — unambiguous wording, a self-contained claim the model can lift without surrounding context, and corroboration from other sources the engine already trusts.",
    takeaways: [
      "Citation is a two-step funnel: be retrievable (in the candidate set), then be the passage worth attributing.",
      "Engines favour self-contained claims — a sentence that answers the question on its own, without needing the paragraph around it.",
      "Trust is corroboration: a claim echoed across several independent sources is safer to cite than one that appears only on your page.",
      "Specificity wins. A passage that answers the exact question beats a broad page that mentions the topic.",
      "Freshness and clear authorship break ties when several passages are equally relevant.",
    ],
    sections: [
      {
        heading: "Step one: retrieval — getting into the candidate set",
        body: [
          "Before an engine can cite you, it has to find you. Most answer engines run a retrieval step — they issue one or more searches (their own index, a partner search API, or a live web fetch) and pull back a few dozen candidate passages that look relevant to the query. If your page isn't in that candidate set, nothing else matters; you can't be cited from passages the model never saw.",
          "Retrieval rewards the same things classic search does — crawlability, topical relevance, and authority — plus one thing that's specific to passage retrieval: chunk-level relevance. Engines don't retrieve whole pages, they retrieve passages. A page where the answer is buried in paragraph nine, wrapped in qualifiers, is a worse retrieval target than a page that states the answer cleanly near a descriptive heading.",
        ],
      },
      {
        heading: "Step two: synthesis — being the passage worth attributing",
        body: [
          "Once the candidate passages are in hand, the model writes an answer and decides which sources to name. It doesn't cite everything it retrieved — it cites the few passages it actually leaned on. The deciding factor is whether your passage is the cleanest, most liftable answer to the question being asked.",
        ],
        bullets: [
          "Directness: the passage answers the literal question, not a tangential one.",
          "Self-containment: the claim stands on its own — the model can quote it without dragging in the previous three sentences for context.",
          "Confidence: specific, falsifiable statements (numbers, named entities, concrete steps) are safer to attribute than vague hedging.",
          "Non-contradiction: the passage agrees with what the engine has read elsewhere, so citing it is low-risk.",
        ],
      },
      {
        heading: "Why trust is really corroboration",
        body: [
          "Engines can't verify a claim the way a human fact-checker would, so they lean on a proxy: agreement across independent sources. A statistic, definition, or recommendation that shows up consistently across multiple credible pages is 'safe' to repeat. A claim that exists only on your site — with nothing corroborating it — is riskier, so the model is less likely to attribute its answer to you even if your wording is good.",
          "This is why off-page signals still matter for GEO. Mentions, links, and consistent entity data across the web tell the engine that other sources treat you as authoritative. It's also why fabricated statistics backfire: the moment a claim can't be corroborated, it becomes a liability the model routes around.",
        ],
      },
      {
        heading: "The tie-breakers: specificity, freshness, authorship",
        body: [
          "When several passages are roughly equally relevant and trustworthy, secondary signals decide. Specificity is the biggest one — a page about 'how to contest a parking ticket in California' beats a generic 'parking tickets explained' page for the California query, because it answers the exact intent. Freshness breaks ties on anything time-sensitive (pricing, 'best X in 2026', recent changes). And clear authorship — a named, credentialed author and a real organization behind the page — gives the engine a reason to prefer you in domains where expertise matters.",
        ],
        bullets: [
          "Match the exact query intent, not just the topic — not every relevant page answers the literal question.",
          "Keep time-sensitive pages current so freshness breaks ties in your favour.",
          "Attribute content to a real, credentialed author and organization.",
        ],
      },
      {
        heading: "What this means for your content",
        body: [
          "The practical takeaway: write the answer first, make each key claim self-contained, ground every claim in something verifiable, and earn corroboration off-page. You're not gaming a ranking algorithm — you're making it easy and safe for a model to quote you. Pages built this way tend to win citations across engines at once, because they all reward the same clarity.",
        ],
      },
    ],
    faqs: [
      { q: "Do AI engines use Google's rankings to pick sources?", a: "Some retrieve via a search API (which carries ranking-like signals), others use their own index or live fetches. Either way, being retrievable and authoritative helps — but the final citation decision is about passage quality and trust, not ranking position alone." },
      { q: "Can I force an engine to cite me?", a: "No. You can only make your passage the most citable option — the clearest, most relevant, best-corroborated answer to the question. Citation is the engine's choice, earned by content quality, not bought or forced." },
      { q: "Why does the engine cite a weaker page over mine?", a: "Usually one of three reasons: the other page answered the exact query more directly, its claim was more self-contained, or it had stronger off-page corroboration. Audit the cited page against yours on those three axes." },
      { q: "Does structured data affect which sources get chosen?", a: "It helps retrieval and disambiguation — schema makes your claims machine-readable and your entities unambiguous — but it doesn't override relevance and trust. Treat it as table stakes, not a shortcut." },
    ],
    related: [
      { label: "How to make your content quotable by AI", href: "/resources/how-to-make-content-quotable" },
      { label: "E-E-A-T for AI search", href: "/resources/eeat-for-ai-search" },
      { label: "Why backlinks still matter", href: "/resources/backlinks-still-matter" },
    ],
  },

  "the-geo-content-workflow": {
    slug: "the-geo-content-workflow",
    metaTitle: "The GEO Content Workflow: Research to Measurement | Citensity",
    metaDescription:
      "A repeatable, end-to-end workflow for producing content that AI engines cite: query research, answer-first briefs, drafting, optimization, publishing, and citation measurement.",
    updated: "2026-06-30",
    readMins: 8,
    answer:
      "The GEO content workflow is a repeatable six-stage loop: (1) research the real questions people ask AI engines, (2) write an answer-first brief that defines the citable claim, (3) draft the page lead-with-the-answer, (4) optimize for extraction with structure and schema, (5) publish on a crawlable surface with internal links, and (6) measure which engines cite you and close the gaps. The point of a defined workflow is consistency — every page is built to be cited, not just to exist.",
    takeaways: [
      "Treat GEO content as a loop, not a one-off — research and measurement feed the next round.",
      "The brief is where citability is won or lost: define the exact question and the self-contained answer before drafting.",
      "Drafting and optimization are separate steps — write the substance first, then engineer it for extraction.",
      "Publishing isn't the finish line; measuring citations and refreshing decayed pages is half the work.",
      "A consistent workflow lets you scale volume without dropping the quality bar that earns citations.",
    ],
    sections: [
      {
        heading: "Stage 1 — Research the questions, not just keywords",
        body: [
          "GEO research starts from the questions people actually ask AI engines, which are longer and more conversational than head keywords. Mine them from your sales and support conversations, from autocomplete and 'people also ask', and by asking the engines themselves what buyers in your space want to know. Group the questions by intent and funnel stage so you know which ones convert.",
          "The output of this stage is a prioritized question list — each item a real query, tagged with intent and an estimate of how citable the space is (is there a clear, factual answer you can own?).",
        ],
      },
      {
        heading: "Stage 2 — Write the brief: define the citable claim",
        body: [
          "Before anyone drafts, write a one-page brief that locks down what the page must do. The most important line is the answer itself — the single, self-contained sentence you want an engine to lift. If you can't write that sentence in the brief, the page isn't ready to draft.",
        ],
        bullets: [
          "The exact question the page answers (in the user's words).",
          "The answer-first claim — one or two sentences, self-contained and verifiable.",
          "The supporting evidence: data, examples, and named entities that ground the claim.",
          "Structure: the H2s, any table or list, and the FAQ questions.",
          "Internal links in and out, and the conversion path.",
        ],
      },
      {
        heading: "Stage 3 — Draft answer-first",
        body: [
          "Drafting from a good brief is fast because the thinking is done. Open with the answer, then expand. Each section should answer one sub-question under a descriptive heading, in short paragraphs, with the key claim stated plainly so it survives being lifted out of context. Resist the urge to bury the answer behind a long preamble — the lead is the most-cited part of the page.",
          "Write for a human reader first; the structure that helps an engine extract your content is the same structure that helps a person scan it.",
        ],
      },
      {
        heading: "Stage 4 — Optimize for extraction",
        body: [
          "With the substance written, engineer it for machine extraction. This is a checklist pass, not a rewrite.",
        ],
        bullets: [
          "Add a scannable TL;DR / takeaways block near the top.",
          "Convert dense comparisons into tables and steps into ordered lists, so engines can extract them cleanly.",
          "Add Article and FAQPage structured data so your claims and Q&As are machine-readable.",
          "Tighten headings so each one reads like a question or a clear claim.",
          "Confirm every statistic is real and sourced — fabricated data fails corroboration.",
        ],
      },
      {
        heading: "Stage 5 — Publish on a crawlable surface",
        body: [
          "A citable page still needs to be discoverable. Publish on a fast, crawlable URL; make sure it's in your sitemap, not blocked in robots.txt, and that AI crawlers are allowed. Link it from related pages so it inherits topical authority and so engines understand where it sits in your cluster.",
        ],
      },
      {
        heading: "Stage 6 — Measure and loop",
        body: [
          "Publishing is the midpoint. Track which engines cite the page and for which questions, watch AI-bot crawls in your logs, and attribute any pipeline back to the content. The gaps you find — questions you don't get cited for, pages that have decayed — become the input to the next research stage. That closing of the loop is what turns scattered articles into a compounding citation engine.",
        ],
      },
    ],
    faqs: [
      { q: "How long should the workflow take per article?", a: "With a tight brief, a single quality article is typically a day or two of focused work end-to-end. The brief and research stages are where you should spend the most time — drafting is fast when the citable claim is already defined." },
      { q: "Can I skip the brief and just write?", a: "You can, but citation rates suffer. The brief forces you to define the exact question and the self-contained answer before drafting — the two things that decide whether a passage gets cited. Skipping it usually means rewriting later." },
      { q: "Does this workflow work for programmatic pages?", a: "The principles do, but be careful: programmatic pages must each clear the same quality bar — a real, self-contained answer — or you risk thin-content penalties for scaled, low-value pages." },
      { q: "How does this differ from a normal SEO content process?", a: "The extra emphasis is on the self-contained, answer-first claim and on measuring citations (not just rankings and clicks). Otherwise the bones — research, brief, draft, optimize, publish, measure — are familiar." },
    ],
    related: [
      { label: "How to write a GEO content brief", href: "/resources/how-to-write-a-geo-content-brief" },
      { label: "Building a GEO content strategy", href: "/resources/building-a-geo-content-strategy" },
      { label: "Citensity Page Engine", href: "/platform/page-engine" },
    ],
  },

  "how-to-write-a-geo-content-brief": {
    slug: "how-to-write-a-geo-content-brief",
    metaTitle: "How to Write a GEO Content Brief (Template) | Citensity",
    metaDescription:
      "A GEO content brief defines the exact question, the self-contained answer, and the structure before you draft — so the page is built to be cited. Here's the template and how to use it.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "A GEO content brief is a one-page spec that defines, before drafting, the exact question a page will answer and the single self-contained sentence you want an AI engine to lift as the citation. A strong brief also fixes the supporting evidence, the heading structure, the FAQ questions, and the internal links — so the writer's job is execution, not invention, and every page ships built-to-be-cited.",
    takeaways: [
      "The brief's most important field is the answer sentence — if you can't write it, the topic isn't ready.",
      "Brief the exact question in the user's words, not a keyword — intent decides citation.",
      "Specify evidence up front: the data, examples, and entities that make the claim verifiable.",
      "Lock the structure (H2s, tables, FAQs) in the brief so extraction-readiness isn't an afterthought.",
      "A good brief makes drafting fast and keeps quality consistent as you scale.",
    ],
    sections: [
      {
        heading: "Why the brief is where citability is won",
        body: [
          "Citation is decided by two things: whether your page answers the exact question, and whether the answer is a clean, self-contained claim a model can lift. Both are decisions you make before you draft. A brief that nails them turns drafting into execution; a vague brief produces a page that mentions the topic but never becomes the answer. The brief is leverage — an hour here saves a rewrite later and lifts citation rates.",
        ],
      },
      {
        heading: "The template — eight fields",
        body: ["Keep it to one page. Every field earns its place by changing what gets written."],
        bullets: [
          "Question: the exact query, phrased the way a person would ask an AI engine.",
          "Answer: the one-to-two-sentence, self-contained claim you want cited. This is the whole point.",
          "Intent & stage: informational / commercial / comparison, and where in the funnel it sits.",
          "Evidence: the specific data, examples, and named entities that ground the answer.",
          "Structure: the H2s (each a sub-question), plus any table or step list.",
          "FAQs: 3–5 real follow-up questions for the FAQ block and schema.",
          "Internal links: what links in, what this links out to, and the conversion path.",
          "Sources: where each fact comes from, so claims can be corroborated (never fabricated).",
        ],
      },
      {
        heading: "How to write the answer field",
        body: [
          "Spend most of your brief time on the answer sentence. Make it directly responsive to the question, specific enough to be falsifiable, and complete on its own — it should make sense quoted in isolation, with no 'as mentioned above'. Avoid hedging stacks ('it depends, but generally, in some cases…') that give a model nothing firm to attribute. If a fact anchors the answer, name it and source it.",
          "A quick test: paste the answer sentence under the question with no other context. Does it fully answer it? If a reader (or a model) would still be confused, rewrite it.",
        ],
      },
      {
        heading: "Using the brief across a team or at scale",
        body: [
          "The brief is what lets you add writers or volume without quality drift, because the citable claim and structure are decided centrally. Reviewers check the draft against the brief — did it lead with the answer, is every claim sourced, does the structure match — rather than re-litigating the topic. That review-against-spec is what keeps a growing library citable instead of thin.",
        ],
      },
    ],
    faqs: [
      { q: "How long should a GEO brief be?", a: "One page. If it's longer, you're probably drafting inside the brief. The goal is a tight spec — the eight fields — that a writer can execute without guessing." },
      { q: "Who should write the brief — strategist or writer?", a: "Whoever owns the citable-claim decision, often a strategist or editor. The point is to separate the 'what must this page say and prove' decision from the 'write it well' execution." },
      { q: "Can AI help write the brief?", a: "Yes, for research and first-draft structure — but a human must own the answer sentence and verify every source, because that's exactly the part fabrication risk creeps into. Treat AI output as a starting point to verify, not a finished brief." },
      { q: "Do I need a brief for every page?", a: "For pages you want cited, yes — even a lightweight one. The discipline of writing the answer sentence first is the highest-leverage habit in GEO content." },
    ],
    related: [
      { label: "The GEO content workflow", href: "/resources/the-geo-content-workflow" },
      { label: "How to write a TL;DR that gets cited", href: "/resources/how-to-write-a-tldr-that-gets-cited" },
      { label: "Building a GEO content strategy", href: "/resources/building-a-geo-content-strategy" },
    ],
  },

  "how-to-run-a-geo-content-audit": {
    slug: "how-to-run-a-geo-content-audit",
    metaTitle: "How to Run a GEO Content Audit | Citensity",
    metaDescription:
      "A GEO content audit inventories your existing pages and scores each for citation-readiness — answer clarity, structure, evidence, and freshness — so you know what to fix, refresh, or retire.",
    updated: "2026-06-30",
    readMins: 7,
    answer:
      "A GEO content audit is a systematic review of your existing pages that scores each one for citation-readiness — does it answer a real question, lead with a self-contained claim, use extractable structure, ground its claims in verifiable evidence, and stay fresh? The output is a prioritized list of fix, refresh, consolidate, or retire actions, so you improve the content you already have before writing anything new.",
    takeaways: [
      "Audit before you write — fixing an existing page that already has authority often beats a new one.",
      "Score each page on five axes: answer clarity, structure, evidence, freshness, and intent match.",
      "Group outcomes into four actions: fix, refresh, consolidate, or retire.",
      "Thin and duplicate pages dilute authority — consolidating them can lift the whole cluster.",
      "Re-audit on a cadence; content decays and engines move, so citation-readiness isn't permanent.",
    ],
    sections: [
      {
        heading: "Why audit before creating",
        body: [
          "New content is expensive and starts from zero authority. Many of your existing pages already rank, already get crawled, and already have links — they just aren't built to be cited. Re-optimizing one of those for GEO is often higher-ROI than a brand-new page, because you're adding citability on top of authority you already earned. An audit tells you which pages those are.",
          "It also surfaces the drag on your library: thin pages, near-duplicates, and stale content that pull down trust and split authority across competing URLs. Cleaning those up can lift the pages you keep.",
        ],
      },
      {
        heading: "Build the inventory",
        body: [
          "Start with a complete list of indexable URLs — from your sitemap, your CMS, and a crawl. For each, capture the target question, current organic and AI-referral signals, last-updated date, and word count. You don't need a fancy tool to start; a spreadsheet with one row per page is enough to see the shape of your library.",
        ],
      },
      {
        heading: "Score each page on five axes",
        body: ["Rate every page (a simple 0–2 is fine) on the things that decide citation:"],
        bullets: [
          "Answer clarity: is there a direct, self-contained answer near the top?",
          "Structure: descriptive headings, short paragraphs, lists/tables, an FAQ block?",
          "Evidence: specific, verifiable, sourced claims — no fabricated stats?",
          "Freshness: is time-sensitive information current?",
          "Intent match: does it answer the exact question users ask, or just touch the topic?",
        ],
      },
      {
        heading: "Turn scores into four actions",
        body: ["Every page lands in one bucket:"],
        bullets: [
          "Fix: good topic and authority, weak execution — add the answer-first lead, structure, schema.",
          "Refresh: solid page that's gone stale — update facts, dates, and examples.",
          "Consolidate: several thin or overlapping pages — merge into one strong page and redirect.",
          "Retire: low-value, off-strategy, or unsalvageable — remove or noindex to stop diluting authority.",
        ],
      },
      {
        heading: "Prioritize and re-audit",
        body: [
          "Sequence the work by impact: pages close to being cited (high authority, weak execution) first, then high-intent commercial pages, then the cleanup. Don't try to fix everything at once. And put a re-audit on the calendar — quarterly for most libraries — because freshness decays and engines change what they reward. An audit is a habit, not a project. Pair it with citation tracking so you can see the audit move the needle.",
        ],
      },
    ],
    faqs: [
      { q: "How is this different from auditing my AI visibility?", a: "Visibility auditing looks outward — which engines cite you and for what. A content audit looks inward — scoring your pages for citation-readiness. They're complementary: visibility tells you the gaps, the content audit tells you which pages to fix to close them." },
      { q: "How often should I run a content audit?", a: "Quarterly is a good default for an active library; at minimum, twice a year. Time-sensitive content (pricing, 'best of 2026', regulatory) needs more frequent freshness checks." },
      { q: "Will consolidating pages hurt my rankings?", a: "Done right — merging thin/overlapping pages into one strong page and 301-redirecting the old URLs — it usually helps, because you concentrate authority and stop competing with yourself. Map redirects carefully so you don't lose equity." },
      { q: "Do I need a tool to run a GEO content audit?", a: "No to start — a spreadsheet with one row per page and the five-axis score works. Tools help at scale (crawling, citation tracking, surfacing decay), but the judgment is the valuable part." },
    ],
    related: [
      { label: "Content refresh strategy", href: "/resources/content-refresh-strategy" },
      { label: "How to audit your AI visibility", href: "/resources/how-to-audit-your-ai-visibility" },
      { label: "How to track AI citations", href: "/resources/how-to-track-ai-citations" },
    ],
  },

  "repurposing-content-for-ai-search": {
    slug: "repurposing-content-for-ai-search",
    metaTitle: "Repurposing Existing Content for AI Search | Citensity",
    metaDescription:
      "You don't always need new content to win AI citations. Here's how to repurpose webinars, docs, sales calls, and old posts into answer-first, citable pages — without creating thin duplicates.",
    updated: "2026-06-30",
    readMins: 6,
    answer:
      "Repurposing content for AI search means turning assets you already have — webinars, documentation, sales and support conversations, research, old blog posts — into answer-first pages that AI engines can cite. The knowledge is already there; the work is reshaping it into self-contained, well-structured answers to the specific questions people ask, without producing thin duplicates of what already exists.",
    takeaways: [
      "Your best citable answers often already exist as talks, docs, and calls — they just aren't in citable form.",
      "Sales and support conversations are the richest source of real questions to answer.",
      "Reshape, don't republish: extract the answer, restructure it, add evidence — don't paste a transcript.",
      "One rich source can seed several focused pages, each answering one distinct question.",
      "Avoid thin duplicates — repurposing must add a clearer, more complete answer than what's already indexed.",
    ],
    sections: [
      {
        heading: "Why repurposing is high-leverage for GEO",
        body: [
          "Most organizations are sitting on far more citable knowledge than they've published. Your experts answer the same questions on sales calls every week; your docs explain how things work; a webinar walked through a process end-to-end. AI engines can't cite a Zoom recording or a Slack thread — but they can cite a clean page that captures the same answer. Repurposing converts trapped expertise into a citable asset, usually faster than writing from scratch.",
        ],
      },
      {
        heading: "Where the best raw material lives",
        body: ["Mine the places where real questions get real answers:"],
        bullets: [
          "Sales and support conversations: the exact questions buyers ask, in their words — the gold standard for intent.",
          "Webinars and talks: a subject expert already structured an explanation; transcribe and reshape it.",
          "Product docs and help center: precise, factual answers that often just need an answer-first lead.",
          "Original research and internal data: proprietary numbers that are uniquely citable because no one else can corroborate them.",
          "High-authority old posts that rank but don't get cited — prime candidates to re-optimize.",
        ],
      },
      {
        heading: "Reshape, don't republish",
        body: [
          "The mistake is pasting a transcript or a doc verbatim. That produces a wall of text with the answer buried — exactly what doesn't get cited, and at worst a near-duplicate of something already indexed. Instead, extract the answer, then rebuild the page answer-first: a self-contained claim up top, descriptive headings, short paragraphs, a table or list where it helps, and an FAQ. Add the evidence and sources the spoken version assumed. The output should be a clearer, more complete answer than anything currently in the index.",
        ],
      },
      {
        heading: "One source, several pages",
        body: [
          "A rich source usually contains answers to several distinct questions. A 40-minute webinar might cover 'what is X', 'how do I do X', and 'X vs Y' — each a separate query with separate intent. Split it into focused pages, one per question, rather than one sprawling recap. Focused pages match exact intent (which wins citations) and let you link them into a cluster that builds topical authority.",
        ],
      },
      {
        heading: "Guardrails so repurposing doesn't create thin pages",
        body: [
          "Repurposing only works if each page genuinely earns its place. Before publishing, check: does this answer a distinct question, is it more complete than what's already indexed, and is every claim verifiable? If a repurposed page is just a thinner restatement of an existing one, consolidate instead of adding it. Quality, not volume, is what keeps the library citable.",
        ],
      },
    ],
    faqs: [
      { q: "Is repurposing content bad for SEO/duplicate content?", a: "Only if you republish verbatim or create thin near-duplicates. Reshaping a source into a genuinely clearer, more complete answer to a specific question is not duplicate content — it's new value built on existing knowledge." },
      { q: "What's the single best source to repurpose first?", a: "Sales and support conversations. They give you the exact questions buyers ask in their own words, plus your experts' best answers — the highest-intent, most citable material you have." },
      { q: "Can I repurpose competitors' content?", a: "No — repurpose your own knowledge and data. Copying competitors produces derivative pages with no unique, corroboration-worthy value, and AI engines route around claims that only restate what's already everywhere." },
      { q: "How do I repurpose without an in-house expert's time?", a: "Capture the expert once — a recorded 20-minute Q&A or an annotated sales call — then do the reshaping yourself. The expensive part is the expertise; the reshaping is execution you can own." },
    ],
    related: [
      { label: "Statistics and original data for GEO", href: "/resources/statistics-and-original-data-for-geo" },
      { label: "How to make your content quotable", href: "/resources/how-to-make-content-quotable" },
      { label: "Content clusters and pillar pages", href: "/resources/content-clusters-and-pillar-pages" },
    ],
  },

  "competitive-geo-analysis": {
    slug: "competitive-geo-analysis",
    metaTitle: "Competitive GEO Analysis: Why Rivals Get Cited | Citensity",
    metaDescription:
      "A competitive GEO analysis reverse-engineers why other brands get cited by AI engines for your target questions — so you can find the gaps you can win and the moats you'll have to out-answer.",
    updated: "2026-06-30",
    readMins: 7,
    answer:
      "A competitive GEO analysis is the practice of asking AI engines your target questions, recording which sources they cite, and reverse-engineering why — what makes those passages citable and where the gaps are. Unlike classic competitor SEO (which compares rankings and backlinks), GEO analysis compares share of voice inside AI answers and the citation-worthiness of specific passages, so you learn exactly what you need to out-answer.",
    takeaways: [
      "Run your target questions through the engines and log who gets cited — that's your real competitive set.",
      "Your GEO competitors aren't always your business competitors — anyone cited for your questions counts.",
      "Analyze the cited passage, not just the domain: what made that specific answer liftable?",
      "Find gap questions — high-intent queries where no one is well-cited yet — and own them first.",
      "Track share of voice over time; citation share shifts faster than rankings do.",
    ],
    sections: [
      {
        heading: "How GEO competitive analysis differs from SEO",
        body: [
          "Classic competitor analysis compares ranking positions, keywords, and backlink profiles. GEO analysis compares something different: share of voice inside AI answers — how often each brand is named when an engine answers your target questions. Two consequences follow. First, your competitive set changes: anyone the engine cites for your questions is a GEO competitor, even a publisher, forum, or adjacent brand you'd never track in SEO. Second, the unit of analysis is the passage, not the page — you're studying why one specific answer got lifted.",
        ],
      },
      {
        heading: "Step 1 — Build your question set and run it",
        body: [
          "Start from the prioritized questions your buyers ask (from your research and sales calls). Run each one through the engines you care about — ChatGPT, Perplexity, Google AI Overviews, Gemini — and record, for each, which sources are cited and in what order. Re-run periodically; answers vary and drift. This citation log is the dataset everything else is built on.",
        ],
      },
      {
        heading: "Step 2 — Identify your real GEO competitors",
        body: [
          "Tally who gets cited across your question set. The brands and sites that show up most often are your GEO competitors for that topic — regardless of whether they compete with you commercially. You'll often find a few unexpected names (a category publication, a community site, a tangential tool) that dominate citations. Knowing them tells you who you're actually out-answering.",
        ],
      },
      {
        heading: "Step 3 — Reverse-engineer the cited passages",
        body: [
          "For the questions where a competitor wins, study the exact passage the engine cited and ask why it was citable.",
        ],
        bullets: [
          "Directness: did it answer the literal question more cleanly than your page?",
          "Self-containment: was the claim liftable without surrounding context?",
          "Evidence: did it have specific, sourced data you lack?",
          "Corroboration: is it widely echoed elsewhere, making it a safe cite?",
          "Structure & freshness: better headings, a useful table, or a more recent update?",
        ],
      },
      {
        heading: "Step 4 — Find the gaps and the moats",
        body: [
          "Two kinds of opportunity fall out of the analysis. Gaps are high-intent questions where no source is well-cited yet — the engine gives a weak or generic answer. Those are the fastest wins: publish a genuinely better answer and you can own the citation quickly. Moats are questions where a competitor is deeply entrenched (strong passage, heavy corroboration). Those take a sustained, clearly-better answer to dislodge — pick them deliberately, not by default. Sequence gaps first.",
        ],
      },
      {
        heading: "Step 5 — Track share of voice over time",
        body: [
          "Citation share moves faster than rankings — a refreshed competitor page or a model update can shift who gets cited within weeks. Re-run your question set on a cadence and track your share of voice per topic so you can see wins land and catch erosion early. The analysis isn't a one-time report; it's a monitoring loop that feeds your content roadmap.",
        ],
      },
    ],
    faqs: [
      { q: "How do I measure share of voice in AI answers?", a: "Run a fixed set of target questions through each engine on a schedule, and track how often your brand is cited versus competitors across that set. The percentage of your questions where you're cited (and how prominently) is your share of voice." },
      { q: "Why do publishers and forums show up as my competitors?", a: "AI engines cite whatever passage best answers the question, regardless of business model. Category publications and community sites often have broad, well-corroborated answers — so they win citations even though they don't sell what you sell. Treat them as GEO competitors to out-answer." },
      { q: "How often should I re-run a competitive GEO analysis?", a: "Monthly for active topics; quarterly at minimum. Citation share shifts faster than rankings because answers regenerate and competitors refresh — a stale analysis misses both your wins and new erosion." },
      { q: "Can I automate the citation logging?", a: "Partially — citation-monitoring tools can run question sets and record sources at scale. But interpreting why a passage was citable still needs human judgment, which is where the real competitive insight comes from." },
    ],
    related: [
      { label: "How AI engines choose sources", href: "/resources/how-ai-engines-choose-sources" },
      { label: "AI share of voice", href: "/resources/ai-share-of-voice" },
      { label: "How to set up AI citation monitoring", href: "/resources/how-to-set-up-ai-citation-monitoring" },
    ],
  },
};
