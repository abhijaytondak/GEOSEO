import type { Article } from "@/components/resources/content-types";
export const BATCH_ENGINES: Record<string, Article> = {
  "how-to-rank-in-perplexity": {
    slug: "how-to-rank-in-perplexity",
    metaTitle: "How to Rank in Perplexity | Citensity",
    metaDescription:
      "To rank in Perplexity, be crawlable, answer the question directly near the top, and earn corroboration from sources Perplexity already trusts.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "To rank in Perplexity, you need to be one of the sources its real-time retrieval pulls and its model decides to cite. That means being crawlable by PerplexityBot, publishing a direct answer to the exact question high on the page, and backing every claim with evidence other trusted sources corroborate. Perplexity favors recent, specific, well-attributed pages over broad, padded ones.",
    takeaways: [
      "Perplexity retrieves live sources per query, then cites a handful inline - your job is to be retrieved and chosen.",
      "Allow PerplexityBot in robots.txt; if it cannot crawl you, you cannot be cited.",
      "Lead with a direct, self-contained answer to the specific question, not a throat-clearing intro.",
      "Specificity and freshness win: concrete numbers, dates, and named details get pulled over vague prose.",
      "Corroboration matters - Perplexity leans toward claims it can verify across multiple independent sources.",
    ],
    sections: [
      {
        heading: "How Perplexity decides what to cite",
        body: [
          "Perplexity is a retrieval-augmented answer engine. For each question it runs a live search, gathers candidate pages, and a language model synthesizes an answer that cites the sources it leaned on with numbered inline references. Unlike classic search, the prize is not a ranking slot you hope users click; it is being named in the answer the user actually reads.",
          "Two gates decide your fate. First, retrieval: your page has to surface among the candidates Perplexity gathers for that query, which depends on relevance, freshness, and authority. Second, selection: the model has to choose your passage as the best-supported, most directly-on-point source to quote. You optimize for both, not just the first.",
        ],
      },
      {
        heading: "Be retrievable first",
        body: [
          "None of the writing matters if the engine cannot fetch your page. Perplexity uses its own crawler, PerplexityBot, alongside live web retrieval. Confirm your robots.txt allows it, that pages return clean HTML without requiring JavaScript to render the core content, and that your important answers are not buried behind interstitials or login walls.",
        ],
        bullets: [
          "Allow PerplexityBot (and do not accidentally block it with a broad disallow rule).",
          "Serve the substantive answer in server-rendered HTML, not only via client-side JS.",
          "Keep pages fast and reachable - timeouts and errors drop you from the candidate set.",
          "Use clean, descriptive URLs and a current sitemap so new pages get discovered quickly.",
        ],
      },
      {
        heading: "Write the way Perplexity quotes",
        body: [
          "Perplexity rewards passages it can lift and attribute with confidence. Put a direct, self-contained answer to the precise question in the first paragraph under a heading that matches how people ask it. Then support that answer with specifics: concrete figures, dates, named methods, and clear cause-and-effect. Vague, hedged writing gives the model nothing crisp to cite.",
          "Freshness is a real signal here. Perplexity skews toward recent material for anything time-sensitive, so keep an honest 'updated' date and refresh facts when they change. Structure helps too: short paragraphs, descriptive H2s phrased as questions, and tight lists make your passages easy to extract cleanly.",
        ],
      },
      {
        heading: "Earn corroboration and authority",
        body: [
          "An engine is more comfortable citing a claim it can verify elsewhere. Pages whose facts are echoed by other independent, reputable sources are safer to quote, so build genuine authority on your topic rather than making isolated assertions. Be the source others reference, cite your own evidence transparently, and keep your entity (brand, author, organization) described consistently across the web so the engine trusts who is speaking.",
        ],
      },
    ],
    faqs: [
      { q: "Does Perplexity use Google rankings?", a: "Not directly. It runs its own retrieval and citation, though strong classic authority and relevance signals tend to make you a likelier candidate. Treat ranking well and being citable as overlapping, not identical, goals." },
      { q: "How do I check if Perplexity can crawl my site?", a: "Look for PerplexityBot in your server logs and confirm robots.txt does not disallow it. If the bot is not hitting your pages, fix crawlability before anything else." },
      { q: "Why does Perplexity cite a competitor but not me?", a: "Usually one of three reasons: they answer the specific question more directly, their claim is better corroborated, or their page is fresher. Compare your top passage to theirs against the exact query." },
    ],
    related: [
      { label: "What kind of content Perplexity cites most", href: "/resources/what-content-perplexity-cites" },
      { label: "How to write answer-shaped content", href: "/resources/answer-shaped-content" },
      { label: "Analytics - track which engines cite you", href: "/platform/analytics" },
    ],
  },

  "how-to-appear-in-google-ai-overviews": {
    slug: "how-to-appear-in-google-ai-overviews",
    metaTitle: "How to Appear in Google AI Overviews | Citensity",
    metaDescription:
      "To appear in Google AI Overviews, earn strong organic relevance, answer the query directly in extractable passages, and demonstrate real expertise and trust.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "To appear in Google AI Overviews, you generally have to be a strong, relevant result Google already trusts for the query, with a passage that answers the specific question directly and is easy to extract. Overviews are drawn from Google's existing index, so classic SEO fundamentals plus answer-first structure and clear E-E-A-T are what get you pulled into the synthesized answer.",
    takeaways: [
      "AI Overviews are built from Google's index, so ranking well for the query is the foundation.",
      "Google lifts specific, self-contained passages - answer the exact question in a clean block of text.",
      "There is no separate 'Overviews schema'; sound technical SEO and structured data still apply.",
      "E-E-A-T signals (real experience, expertise, authority, trust) shape which sources Google is willing to surface.",
      "Match the question's intent precisely; Overviews often appear on informational and how-to queries.",
    ],
    sections: [
      {
        heading: "What AI Overviews actually are",
        body: [
          "AI Overviews are Google's generative summaries that appear above or among traditional results for many queries. Google retrieves relevant pages from its existing index, then uses a model to compose a short answer with links to the sources it drew from. Because the underlying material is Google's index, the path to being included runs through the same systems that decide classic rankings - not a separate parallel channel.",
          "Practically, that is good news: the work you do to rank and earn featured snippets overlaps heavily with the work to be cited in an Overview. You are not learning a brand-new game; you are sharpening the one you already play, with extra attention to extractable answers and trust.",
        ],
      },
      {
        heading: "Be a strong, relevant result first",
        body: [
          "If your page does not surface in Google's results for a query, it is unlikely to feed the Overview for that query. So the non-negotiable foundation is classic relevance and quality: cover the topic thoroughly, satisfy the query's intent, keep the page technically healthy and fast, and earn legitimate authority. Overviews tend to draw from sources Google already considers credible and on-topic.",
        ],
        bullets: [
          "Target the actual question users ask, not a loosely related keyword.",
          "Ensure pages are crawlable, indexable, and free of rendering issues.",
          "Cover the topic comprehensively so you are relevant across related sub-questions.",
          "Keep technical SEO solid: clean HTML, fast load, valid structured data where it fits.",
        ],
      },
      {
        heading: "Write passages Google can lift",
        body: [
          "Overviews favor passages that resolve a specific question cleanly. Put the direct answer in a short, self-contained paragraph immediately under a heading that mirrors the question. Avoid burying the answer beneath setup. Use lists and steps for procedural queries, because step-shaped content maps neatly into the way Overviews summarize how-to answers.",
          "Think in extractable units: each section should answer one question well enough that it could stand alone if quoted. That same discipline tends to win featured snippets, which historically correlate with the kinds of passages generative summaries surface.",
        ],
      },
      {
        heading: "Demonstrate experience and trust",
        body: [
          "Google's quality systems weigh experience, expertise, authoritativeness, and trust. For Overviews, that means showing real first-hand knowledge, naming credible authors, citing evidence, and keeping information accurate and current. Topics where bad advice can cause harm are held to a higher bar, so demonstrable expertise and transparent sourcing materially affect whether Google is comfortable surfacing you.",
        ],
      },
    ],
    faqs: [
      { q: "Is there special markup to get into AI Overviews?", a: "No dedicated 'Overviews' markup exists. Standard structured data (FAQ, HowTo, Article where appropriate) and clean semantic HTML help Google understand your content, but the core drivers are relevance, extractable answers, and trust." },
      { q: "Can I opt out of being used in AI Overviews?", a: "Google offers crawler and preview controls, but using them to block content can also reduce normal search visibility. Most sites are better served optimizing to be cited well rather than opting out." },
      { q: "Do Overviews reduce my clicks?", a: "They can, for queries fully answered in place. The counter-move is to be the cited source and to win the deeper, intent-rich queries where users still need your page." },
    ],
    related: [
      { label: "How to structure content so AI cites it", href: "/resources/content-structure-for-ai-citations" },
      { label: "E-E-A-T for AI search: signals that earn citations", href: "/resources/eeat-for-ai-search" },
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
    ],
  },

  "how-to-rank-in-gemini": {
    slug: "how-to-rank-in-gemini",
    metaTitle: "How to Get Cited in Google Gemini | Citensity",
    metaDescription:
      "To get cited in Gemini, be crawlable by Google, rank well for the query, answer it directly in extractable passages, and earn cross-source corroboration.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "To get cited in Google Gemini, your content needs to be discoverable through Google's grounding sources, directly relevant to the question, and structured so a passage can be lifted and attributed cleanly. Gemini grounds many answers in Google Search, so the fundamentals that earn organic relevance and AI Overview inclusion are the same ones that get you cited here.",
    takeaways: [
      "Gemini often grounds answers in Google Search results, so classic relevance and crawlability are the base.",
      "Answer the specific question in a clear, self-contained passage near the top of the page.",
      "Allow Google's crawlers, including Google-Extended, so your content can be used for grounding.",
      "Corroborated, specific claims are safer for the model to cite than isolated assertions.",
      "Consistent entity information helps Gemini understand and trust who is speaking.",
    ],
    sections: [
      {
        heading: "How Gemini sources its answers",
        body: [
          "Gemini is a general-purpose assistant that, for many factual or current questions, grounds its responses in retrieved web content - frequently via Google Search. When it grounds an answer, it can surface the sources behind it. That means citation in Gemini overlaps heavily with being a strong, relevant, trustworthy result in Google's broader ecosystem rather than a separate optimization channel.",
          "The implication is practical: invest in being genuinely retrievable and authoritative for your topics, and you become eligible across Google's surfaces - organic results, AI Overviews, and Gemini grounding alike. There is no secret Gemini-only lever; there is doing the fundamentals well and making your answers easy to extract and attribute.",
        ],
      },
      {
        heading: "Make sure you are eligible to be grounded",
        body: [
          "Grounding can only use content the system can access and is permitted to use. Keep your pages crawlable and indexable, serve real content in HTML, and be deliberate about crawler controls. Google-Extended is the control that governs whether your content may be used to improve and ground Google's generative models; if you want to be eligible for citation, do not block it.",
        ],
        bullets: [
          "Allow Googlebot for indexing and Google-Extended for generative grounding.",
          "Render the core answer server-side so it does not depend on client JavaScript.",
          "Keep a current sitemap and fix crawl errors so new content is discovered fast.",
          "Avoid walling your best answers behind logins or aggressive interstitials.",
        ],
      },
      {
        heading: "Structure for extraction",
        body: [
          "When Gemini composes a grounded answer, it favors passages that resolve the question directly. Lead each section with the answer, phrase headings the way users ask, and keep paragraphs tight. For procedural questions, use ordered steps; for comparisons, use clear contrasts. The goal is that any single passage could be quoted and stand on its own as an accurate answer.",
          "This is the same answer-first discipline that wins featured snippets and AI Overviews, which is why a page built well for one tends to perform across all of them.",
        ],
      },
      {
        heading: "Build the trust that earns the cite",
        body: [
          "Models prefer to attribute claims they can verify. Support your statements with evidence, link to primary sources where relevant, and keep facts current and accurate. Maintain a consistent entity footprint - the same brand name, author identities, and core descriptions across your site and the wider web - so the system can confidently associate the answer with a credible source. Corroboration across independent reputable sources makes your claims safer to cite.",
        ],
      },
    ],
    faqs: [
      { q: "Is ranking in Gemini different from ranking in Google?", a: "They are tightly linked. Gemini frequently grounds answers in Google Search, so the relevance, quality, and trust signals that help you in Google generally help you be cited in Gemini." },
      { q: "Should I block Google-Extended?", a: "Only if you have a specific reason not to be used for generative grounding. Blocking it removes you from Gemini citation eligibility while not improving normal rankings, so most sites should leave it allowed." },
      { q: "Does structured data help with Gemini?", a: "Indirectly. Schema helps Google understand your content and entities, which supports relevance and grounding. It is a supporting signal, not a guaranteed citation trigger." },
    ],
    related: [
      { label: "How to appear in Google AI Overviews", href: "/resources/how-to-appear-in-google-ai-overviews" },
      { label: "GPTBot and AI crawlers: what to allow and why", href: "/resources/gptbot-and-ai-crawlers" },
      { label: "AI Feed - your machine-readable surface", href: "/platform/ai-feed" },
    ],
  },

  "how-to-rank-in-copilot": {
    slug: "how-to-rank-in-copilot",
    metaTitle: "How to Appear in Microsoft Copilot Answers | Citensity",
    metaDescription:
      "To appear in Microsoft Copilot answers, be visible in Bing, answer the query directly, and earn the authority and freshness Copilot draws on when citing sources.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "To appear in Microsoft Copilot answers, your content needs to be discoverable and trusted through Bing, since Copilot grounds many of its web answers in Bing's index and cites the sources it uses. Be crawlable by Bingbot, rank well for the query, answer the specific question in extractable passages, and keep your content fresh and authoritative.",
    takeaways: [
      "Copilot grounds web answers in Bing, so Bing visibility is the foundation for being cited.",
      "Confirm Bingbot can crawl you and your pages are indexed and free of rendering issues.",
      "Answer the exact question directly and early so Copilot can lift a clean passage.",
      "Freshness and authority matter - Copilot favors current, credible sources for live questions.",
      "Use Bing Webmaster Tools to verify indexing and diagnose why you are or are not surfaced.",
    ],
    sections: [
      {
        heading: "How Copilot finds and cites sources",
        body: [
          "Microsoft Copilot is an assistant that, for many web and current-events questions, retrieves and grounds its answers in Bing's index, then cites the sources it relied on. So the practical route to being cited in Copilot runs through Bing: if Bing finds, indexes, and ranks you well for a query, you become a candidate for Copilot to quote.",
          "This makes Bing visibility a strategic lever that is often under-invested. Many teams optimize almost exclusively for Google and neglect Bing, leaving Copilot citations on the table. Treating Bing as a first-class surface - not an afterthought - is one of the higher-leverage moves for Copilot presence.",
        ],
      },
      {
        heading: "Get the Bing fundamentals right",
        body: [
          "Start by confirming you are actually in Bing's index and crawlable by Bingbot. Bing Webmaster Tools is the direct way to verify indexing, submit sitemaps, and see how Bing perceives your pages. Bing weighs clean technical health, clear on-page relevance, and credible inbound signals, much like other engines, so the standard quality work pays off here too.",
        ],
        bullets: [
          "Allow Bingbot in robots.txt and verify the site in Bing Webmaster Tools.",
          "Submit and maintain a current sitemap; fix crawl and indexing errors promptly.",
          "Serve core content in HTML so it does not depend on client-side rendering.",
          "Cover the query intent thoroughly and keep pages technically healthy and fast.",
        ],
      },
      {
        heading: "Write answers Copilot can quote",
        body: [
          "Copilot, like other answer engines, favors content that resolves the specific question directly. Lead with the answer, use headings that mirror real questions, and keep passages self-contained. For tasks and procedures, structured steps map cleanly into the way Copilot composes how-to responses. Make each section quotable in isolation and you make yourself easy to cite.",
          "Because Copilot often handles current questions, freshness is meaningful. Keep an honest update cadence on time-sensitive pages, and ensure the facts a model would lift are accurate and dated where relevant.",
        ],
      },
      {
        heading: "Earn authority and trust",
        body: [
          "As with every engine, Copilot is more comfortable citing sources that appear credible and corroborated. Build genuine topical authority, attribute claims to evidence, identify your authors and organization clearly, and keep your entity information consistent across the web. Authority is not a one-time task; it is the accumulated trust that makes a model choose you over an equally relevant but less established page.",
        ],
      },
    ],
    faqs: [
      { q: "Do I need a separate strategy for Copilot and ChatGPT?", a: "The fundamentals overlap, but the grounding sources differ. Copilot leans on Bing, while ChatGPT Search uses its own retrieval. Make sure you are strong in Bing for Copilot specifically, since that is the common gap." },
      { q: "How do I check if Copilot can see my content?", a: "Verify your site in Bing Webmaster Tools and confirm the relevant pages are indexed and ranking for your target questions. If they are not in Bing, Copilot is unlikely to cite them." },
      { q: "Does Bing ranking guarantee a Copilot citation?", a: "No. Ranking makes you eligible, but Copilot still selects the passage that answers the question best and most credibly. Strong Bing presence plus answer-first writing is the combination." },
    ],
    related: [
      { label: "How to rank in ChatGPT", href: "/resources/how-to-rank-in-chatgpt" },
      { label: "ChatGPT Search optimization: a practical guide", href: "/resources/chatgpt-search-optimization" },
      { label: "How to track AI citations", href: "/resources/how-to-track-ai-citations" },
    ],
  },

  "how-to-get-cited-by-claude": {
    slug: "how-to-get-cited-by-claude",
    metaTitle: "How to Get Cited by Claude | Citensity",
    metaDescription:
      "To get cited by Claude, be crawlable, publish clear and well-sourced answers, and earn the corroborated authority Claude relies on when it grounds responses in the web.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "To get cited by Claude, your content needs to be accessible to its web retrieval, clearly written, and well-sourced enough that the model is comfortable attributing a claim to you. When Claude answers with web search, it grounds responses in retrieved pages and can cite them - so be crawlable, answer directly, and back claims with verifiable evidence.",
    takeaways: [
      "Claude can ground answers in live web search and cite the sources it uses.",
      "Be crawlable: allow Anthropic's crawler so your pages are eligible to be retrieved.",
      "Clear, well-organized writing helps the model extract and attribute your answer accurately.",
      "Verifiable, corroborated claims are far more likely to be cited than unsupported assertions.",
      "Consistent entity and authorship signals help the model trust who is speaking.",
    ],
    sections: [
      {
        heading: "How Claude uses web sources",
        body: [
          "Claude is a general assistant that, when web search is enabled, retrieves relevant pages to ground its answers and can cite them. As with other retrieval-augmented engines, two things determine whether you are cited: whether your page is retrieved as a relevant candidate, and whether the model selects your content as the clearest, best-supported source for the point it is making.",
          "There is no proprietary 'Claude ranking algorithm' you can game. The reliable approach is the same one that earns citations everywhere: be genuinely useful, easy to retrieve, clearly written, and well-evidenced, so that an answer engine can confidently attribute a claim to you.",
        ],
      },
      {
        heading: "Be retrievable and allowed",
        body: [
          "If Claude's retrieval cannot reach your content, it cannot cite it. Anthropic operates web crawlers (such as ClaudeBot), and you control access through robots.txt. To be eligible for citation, allow the relevant crawler, serve real content in HTML, and keep pages fast and reachable. Blocking the crawler removes you from consideration entirely.",
        ],
        bullets: [
          "Allow Anthropic's crawler (e.g. ClaudeBot) rather than blanket-disallowing unknown bots.",
          "Serve the substantive answer server-side, not only via client-side JavaScript.",
          "Keep pages reachable and fast; errors and timeouts drop you from retrieval.",
          "Use a current sitemap and clean URLs so content is discoverable.",
        ],
      },
      {
        heading: "Write so the answer is easy to extract",
        body: [
          "Claude tends to attribute claims to sources that state them clearly and support them. Lead with a direct answer to the specific question, organize the page logically with descriptive headings, and keep claims concrete. Ambiguity and padding make it harder for the model to map a clean statement back to your page, which reduces the chance of a clean citation.",
          "Well-structured, scannable content also reduces the risk of being misquoted, because the model has a precise passage to lean on rather than reconstructing your point from scattered prose.",
        ],
      },
      {
        heading: "Earn trust through evidence and consistency",
        body: [
          "Citation is fundamentally a trust decision. Support claims with evidence and primary sources, be transparent about who authored the content and on what basis, and keep your facts accurate and current. Maintain consistent entity information across the web so the model can reliably identify your brand and authors. Claims that are corroborated by other independent, reputable sources are the safest for any model to cite - including Claude.",
        ],
      },
    ],
    faqs: [
      { q: "Does Claude have its own search index?", a: "Claude grounds web answers via retrieval when search is enabled rather than maintaining a public ranking index you optimize directly. You influence citation by being retrievable, clear, and well-sourced." },
      { q: "How do I let Claude crawl my site?", a: "Allow Anthropic's crawler in robots.txt rather than blocking all non-mainstream bots. Check your logs to confirm it is reaching your pages." },
      { q: "Why would Claude cite a source over mine?", a: "Typically because the other source answers the question more directly, supports the claim with clearer evidence, or is better corroborated. Tighten your answer and sourcing for the specific query." },
    ],
    related: [
      { label: "GPTBot and AI crawlers: what to allow and why", href: "/resources/gptbot-and-ai-crawlers" },
      { label: "E-E-A-T for AI search: signals that earn citations", href: "/resources/eeat-for-ai-search" },
      { label: "Content Authority - be the source AI trusts", href: "/platform/content-authority" },
    ],
  },

  "chatgpt-search-optimization": {
    slug: "chatgpt-search-optimization",
    metaTitle: "ChatGPT Search Optimization: A Practical Guide | Citensity",
    metaDescription:
      "ChatGPT Search optimization means being crawlable by OpenAI's bots, answering questions directly, and earning the authority and freshness that make ChatGPT cite you.",
    updated: "2026-06-25",
    readMins: 7,
    answer:
      "ChatGPT Search optimization is the practice of making your content eligible to be retrieved and cited when ChatGPT answers a question using live web search. The essentials are: allow OpenAI's crawlers, publish a direct answer to the specific question, structure pages for clean extraction, keep content fresh, and earn the corroborated authority that makes ChatGPT confident enough to name you.",
    takeaways: [
      "ChatGPT Search retrieves live web sources and cites a few, so being retrieved and selected is the goal.",
      "Allow OAI-SearchBot (and decide intentionally about GPTBot) so your pages are eligible.",
      "Lead every page with a direct, self-contained answer to the exact question.",
      "Freshness counts for current topics; keep an honest update cadence and dated facts.",
      "Corroborated, authoritative content is far more likely to be cited than isolated claims.",
    ],
    sections: [
      {
        heading: "How ChatGPT Search picks sources",
        body: [
          "When ChatGPT answers with search, it retrieves relevant web pages, synthesizes an answer, and cites the sources it leaned on with links. The user reads a composed answer and a short list of citations - there is no ten-blue-links page to climb. Your objective is to be one of the cited sources, which depends first on being retrieved as a relevant candidate and then on being selected as the clearest, best-supported answer to that specific question.",
          "It is worth separating two different OpenAI bots. OAI-SearchBot is associated with surfacing content in ChatGPT Search results and citations. GPTBot is associated with crawling for model training. They serve different purposes, and you can allow or disallow them independently in robots.txt depending on whether you want to be citable in search, used in training, or both.",
        ],
      },
      {
        heading: "Make your pages eligible",
        body: [
          "Eligibility is the precondition for everything else. Confirm that OpenAI's search crawler can reach and render your important pages, that the core answer exists in server-rendered HTML, and that nothing critical hides behind JavaScript, logins, or interstitials. Then verify the basics that any retrieval system needs: reachable URLs, fast responses, a current sitemap, and clean canonical signals.",
        ],
        bullets: [
          "Allow OAI-SearchBot so your content can appear in ChatGPT Search citations.",
          "Decide deliberately on GPTBot (training); allowing it does not affect search citation directly.",
          "Render the substantive answer server-side, not only via client JavaScript.",
          "Keep pages fast and reachable; drop nothing important behind a wall.",
        ],
      },
      {
        heading: "Write for extraction and accuracy",
        body: [
          "ChatGPT favors passages it can lift and attribute cleanly. Put a direct, self-contained answer in the first paragraph under a heading phrased like the question. Support it with specifics - concrete figures, named methods, dates - because precise claims are easier to cite than vague ones. Use lists for steps and comparisons so structured answers map neatly into the response.",
          "Accuracy is part of optimization here, not separate from it. A model that detects internal contradictions or stale facts is less likely to trust and reuse your page. Keep claims current, mark genuine update dates, and make sure your strongest, most quotable sentence is also your most accurate one.",
        ],
      },
      {
        heading: "Build authority and a machine-readable surface",
        body: [
          "Citation is a trust decision, so the durable work is earning authority: be the source others reference, support claims with evidence, identify your authors and organization, and keep your entity described consistently across the web. Corroboration across independent reputable sources makes your claims safer to cite.",
          "A clean machine-readable surface compounds this. Valid structured data helps engines understand your entities and content, and a concise llms.txt can point AI systems to your most important, canonical resources. These are supporting signals, not magic switches - they make it easier for ChatGPT to understand and trust what you have already written well.",
        ],
      },
    ],
    faqs: [
      { q: "Is ChatGPT Search the same as Bing or Google?", a: "No. ChatGPT Search uses OpenAI's own retrieval and citation rather than simply mirroring another engine's rankings. The fundamentals overlap with classic SEO, but you should treat eligibility (crawler access) and citation selection as their own goals." },
      { q: "Should I block GPTBot?", a: "That is a content-strategy decision. GPTBot relates to model training, not search citation, so blocking it does not directly affect whether ChatGPT Search cites you. Allow OAI-SearchBot if you want to be citable in search." },
      { q: "How do I know if ChatGPT is citing me?", a: "Track a fixed set of representative questions over time and note whether you are named, and watch your logs for OpenAI bot activity. Consistent monitoring beats one-off spot checks." },
      { q: "Does freshness really matter?", a: "For time-sensitive and current topics, yes - ChatGPT skews toward recent sources. For evergreen topics it matters less, but an honest, current update date never hurts." },
    ],
    related: [
      { label: "How to rank in ChatGPT", href: "/resources/how-to-rank-in-chatgpt" },
      { label: "GPTBot and AI crawlers: what to allow and why", href: "/resources/gptbot-and-ai-crawlers" },
      { label: "How to track AI citations", href: "/resources/how-to-track-ai-citations" },
    ],
  },

  "what-content-perplexity-cites": {
    slug: "what-content-perplexity-cites",
    metaTitle: "What Content Perplexity Cites Most | Citensity",
    metaDescription:
      "Perplexity cites specific, fresh, well-attributed content that answers the exact question directly. Here are the content traits that earn citations most often.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "Perplexity most often cites content that answers the specific question directly, supports its claims with concrete and verifiable detail, is reasonably fresh, and comes from a source it can trust. In practice that favors focused answer pages, original data, clear how-to and comparison content, and primary sources over broad, padded, or purely promotional pages.",
    takeaways: [
      "Direct answers to the exact question outperform broad overviews that bury the point.",
      "Specific, verifiable detail (numbers, dates, named methods) gets pulled over vague prose.",
      "Freshness helps, especially for current or fast-moving topics.",
      "Primary sources and original data are attractive because they are corroborable and unique.",
      "Clean structure and clear authorship make a page easier and safer to cite.",
    ],
    sections: [
      {
        heading: "Content that answers the exact question",
        body: [
          "Perplexity composes an answer to a specific question and cites the sources that best support it. The single biggest predictor of being cited is having a passage that resolves that exact question directly and self-containedly. A page titled and structured around the precise query, with the answer up top, gives Perplexity something clean to lift. A sprawling guide that touches the topic but never states the answer plainly gives it little to attribute.",
        ],
      },
      {
        heading: "Specific and verifiable beats vague",
        body: [
          "Engines prefer claims they can pin down and corroborate. Content rich in concrete specifics - figures, dates, named techniques, clear cause and effect - reads as more authoritative and is easier to verify against other sources. Vague, hedged, or generic statements give the model nothing crisp to cite and are easy to substitute with a more precise source.",
        ],
        bullets: [
          "State concrete facts plainly rather than gesturing at them.",
          "Show your methodology or evidence so a claim can be trusted.",
          "Prefer precise numbers and named details over adjectives.",
          "Make the most citable sentence on the page both clear and accurate.",
        ],
      },
      {
        heading: "Formats that tend to earn citations",
        body: [
          "Some formats are structurally well-suited to being cited because they map cleanly onto how Perplexity answers. Original research and proprietary data are powerful because they are unique and corroborable. Clear how-to and step-by-step content matches procedural queries. Honest comparisons and definitions answer the 'which' and 'what is' questions that drive a lot of AI search. Primary sources - documentation, official statements, first-hand accounts - are attractive because they sit at the root of a claim rather than restating someone else's.",
        ],
      },
      {
        heading: "What Perplexity tends not to cite",
        body: [
          "By the same logic, certain content rarely gets cited. Thin or padded pages that never reach a clear answer, purely promotional copy with no verifiable substance, content that contradicts well-established facts, and pages that are inaccessible to the crawler all struggle. The pattern is consistent: if a passage is hard to extract, hard to verify, or hard to trust, a competing source that is easy on all three wins the citation.",
        ],
      },
    ],
    faqs: [
      { q: "Does longer content get cited more?", a: "Not inherently. What matters is that the specific question is answered directly and well. A focused, well-evidenced page often out-cites a longer one that buries its answer." },
      { q: "Is original data worth the effort for citations?", a: "Often yes. Unique, corroborable data gives Perplexity something it cannot find elsewhere and positions you as a primary source, which is exactly what answer engines like to attribute." },
      { q: "How fresh does content need to be?", a: "It depends on the topic. For current or fast-moving subjects, recency is a meaningful signal; for evergreen topics it matters less, though an honest update date still helps." },
    ],
    related: [
      { label: "How to rank in Perplexity", href: "/resources/how-to-rank-in-perplexity" },
      { label: "How to write answer-shaped content", href: "/resources/answer-shaped-content" },
      { label: "Content Authority - be the source AI trusts", href: "/platform/content-authority" },
    ],
  },

  "gptbot-and-ai-crawlers": {
    slug: "gptbot-and-ai-crawlers",
    metaTitle: "GPTBot and AI Crawlers: What to Allow | Citensity",
    metaDescription:
      "GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, and Google-Extended each do different jobs. Here is what each AI crawler does and what to allow.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "AI crawlers fall into two broad jobs: crawling to surface and cite your content in AI answers, and crawling to use content for model training. To be cited in AI answers you should allow the search-and-citation crawlers (such as OAI-SearchBot, PerplexityBot, and Google-Extended for grounding); whether to allow training crawlers like GPTBot is a separate content-strategy choice you make in robots.txt.",
    takeaways: [
      "Not all AI bots do the same thing - separate citation crawlers from training crawlers.",
      "Blocking a citation crawler removes you from being cited in that engine's answers.",
      "GPTBot relates to OpenAI training; OAI-SearchBot relates to ChatGPT Search citations.",
      "Google-Extended governs whether your content can ground Google's generative answers.",
      "Control all of this in robots.txt, and verify with your server logs that bots obey it.",
    ],
    sections: [
      {
        heading: "Two jobs, one robots.txt",
        body: [
          "AI crawlers are not monolithic. Some exist to retrieve and surface your content so an engine can cite you in an answer; others exist to gather content used to train or improve models. These are different value exchanges. The first directly affects your visibility in AI answers; the second affects whether your content contributes to a model's general knowledge, with no direct citation benefit.",
          "You manage access to all of them in robots.txt by user-agent. The key insight is to decide per-bot based on its job, rather than reflexively blocking everything unfamiliar - a broad disallow can quietly cut you out of the very AI answers you want to appear in.",
        ],
      },
      {
        heading: "The major AI crawlers and what they do",
        body: [
          "Here is how the main agents map to outcomes. The names and behaviors evolve, so confirm current documentation, but the categories are stable: citation-oriented crawlers versus training-oriented crawlers.",
        ],
        bullets: [
          "OAI-SearchBot - surfaces content for ChatGPT Search results and citations (citation-oriented).",
          "GPTBot - OpenAI crawler associated with model training (training-oriented).",
          "PerplexityBot - Perplexity's crawler for retrieval and citation in its answers.",
          "ClaudeBot - Anthropic's crawler for accessing web content.",
          "Google-Extended - controls whether your content can ground/train Google's generative features.",
          "Googlebot / Bingbot - classic search indexing that also underpins AI Overviews and Copilot grounding.",
        ],
      },
      {
        heading: "How to decide what to allow",
        body: [
          "Start from your goal. If you want to be cited in AI answers - which is the point of GEO - you should allow the citation and grounding crawlers for the engines you care about, and keep your classic search bots allowed since they underpin AI Overviews and Copilot. Blocking these is self-defeating for visibility.",
          "Training crawlers like GPTBot are a genuine judgment call. Some publishers allow them to contribute to model knowledge; others restrict them over content-rights concerns. Crucially, blocking a training crawler does not, by itself, remove you from that engine's live search citations, because those are governed by the separate search crawler. Decide the two questions independently.",
        ],
      },
      {
        heading: "Implement and verify",
        body: [
          "Set rules per user-agent in robots.txt, then verify reality against intent. robots.txt is a directive that well-behaved crawlers respect, so check your server logs to confirm the bots you allowed are actually fetching pages and the ones you blocked are not. Re-check periodically, because crawler names and behaviors change. If a bot you want is not appearing in logs, that is your first GEO problem to fix - eligibility precedes everything.",
        ],
      },
    ],
    faqs: [
      { q: "If I block GPTBot, will ChatGPT stop citing me?", a: "Not necessarily. GPTBot is associated with training, while ChatGPT Search citations are associated with OAI-SearchBot. Blocking the training crawler does not by itself remove you from search citations, which are governed separately." },
      { q: "Does robots.txt actually stop AI crawlers?", a: "It is a directive that reputable crawlers honor, not a hard technical lock. Confirm compliance via server logs, and use server-level controls if you need stronger enforcement." },
      { q: "Should most sites block AI crawlers?", a: "For GEO, generally no - blocking citation crawlers removes you from AI answers. Training crawlers are a separate, legitimate choice. Block deliberately, not reflexively." },
    ],
    related: [
      { label: "ChatGPT Search optimization: a practical guide", href: "/resources/chatgpt-search-optimization" },
      { label: "How to get cited by Claude", href: "/resources/how-to-get-cited-by-claude" },
      { label: "AI Feed - your machine-readable surface", href: "/platform/ai-feed" },
    ],
  },

  "how-ai-engines-pick-brands-to-recommend": {
    slug: "how-ai-engines-pick-brands-to-recommend",
    metaTitle: "How AI Engines Pick Brands to Recommend | Citensity",
    metaDescription:
      "AI engines recommend brands they can retrieve, understand as a clear entity, and trust through corroboration. Here is how the selection actually works.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "AI engines recommend brands they can retrieve as relevant, understand as a well-defined entity, and trust because the claims about them are corroborated across independent sources. When a user asks for a recommendation, the engine assembles a shortlist from what it can find and verify - so being consistently described, frequently referenced, and clearly positioned is what gets a brand named.",
    takeaways: [
      "Recommendations are assembled from what the engine can retrieve and verify, not from who pays the most.",
      "A clear, consistent entity (who you are, what you do, who you serve) makes you easy to recommend.",
      "Corroboration across independent sources builds the trust that puts you on the shortlist.",
      "Specific positioning beats generic claims - engines match brands to the precise need in the query.",
      "Third-party mentions and reviews shape recommendations as much as your own site does.",
    ],
    sections: [
      {
        heading: "Recommendation is retrieval plus trust",
        body: [
          "When someone asks an AI engine to recommend a tool, service, or brand for a need, the engine does not consult a paid ranking. It retrieves what it can find about candidates that match the need, then synthesizes a shortlist weighted toward options it can describe confidently and verify. So a recommendation is really the intersection of two things: being retrievable and relevant for the request, and being trustworthy enough that the engine is comfortable putting your name in front of a user.",
          "This reframes the work. You are not bidding for a slot; you are making your brand the easiest correct answer to find, the clearest to understand, and the safest to vouch for.",
        ],
      },
      {
        heading: "Be a clear, consistent entity",
        body: [
          "Engines reason about brands as entities - structured concepts with a name, a category, attributes, and relationships. The more clearly and consistently your entity is defined across the web, the more confidently an engine can match you to a relevant query and describe you accurately. Conflicting or vague descriptions create uncertainty, and uncertainty makes a model reach for a competitor it understands better.",
        ],
        bullets: [
          "State plainly who you are, what you do, and exactly who you serve.",
          "Keep your name, category, and core claims consistent everywhere you appear.",
          "Use structured data so engines can resolve your brand and its attributes.",
          "Make your differentiators explicit rather than implied.",
        ],
      },
      {
        heading: "Earn corroboration beyond your own site",
        body: [
          "An engine trusts a claim more when it appears in places you do not control. Independent mentions, reviews, comparisons, directories, and coverage all corroborate what your own site says - and corroboration is what turns a claim into a recommendation. A brand that only describes itself, with no external echo, is harder to vouch for than one whose positioning is reflected across reputable third parties.",
          "This is why GEO is not just on-page work. Being genuinely referenced by others, accurately and consistently, is one of the strongest inputs into whether you get recommended.",
        ],
      },
      {
        heading: "Match the specific need",
        body: [
          "Recommendations are contextual. An engine recommends the best fit for the precise need expressed in the query - the five-person agency, the regulated industry, the budget tier. Brands that articulate exactly who they are for, and back it with evidence, get matched to those specific requests. Generic 'best in class' claims match nothing in particular. The more precisely you define your ideal use case and prove it, the more often you are the recommended answer for the queries that actually fit you.",
        ],
      },
    ],
    faqs: [
      { q: "Can I pay to be recommended by an AI engine?", a: "Organic recommendations are based on retrieval and trust, not payment. Some engines may add labeled advertising separately, but the recommendations users trust are earned through clarity, relevance, and corroboration." },
      { q: "Why does an engine recommend a smaller competitor over us?", a: "Often because the competitor is described more clearly, matched more precisely to the query's need, or corroborated by more independent sources. Tighten your entity definition and earn third-party references." },
      { q: "Do reviews and third-party mentions really matter?", a: "Yes. Independent corroboration is a major trust input. What others say about you, consistently and credibly, can influence recommendations as much as your own pages." },
    ],
    related: [
      { label: "Entity SEO: how to be understood by AI", href: "/resources/entity-seo-explained" },
      { label: "E-E-A-T for AI search: signals that earn citations", href: "/resources/eeat-for-ai-search" },
      { label: "Brand Memory - your grounded source of truth", href: "/platform/brand-memory" },
    ],
  },

  "what-is-llms-txt": {
    slug: "what-is-llms-txt",
    metaTitle: "What Is llms.txt, and Do You Need It? | Citensity",
    metaDescription:
      "llms.txt is a proposed file that points AI systems to your most important content in clean Markdown. Here is what it does, its limits, and whether you need it.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "llms.txt is a proposed plain-text file, placed at your domain root, that points AI systems to your most important pages in a clean, structured, Markdown-friendly form. It is a helpful signpost for LLMs, not a ranking mechanism or an access-control file - it complements good content and structured data rather than replacing them, and adoption by AI engines is still emerging.",
    takeaways: [
      "llms.txt is a curated, Markdown-style index of your key content for AI systems, hosted at /llms.txt.",
      "It is a proposed convention, not an official standard, and engine support is still evolving.",
      "It does not control crawler access - that is robots.txt - and it is not a ranking signal.",
      "Its value is clarity: pointing AI to your canonical, most important resources in clean form.",
      "Treat it as a low-cost complement to strong content, not a substitute for it.",
    ],
    sections: [
      {
        heading: "What llms.txt actually is",
        body: [
          "llms.txt is a proposed convention: a plain-text file at the root of your domain (yourdomain.com/llms.txt) that gives AI systems a curated, human-readable map of your most important content. It is typically written in a Markdown-friendly format with links and short descriptions, so a model can quickly understand what your site offers and where the canonical, high-value resources live.",
          "The motivation is simple. A full website is noisy - navigation, boilerplate, scripts, and sprawling pages make it harder for an AI to find the substance. llms.txt is an attempt to hand AI systems a clean, intentional summary instead of making them infer it from a cluttered crawl.",
        ],
      },
      {
        heading: "What it is not",
        body: [
          "It is easy to over-read llms.txt, so be precise about its limits. It does not control crawler access - that remains robots.txt's job. It is not a ranking factor that pushes you up an engine's results. And it is not an official, universally-supported standard; it is a community proposal that some tools and engines are exploring while others ignore it.",
        ],
        bullets: [
          "Not access control - use robots.txt to allow or block crawlers.",
          "Not a ranking signal - it will not by itself make you cited more.",
          "Not a guaranteed-read file - engine support is emerging, not universal.",
          "Not a replacement for good content, structured data, or crawlability.",
        ],
      },
      {
        heading: "Do you need one?",
        body: [
          "For most sites, llms.txt is low-cost and low-risk, so the honest answer is: it is worth providing, but keep expectations modest. If you have important documentation, product pages, or canonical resources you want AI systems to find and represent accurately, a clean llms.txt that points to them is a reasonable, cheap signpost. It will not transform your visibility on its own, and it should never be your primary GEO investment.",
          "The bigger wins remain genuinely useful content, answer-first structure, crawlability, and trust. Think of llms.txt as the tidy index at the front of a well-written book - helpful, but only because the book itself is good.",
        ],
      },
      {
        heading: "How to make a useful one",
        body: [
          "If you publish one, make it genuinely useful rather than a dump of every URL. Lead with a short description of what your organization does, then list your most important resources with concise, accurate descriptions and links to canonical pages. Keep it curated and current - its whole value is being a trustworthy, low-noise pointer to your best, canonical content.",
        ],
      },
    ],
    faqs: [
      { q: "Where do I put llms.txt?", a: "At the root of your domain, served at yourdomain.com/llms.txt as plain text, similar to where robots.txt lives." },
      { q: "Will llms.txt make AI engines cite me more?", a: "Not directly. It helps AI systems find and understand your canonical content, but citation still depends on relevance, clarity, and trust. Treat it as a complement, not a lever." },
      { q: "Is llms.txt an official standard?", a: "No. It is a proposed community convention. Some tools and engines are exploring it, but support is not universal, so do not rely on it being read everywhere." },
    ],
    related: [
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "GPTBot and AI crawlers: what to allow and why", href: "/resources/gptbot-and-ai-crawlers" },
      { label: "AI Feed - JSON-LD and llms.txt, generated", href: "/platform/ai-feed" },
    ],
  },

  "answer-shaped-content": {
    slug: "answer-shaped-content",
    metaTitle: "How to Write Answer-Shaped Content | Citensity",
    metaDescription:
      "Answer-shaped content leads with a direct, self-contained answer to a specific question, then supports it with evidence - the format AI engines extract and cite.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "Answer-shaped content is writing that leads with a direct, self-contained answer to a specific question, then supports it with evidence and detail. It is the format AI engines extract and cite most reliably, because each passage resolves a real question cleanly enough to be lifted and attributed without the model having to reconstruct your point.",
    takeaways: [
      "Lead with the answer, not the wind-up - the citable sentence belongs near the top.",
      "Make each passage self-contained so it makes sense quoted on its own.",
      "Phrase headings as the questions real users ask.",
      "Support the answer with specifics; lead, then prove.",
      "One question per section keeps passages clean and extractable.",
    ],
    sections: [
      {
        heading: "Why answer-first wins",
        body: [
          "AI engines synthesize answers by lifting passages that resolve a question directly and attributing them. A page that opens with setup, background, and brand throat-clearing forces the model to hunt for the answer, and often it will hunt in a competitor's cleaner page instead. A page that states the answer immediately hands the engine exactly what it needs to cite.",
          "This is the same instinct behind a good featured snippet, a strong abstract, or a well-written executive summary: say the thing, then explain it. Answer-shaped content simply applies that discipline at the level of every section, not just the page opener.",
        ],
      },
      {
        heading: "The shape of an answer-shaped passage",
        body: [
          "A reliable pattern is answer, then support, then context. Open the section with a one-to-three sentence direct answer to a specific question. Follow with the evidence, reasoning, or steps that justify it. Add edge cases or nuance last. The reader - human or model - gets the payoff first and the depth on demand.",
        ],
        bullets: [
          "Answer: a direct, self-contained response to one specific question.",
          "Support: the evidence, data, or reasoning behind the answer.",
          "Context: caveats, exceptions, and related nuance, placed after the answer.",
          "Heading: phrased the way a real person would ask the question.",
        ],
      },
      {
        heading: "Make passages self-contained",
        body: [
          "Because an engine may quote a single passage in isolation, each one should make sense on its own. Avoid answers that depend on a sentence three paragraphs earlier or on pronouns whose referents are off-screen. Name the subject, state the answer plainly, and assume the reader arrived at this passage without the preceding context. Self-contained passages are not only easier to cite - they are harder to misquote.",
        ],
      },
      {
        heading: "Common mistakes to avoid",
        body: [
          "The recurring failures are predictable. Burying the answer under a long introduction. Hedging so heavily that no clear claim survives. Padding to hit a word count, which dilutes the signal. Writing headings as vague labels ('Overview', 'More information') instead of real questions. And answering several questions in one tangled section so no single passage is cleanly extractable. Fix these and your content becomes dramatically more citable without adding a single new idea.",
        ],
      },
    ],
    faqs: [
      { q: "Does answer-first content hurt the reading experience?", a: "No - it usually helps. Readers, like engines, prefer getting the answer up front and the depth below. It is the structure of good documentation and journalism, not a compromise." },
      { q: "How long should an answer passage be?", a: "Long enough to fully resolve the specific question and no longer - often one to three sentences for the direct answer, with supporting detail beneath. Clarity matters more than length." },
      { q: "Should every section be answer-shaped?", a: "For informational content aimed at AI citation, largely yes. Each section should resolve one real question so any passage can be lifted cleanly." },
    ],
    related: [
      { label: "How to structure content so AI cites it", href: "/resources/content-structure-for-ai-citations" },
      { label: "What kind of content Perplexity cites most", href: "/resources/what-content-perplexity-cites" },
      { label: "Page Engine - generate answer-first pages", href: "/platform/page-engine" },
    ],
  },

  "entity-seo-explained": {
    slug: "entity-seo-explained",
    metaTitle: "Entity SEO: How to Be Understood by AI | Citensity",
    metaDescription:
      "Entity SEO makes search and AI engines understand your brand as a clear, consistent concept - not just keywords. Here is how to build a strong entity.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "Entity SEO is the practice of making engines understand your brand, products, and topics as well-defined entities - concepts with a name, attributes, and relationships - rather than as loose strings of keywords. A strong, consistent entity helps AI engines retrieve you for the right questions, describe you accurately, and trust you enough to cite or recommend you.",
    takeaways: [
      "An entity is a distinct concept (brand, person, product, topic) the engine can reason about, not just a keyword.",
      "Consistency is the core signal: the same name, attributes, and relationships everywhere you appear.",
      "Structured data and clear on-page facts help engines resolve and connect your entity.",
      "Strong entities are easier to retrieve for the right queries and to describe accurately.",
      "Disambiguation matters - make it obvious which 'you' the engine is dealing with.",
    ],
    sections: [
      {
        heading: "Keywords describe pages; entities describe things",
        body: [
          "Classic keyword thinking treats a page as a bag of terms to match against a query. Entity thinking treats the world as a graph of things - a company, its products, its people, its topics - each with attributes and relationships. Modern search and AI engines increasingly reason in this second way: they try to understand what a page is about, not merely which words it contains, and they connect that understanding to the entities they already know.",
          "For GEO this matters because AI engines answer questions and make recommendations by reasoning over entities. If an engine has a clear, confident model of your brand as an entity, it can match you to relevant questions and describe you accurately. If your entity is fuzzy or contradictory, the engine hesitates - and hesitation loses citations and recommendations to clearer competitors.",
        ],
      },
      {
        heading: "Build a clear, consistent entity",
        body: [
          "The dominant signal in entity SEO is consistency. Engines build confidence in an entity when its defining facts - name, category, what it does, who it serves, key relationships - line up across your own site and the wider web. Contradictions and vagueness erode that confidence. So the foundational work is mundane but powerful: say the same true things about yourself, the same way, everywhere.",
        ],
        bullets: [
          "Use one canonical brand name and stick to it across all properties.",
          "State your category and core attributes explicitly and consistently.",
          "Keep authors, products, and locations described the same way everywhere.",
          "Resolve contradictions between your site, profiles, and third-party mentions.",
        ],
      },
      {
        heading: "Help engines connect and disambiguate",
        body: [
          "Beyond consistency, give engines structured help. Schema markup (such as Organization, Person, Product) lets you state your entity's attributes and relationships in a machine-readable way, and linking to authoritative references helps engines disambiguate you from similarly-named entities. The aim is to remove ambiguity: make it unmistakable which company, person, or product this is, and how it relates to the topics it should be associated with.",
          "Internal linking plays a role too. A clear topical structure - a hub that connects related pages - signals the relationships between your entity and the subjects you want to be known for, reinforcing the graph the engine builds about you.",
        ],
      },
      {
        heading: "Why strong entities earn AI trust",
        body: [
          "A well-defined entity is easier to retrieve for the right queries, easier to describe without error, and easier to corroborate against other sources - and corroboration is what underpins citation and recommendation. When an AI engine can confidently identify who you are and verify what you claim, naming you in an answer is low-risk. A muddled entity raises that risk, and engines route around risk. Entity clarity, in short, is trust infrastructure for the AI-search era.",
        ],
      },
    ],
    faqs: [
      { q: "Is entity SEO different from keyword SEO?", a: "It is a complementary evolution. Keywords still matter for matching queries, but entity SEO ensures engines understand the things behind the words - your brand, products, and topics - which is essential for AI answers and recommendations." },
      { q: "What is the single most important entity signal?", a: "Consistency. The same true facts about your brand, stated the same way across your site and the web, is the strongest input. Contradiction is the biggest entity-SEO mistake." },
      { q: "Does schema markup build my entity?", a: "It helps engines read your entity's attributes and relationships clearly, but it supports rather than replaces consistent, accurate facts. Markup plus real consistency is the combination." },
    ],
    related: [
      { label: "How AI engines pick which brands to recommend", href: "/resources/how-ai-engines-pick-brands-to-recommend" },
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "Brand Memory - your grounded source of truth", href: "/platform/brand-memory" },
    ],
  },

  "eeat-for-ai-search": {
    slug: "eeat-for-ai-search",
    metaTitle: "E-E-A-T for AI Search: Signals That Earn Citations | Citensity",
    metaDescription:
      "E-E-A-T (Experience, Expertise, Authoritativeness, Trust) shapes which sources AI engines are willing to cite. Here are the signals that earn citations.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trust - the qualities that make search and AI engines comfortable surfacing and citing a source. For AI search, demonstrating real first-hand experience, genuine expertise, recognized authority, and verifiable trustworthiness is what tips an engine toward citing you rather than an equally relevant but less credible page.",
    takeaways: [
      "E-E-A-T is about demonstrable credibility, not a single score you can set.",
      "Experience and expertise show through first-hand detail and accurate, specific knowledge.",
      "Authority is earned through recognition and references from other credible sources.",
      "Trust is the foundation - accurate, transparent, well-sourced content with clear authorship.",
      "Citation is a risk decision; strong E-E-A-T lowers the engine's risk of citing you.",
    ],
    sections: [
      {
        heading: "What E-E-A-T means and why AI cares",
        body: [
          "E-E-A-T originated in Google's quality guidelines as a way of describing the credibility a source should have, especially on topics where bad information can cause harm. It is not a direct ranking number; it is a framework for the kinds of signals quality systems and, increasingly, AI engines weigh when deciding whether to trust a source.",
          "AI search cares because citation is fundamentally a trust decision. When an engine names you in an answer, it is vouching for you to the user. It would rather vouch for a source with demonstrable experience, expertise, authority, and trust than gamble on a relevant but unproven page. So E-E-A-T is less a checkbox and more the credibility that makes you a safe source to cite.",
        ],
      },
      {
        heading: "Experience and expertise",
        body: [
          "Experience is first-hand involvement - having actually used the product, done the procedure, visited the place. It shows through concrete, specific detail that someone who had not done the thing could not fabricate convincingly. Expertise is depth of knowledge, shown through accuracy, nuance, and the ability to address edge cases correctly. Together they signal that the content comes from someone who genuinely knows the subject.",
        ],
        bullets: [
          "Include first-hand specifics, examples, and observations, not just summarized theory.",
          "Name qualified authors and make their relevant background visible.",
          "Address nuance and edge cases accurately - depth signals real expertise.",
          "Avoid generic, surface-level content that anyone could have paraphrased.",
        ],
      },
      {
        heading: "Authoritativeness and trust",
        body: [
          "Authoritativeness is recognition by others: being referenced, cited, and treated as a go-to source on a topic by credible third parties. You cannot fully self-declare it; you earn it as the wider web corroborates your standing. Trustworthiness is the foundation that holds everything up - accurate information, transparent sourcing, honest claims, clear identity, and a site that behaves credibly. On topics that affect health, finances, or safety, the bar for both rises.",
          "For AI search, these translate directly into citation likelihood. Corroboration from independent reputable sources, transparent evidence, and clear authorship are exactly the signals that let an engine verify your claims and attribute them with confidence.",
        ],
      },
      {
        heading: "How to strengthen E-E-A-T for citations",
        body: [
          "The work is consistent and unglamorous: publish accurate, well-sourced content; show genuine experience and qualified authorship; cite primary evidence; and earn legitimate references from credible sources over time. Keep facts current and correct errors visibly. Make your identity and sourcing transparent so a reader - or a model - can verify who is speaking and on what basis. Done consistently, this is what turns a relevant page into a cited one.",
        ],
      },
    ],
    faqs: [
      { q: "Is E-E-A-T a direct ranking factor?", a: "It is not a single measurable score you set. It is a framework describing credibility signals that quality and AI systems weigh. You influence it through demonstrable experience, expertise, authority, and trust." },
      { q: "How is the extra 'E' (Experience) different from Expertise?", a: "Experience is first-hand involvement with the subject; expertise is depth of knowledge about it. A reviewer who actually used a product shows experience; a domain specialist explaining how it works shows expertise. The best content shows both." },
      { q: "Why does E-E-A-T matter more for some topics?", a: "On topics that can affect health, finances, or safety, inaccurate information carries real risk, so engines hold sources to a higher credibility bar before citing them." },
    ],
    related: [
      { label: "How AI engines pick which brands to recommend", href: "/resources/how-ai-engines-pick-brands-to-recommend" },
      { label: "Entity SEO: how to be understood by AI", href: "/resources/entity-seo-explained" },
      { label: "Content Authority - be the source AI trusts", href: "/platform/content-authority" },
    ],
  },

  "content-structure-for-ai-citations": {
    slug: "content-structure-for-ai-citations",
    metaTitle: "How to Structure Content So AI Cites It | Citensity",
    metaDescription:
      "Structure content for AI citations with answer-first passages, question-style headings, clean semantic HTML, and one idea per section so engines can extract you.",
    updated: "2026-06-25",
    readMins: 6,
    answer:
      "To structure content so AI cites it, organize the page into self-contained, answer-first passages under headings phrased as real questions, use clean semantic HTML and lists for steps and comparisons, and keep one clear idea per section. The goal is to make any passage easy for an engine to extract, understand, and attribute without rebuilding your point from scattered prose.",
    takeaways: [
      "Answer-first passages under question-style headings are the core unit AI extracts.",
      "Clean semantic HTML (real headings, lists, paragraphs) helps engines parse your structure.",
      "One idea per section keeps passages self-contained and quotable.",
      "Lists and tables map cleanly onto how engines summarize steps and comparisons.",
      "A logical hierarchy and internal links signal how your content fits together.",
    ],
    sections: [
      {
        heading: "Think in extractable units",
        body: [
          "AI engines do not cite whole pages; they lift passages. So the right mental model is to build your content as a set of self-contained units, each of which fully answers one specific question. If a single section could be quoted in isolation and still make complete sense, it is extractable. If understanding it requires three other paragraphs of context, it is not - and the engine will likely cite a competitor whose passage stands on its own.",
          "This shifts how you outline. Instead of a flowing narrative, plan a sequence of question-and-answer blocks, ordered logically, each resolving a real query a user might ask.",
        ],
      },
      {
        heading: "Use headings, hierarchy, and clean HTML",
        body: [
          "Structure is communicated through markup. Use real semantic headings (H1 for the page question, H2s for section questions), genuine paragraph and list elements, and a logical hierarchy that mirrors the content's organization. Phrase headings the way people actually ask - as questions or precise topics - so an engine matching a query can find the relevant block immediately.",
        ],
        bullets: [
          "One descriptive H1 that states the page's core question.",
          "H2s phrased as the specific questions each section answers.",
          "Real lists for steps and options, not paragraphs pretending to be lists.",
          "Clean, semantic HTML so the structure is machine-parseable, not visual-only.",
        ],
      },
      {
        heading: "Match format to question type",
        body: [
          "Different questions have natural shapes, and matching them makes extraction trivial. Use ordered lists for procedures and how-to steps, because engines summarize them step by step. Use tables or clear contrasts for comparisons. Use a tight definition block for 'what is' questions. Use short, direct paragraphs for explanatory answers. When the format fits the question, the engine can lift it almost verbatim, which is the easiest possible citation.",
        ],
      },
      {
        heading: "Connect the pieces",
        body: [
          "Beyond the individual passage, structure also operates at the page and site level. A clear table of contents, a logical reading order, and internal links to related answers help engines understand how your content fits together and reinforce your topical coverage. Well-formed structured data adds a machine-readable layer on top, helping engines map your structure to recognized types (article, FAQ, how-to) - supporting, not replacing, the clean structure underneath.",
        ],
      },
    ],
    faqs: [
      { q: "Does formatting really affect whether AI cites me?", a: "Yes, meaningfully. Engines extract passages, so clean, self-contained, well-marked-up structure makes your content easier to lift and attribute. Poor structure can leave good information uncited because it is hard to extract." },
      { q: "Should I use FAQ sections for everything?", a: "Use them where genuine questions exist and the answers are short and distinct. Forcing every page into FAQ format is counterproductive; the principle is one clear question per extractable unit, however you present it." },
      { q: "Is visual formatting enough, or do I need semantic HTML?", a: "You need real semantic HTML. Styling that looks like a heading or list but is not marked up as one is invisible structure to a parser. Use actual heading, list, and paragraph elements." },
    ],
    related: [
      { label: "How to write answer-shaped content", href: "/resources/answer-shaped-content" },
      { label: "FAQ schema for AI answers: when and how", href: "/resources/faq-schema-for-ai" },
      { label: "Page Engine - generate well-structured pages", href: "/platform/page-engine" },
    ],
  },

  "faq-schema-for-ai": {
    slug: "faq-schema-for-ai",
    metaTitle: "FAQ Schema for AI Answers: When and How | Citensity",
    metaDescription:
      "FAQ schema marks up genuine question-and-answer pairs so engines can parse them cleanly. Here is when it helps AI answers, when to skip it, and how to do it right.",
    updated: "2026-06-25",
    readMins: 5,
    answer:
      "FAQ schema is structured data (FAQPage in schema.org) that marks up genuine question-and-answer pairs so engines can parse them cleanly. It helps AI answers by making your Q&A content machine-readable and unambiguous, but it only works when the questions are real and the answers are useful - it is a clarity aid, not a ranking trick, and misused it can backfire.",
    takeaways: [
      "FAQ schema labels real question-and-answer pairs in machine-readable form using FAQPage markup.",
      "It helps engines parse and attribute your answers, but only if the Q&A is genuine and useful.",
      "Use it for content that truly is a list of distinct questions and answers - not as decoration.",
      "The markup must match visible on-page content; hidden or fake FAQs violate guidelines.",
      "Schema supports good answer-shaped content; it cannot rescue thin or padded content.",
    ],
    sections: [
      {
        heading: "What FAQ schema does",
        body: [
          "FAQ schema is a structured-data type (FAQPage with Question and Answer entries) that explicitly tells engines: this block is a set of questions and their answers. Instead of inferring your Q&A structure from layout, an engine reads it directly and unambiguously. For AI search, that clarity helps the engine understand which passage answers which question and attribute it correctly.",
          "Crucially, the schema describes content that should already exist on the page. It is a label, not a substitute. Good answer-shaped Q&A content marked up with FAQ schema is clearer to an engine than the same content with no markup - but markup over thin or fake content adds nothing of value and can cause harm.",
        ],
      },
      {
        heading: "When to use it",
        body: [
          "Use FAQ schema when your page genuinely contains a set of distinct questions with concise, useful answers - the kind real users actually ask. Support pages, product detail pages with common questions, and explanatory articles with a true FAQ section are natural fits. The questions should be real, the answers should resolve them, and both should be visible to users on the page.",
        ],
        bullets: [
          "Genuine, distinct questions real users ask about the topic.",
          "Concise answers that actually resolve each question.",
          "Q&A that is visible to users, not hidden solely for markup.",
          "Pages where a Q&A structure is natural, not forced onto unrelated content.",
        ],
      },
      {
        heading: "When to skip it",
        body: [
          "Skip FAQ schema when there is no genuine Q&A - do not invent questions just to add markup. Avoid marking up content the user cannot see, padding a page with trivial or repetitive questions, or using FAQ schema to game appearance rather than to clarify real content. Search engines have guidelines against deceptive or hidden structured data, and misuse can lead to the markup being ignored or penalized. When in doubt, ask whether the FAQ would exist even without the schema; if not, do not add it.",
        ],
      },
      {
        heading: "How to do it right",
        body: [
          "Implement FAQ schema as valid JSON-LD that mirrors the visible questions and answers exactly. Keep questions phrased as users ask them and answers concise and self-contained. Validate the markup so it is well-formed, and keep it in sync when you edit the on-page content. Treat it as the machine-readable layer on top of genuinely useful answer-shaped Q&A - the schema makes good content legible to engines; it cannot make weak content good.",
        ],
      },
    ],
    faqs: [
      { q: "Does FAQ schema guarantee my answers appear in AI results?", a: "No. It makes your Q&A content clearer and easier to parse, which can help, but appearance still depends on relevance, quality, and trust. Schema is a clarity aid, not a guarantee." },
      { q: "Can FAQ schema hurt my site?", a: "It can if misused - marking up hidden content, fabricating questions, or using it deceptively violates guidelines and can cause the markup to be ignored or penalized. Used honestly over real Q&A, it is safe and helpful." },
      { q: "Should every page have FAQ schema?", a: "No. Only use it where a genuine set of questions and answers exists. Forcing FAQs onto pages that do not naturally have them dilutes quality and risks misuse." },
    ],
    related: [
      { label: "How to structure content so AI cites it", href: "/resources/content-structure-for-ai-citations" },
      { label: "Structured data for AI search", href: "/resources/structured-data-for-ai-search" },
      { label: "AI Feed - JSON-LD and llms.txt, generated", href: "/platform/ai-feed" },
    ],
  },
};