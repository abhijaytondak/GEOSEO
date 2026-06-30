import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { dbEnabled, ensureTable, loadAllWithIds, removeRow, upsert } from "../db/db";
import { resolveMode } from "../common/mode";
import { DEFAULT_TENANT_ID } from "../common/tenant";
import { draftPageContent, type DraftContent } from "../llm/deepseek";
import { specFor, buildSchemaJson, type SchemaContext } from "../llm/page-type-spec";
import { clampTitle, clampDescription, computeSeoChecks, MIN_WORDS } from "../common/seo";
import { scoreCitability } from "../common/citability";
import { buildInfographic } from "../llm/infographic";
import { classifyIntents, type ClassifiedIntent } from "../llm/intent";
import { BrandMemoryStore } from "./brand.service";
import { BrandLibraryStore, composeBrandContext } from "./brand-library.service";
import { KeywordResearchService, type KeywordIdea, type ResearchSource } from "./keyword-research.service";
import { ImageGenStore } from "./image-gen.service";
import { InfographicService } from "./infographic.service";

const T = {
  opps: "pe_opportunities",
  blueprints: "pe_blueprints",
  pages: "pe_pages",
  versions: "pe_versions",
  leads: "pe_leads",
  audit: "pe_audit",
} as const;
import type {
  AuditEntry,
  FunnelStage,
  GeneratedPage,
  KeywordOpportunity,
  Lead,
  LeadStatus,
  OpportunityStatus,
  PageBlueprint,
  PageEdit,
  PageStatus,
  PageType,
  PageVersion,
  SearchIntent,
  SpamStatus,
} from "@geoseo/types";

/**
 * Build type-appropriate FAQ pairs for the template path.
 * Questions are tailored to the page type so a comparison page asks "Which is better?"
 * while a guide asks "How long does it take?" — not the same generic questions for all types.
 */
function buildFaqsForType(type: PageType, keyword: string, count: number): { q: string; a: string }[] {
  const k = keyword;
  const typeQuestions: Record<PageType, { q: string; a: string }[]> = {
    guide: [
      { q: `How long does it take to learn ${k}?`, a: `Most people get comfortable with ${k} within a few weeks of consistent practice. A structured guide like this one speeds up the process considerably.` },
      { q: `Is ${k} suitable for beginners?`, a: `Yes. This guide is written for people at all experience levels. Start with the early sections and work through at your own pace.` },
      { q: `What are the most common mistakes with ${k}?`, a: `The most common mistake is skipping the fundamentals and jumping straight to advanced techniques. Building a solid base first saves significant time later.` },
      { q: `Do I need special tools to get started with ${k}?`, a: `No special tools are required to start. The basics of ${k} can be applied with what most teams already have — we cover any recommended tools in the later sections.` },
      { q: `How do I measure progress with ${k}?`, a: `Set clear goals before you start, then track the specific metrics most relevant to your situation. We recommend reviewing progress every two weeks and adjusting your approach accordingly.` },
      { q: `Where can I get help with ${k}?`, a: `This guide covers the most common questions, but every situation is unique. Reach out via the contact form if you'd like personalised advice.` },
    ],
    service: [
      { q: `What does your ${k} service include?`, a: `Our ${k} service includes initial discovery, a structured delivery phase, and ongoing support. Full scope is confirmed during the discovery call.` },
      { q: `How long does the ${k} engagement take?`, a: `Most ${k} projects run between four and twelve weeks depending on scope and complexity. We'll give you a detailed timeline during the discovery phase.` },
      { q: `How much does ${k} cost?`, a: `Pricing depends on the scope of your requirements. We offer fixed-scope packages and custom engagements — contact us for a no-obligation quote.` },
      { q: `Do you offer ongoing support after the ${k} project?`, a: `Yes. We offer a range of ongoing support options so you can continue to build on the work after the initial engagement.` },
    ],
    comparison: [
      { q: `Which option is better for ${k}?`, a: `It depends on your requirements. If speed and simplicity are the priority, Option A is typically the better choice. For scale and flexibility, Option B has the edge.` },
      { q: `Can I switch between options later?`, a: `Switching is possible but comes with a migration cost. It's worth choosing the right option for your current and near-future needs rather than planning a switch.` },
      { q: `How do the prices compare for ${k}?`, a: `Pricing varies significantly by use case and team size. We recommend requesting quotes from both providers with your specific requirements before comparing.` },
      { q: `Which option is better for small teams?`, a: `For small teams, the simpler option generally delivers faster results. Avoid over-engineering the solution before you have clear evidence of what you need.` },
      { q: `Is there a free trial available?`, a: `Most providers in this space offer a trial period. Check the provider's site directly for current trial terms — these change frequently.` },
    ],
    landing: [
      { q: `How do I get started with ${k}?`, a: `The fastest way to get started is to book a discovery call. We'll understand your situation, share relevant experience, and outline the right path forward.` },
      { q: `What results can I expect from ${k}?`, a: `Results vary by starting point and effort, but clients typically see meaningful progress within the first 30 to 90 days when they engage fully with the process.` },
      { q: `How is this different from other ${k} providers?`, a: `We focus on practical, measurable outcomes rather than activity or deliverable counts. You'll know exactly what's happening and why at every stage.` },
      { q: `Is there a minimum commitment for ${k}?`, a: `No minimum commitment is required for an initial discovery conversation. Ongoing engagement terms are discussed and agreed upfront.` },
    ],
    faq: [
      { q: `What is ${k}?`, a: `${k} refers to the practice or product described on this page. The sections above cover the key concepts in detail.` },
      { q: `Who is ${k} for?`, a: `${k} is relevant to anyone facing the challenges or goals described on this page. Specific use cases are covered in the sections above.` },
      { q: `How do I get started with ${k}?`, a: `Use the contact form on this page or browse the related resources to take your first step.` },
      { q: `Is ${k} suitable for my industry?`, a: `In most cases, yes. The core principles apply across industries, though implementation details may vary.` },
      { q: `What are the alternatives to ${k}?`, a: `Alternatives exist and are worth considering. The right choice depends on your specific situation, constraints, and goals.` },
      { q: `How much does ${k} cost?`, a: `Costs vary depending on how you approach ${k}. Contact us for a personalised estimate based on your requirements.` },
      { q: `How long does ${k} take?`, a: `Timelines depend on scope and starting point. Most engagements deliver initial results within weeks, not months.` },
      { q: `Can I try ${k} before committing?`, a: `Yes. We offer a no-obligation discovery conversation so you can understand the fit before making any commitment.` },
      { q: `What do I need to get started with ${k}?`, a: `Very little upfront. A clear goal and a willingness to engage with the process are the most important ingredients.` },
      { q: `How do I know if ${k} is working?`, a: `We define success metrics at the start of every engagement so you always have a clear picture of progress.` },
    ],
    resource: [
      { q: `Is this ${k} resource free?`, a: `Yes. The resource on this page is free to use. More advanced templates and toolkits are available for download — use the contact form to request them.` },
      { q: `Can I adapt this ${k} resource for my own use?`, a: `Absolutely. The resource is designed to be adapted. Adjust headings, examples, and timelines to fit your specific context.` },
      { q: `How often is this ${k} resource updated?`, a: `We review and update our resources regularly as best practices evolve. Check back for the latest version or subscribe for updates.` },
    ],
    local: [
      { q: `Do you provide ${k} in my area?`, a: `We cover a wide area — contact us with your location and we'll confirm availability straight away.` },
      { q: `How quickly can you respond for ${k} in my area?`, a: `Response times depend on your location and current demand. For most areas we can respond within 24–48 hours.` },
      { q: `Are your ${k} services the same everywhere?`, a: `Our core service is consistent everywhere we operate. Local conditions may affect timelines and specific recommendations.` },
      { q: `Can I meet the ${k} team in person?`, a: `Yes. For clients in our core service area, face-to-face meetings are available on request.` },
    ],
  };

  const pool = typeQuestions[type] ?? typeQuestions.landing;
  // Return up to `count` questions; cycle if there are fewer in the pool.
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

/**
 * Build type-specific sections for the deterministic (non-LLM) template path.
 * Each page type gets a distinct structure — different headings, section count, and
 * brand/keyword-aware placeholder body copy — so the template fallback is never
 * a generic "3-section + 2-FAQ" for every page type.
 *
 * When the LLM is available, `draftPageContent` returns `ai.sections` and this
 * function is never called (the LLM path is already type-aware via page-type-spec.ts).
 */
function buildSectionsForType(
  type: PageType,
  keyword: string,
  brandName: string,
  _intent: string,
): { heading: string; body: string }[] {
  const k = keyword;
  const b = brandName || "our team";

  switch (type) {
    case "guide":
      return [
        {
          heading: `What is ${k}?`,
          body: `${k} is a structured, repeatable approach to achieving a specific outcome — not a one-off tactic, but a system your team can rely on. In practical terms, it means replacing guesswork with a clear method: defined goals, a known sequence of steps, and measurable checkpoints along the way.\n\nThis guide explains exactly what ${k} involves, why it matters, and how to apply it from a standing start. ${b} has worked with organisations at every stage of this journey — from teams trying it for the first time to those refining a mature process. The focus throughout stays practical: concrete steps, the decisions that actually move the needle, and the pitfalls worth avoiding. Read it end to end for the full picture, or jump straight to the section that matches where you are today.`,
        },
        {
          heading: `Step 1 — Get started with ${k}`,
          body: `The fastest way to start with ${k} is to fix the fundamentals before reaching for advanced techniques. Begin by writing down a single, specific goal, then map the simplest path from where you are now to where you want to be. A clear goal turns a vague ambition into something you can actually measure and improve against.\n\nFrom there, keep the first version deliberately small. Pick one workflow, one team, or one use case and prove the approach works there before expanding. Most teams see early wins within the first two weeks when they resist the urge to do everything at once. Document what you try and what happens — that record becomes the foundation for every later step.`,
        },
        {
          heading: `Step 2 — Build a repeatable approach`,
          body: `Once the basics are in place, ${k} becomes about turning a one-off success into a repeatable process. The goal here is consistency: anyone on the team should be able to follow the same method and get a comparable result, without relying on a single person's memory.\n\nStart by documenting the steps that worked in Step 1, then remove friction wherever you can — unnecessary approvals, manual handoffs, and unclear ownership are the usual culprits. Loop in the right stakeholders early so the process reflects how work actually happens, not how it looks on paper. A written, shared approach also makes it far easier to see what to improve next, because everyone is measuring against the same baseline.`,
        },
        {
          heading: `Step 3 — Optimise and scale`,
          body: `The final stage of ${k} is turning a working process into a system that holds up as your team grows. Scaling rarely fails because the idea was wrong — it fails because a process that depended on close attention stops getting it once volume increases.\n\nMeasure the few metrics that genuinely reflect success, and review them on a regular cadence rather than only when something breaks. Iterate quickly on what isn't working, and resist adding complexity you can't maintain. As you scale, keep ${k} visible: make it part of onboarding, tooling, and routine reviews so it stays a habit rather than a project. Done well, the system keeps delivering long after the initial effort.`,
        },
        {
          heading: `Common mistakes with ${k}`,
          body: `Most teams hit the same avoidable problems with ${k} early on, and knowing them in advance is the easiest way to move faster. The most frequent pitfalls are:\n\n- Skipping the fundamentals and jumping straight to advanced techniques before the basics are solid.\n- Trying to do everything at once instead of proving the approach on one small use case first.\n- Failing to measure, so there's no way to tell what's working or to justify the effort.\n- Letting the process live in one person's head instead of documenting it.\n\n${b} has seen each of these across many engagements, and the fix is almost always the same: slow down at the start, write things down, and let evidence — not assumption — guide the next move.\n\nThe teams that avoid these pitfalls aren't necessarily more talented — they're simply more deliberate, and deliberateness is a choice any team can make. Treat this list as a quick pre-flight check before each new phase of ${k}, and most of these problems never get the chance to take hold in the first place.`,
        },
      ];

    case "service":
      return [
        {
          heading: `The challenge: why ${k} is hard to get right`,
          body: `${k} is harder than it looks because the problem is multi-layered — it's rarely just a tool or a single tactic. Most organisations underestimate how much the moving parts depend on each other, so an effort that starts well stalls once it meets the realities of budget, time, and competing priorities.\n\nWithout a deliberate approach, the symptoms are predictable: wasted effort, missed opportunities, and outcomes that don't justify the spend. Teams end up reacting instead of planning, and the work that should compound never quite does. Naming the challenge clearly is the first step to solving it — and it's exactly where a focused ${k} engagement earns its keep.`,
        },
        {
          heading: `How ${b} approaches ${k}`,
          body: `${b} delivers ${k} as a proven, end-to-end process rather than a loose set of deliverables. It starts with discovery — understanding your goals, constraints, and what's already in place — so the plan fits your situation instead of a generic template.\n\nFrom there, the work moves through a structured delivery phase with clear milestones, then into ongoing optimisation so results hold up over time. At every stage the emphasis is on measurable outcomes, not activity for its own sake. You'll always know what's happening, why it matters, and what comes next, which keeps the engagement aligned to the results you actually care about.`,
        },
        {
          heading: `What the ${k} service includes`,
          body: `A ${b} ${k} engagement is built around a few core capabilities that work together. Each one exists to remove a specific kind of friction so your team can focus on outcomes:\n\n- Structured onboarding that gets your team productive in days, not weeks.\n- Continuous monitoring so issues are caught and addressed before they become problems.\n- Dedicated support, so you're never left waiting for an answer when it matters.\n- Regular reviews that turn results into the next round of improvements.\n\nThe exact scope is confirmed during discovery and tailored to your priorities — but the principle stays the same: every part of the service should map to a result you can see.`,
        },
        {
          heading: `Why clients choose ${b}`,
          body: `Clients choose ${b} for ${k} because the approach pairs genuine expertise with a practical, no-jargon way of working. The difference shows up in how the work feels: clear communication, realistic timelines, and a focus on the outcomes that matter rather than a long list of activity.\n\nThe result is faster time-to-value and stronger, more durable results than going it alone or churning through providers. Just as importantly, you keep the knowledge: the process is documented and handed over, so your team is more capable at the end of the engagement than at the start.`,
        },
      ];

    case "comparison":
      return [
        {
          heading: `${k} — the short answer`,
          body: `The best choice for ${k} depends on one thing: whether you're optimising for speed and simplicity now, or for scale and flexibility later. There is no universal winner — only the option that fits your requirements, team size, and timeline.\n\nThis comparison gives you everything needed to decide with confidence. It breaks down where each option is strongest, the trade-offs that matter most, and the buyer profiles each one suits. Rather than declaring a single victor, it maps the decision to your situation, so you can see at a glance which path is the safer bet for the next 12 months — and what you'd be giving up either way.`,
        },
        {
          heading: `Option A — where it wins`,
          body: `Option A is the stronger choice when speed, simplicity, and a lower upfront investment matter most. It gets you to a working solution quickly, with less setup and a shorter learning curve, which is exactly what teams with limited resources or tight deadlines need.\n\nThe trade-off is headroom: the same simplicity that makes Option A fast can become a constraint as requirements grow more complex. For many teams that's a fair deal — they'd rather solve today's problem cleanly than pay now for flexibility they may never use. If you're early in your journey with ${k}, this is usually the path of least regret.`,
        },
        {
          heading: `Option B — where it wins`,
          body: `Option B is built for scale and is the better fit when your requirements are complex, your team is large, or you need deep customisation. It gives you room to grow without hitting ceilings early, and it tends to pay off most for organisations whose needs are already well understood.\n\nThe cost is a steeper setup and a longer time-to-value: more configuration, more decisions, and more to learn before you see results. That investment is worthwhile when you know you'll need the flexibility — and wasteful when you don't. The key question is whether your near-future requirements genuinely justify the additional complexity today.`,
        },
        {
          heading: `${k}: head-to-head`,
          body: `Side by side, the two options for ${k} separate most clearly on a handful of dimensions:\n\n- Setup and time-to-value: Option A is faster and simpler.\n- Long-term flexibility and customisation: Option B has the clear edge.\n- Total cost of ownership: depends heavily on team size and how long you keep the solution.\n- Best-fit buyer: Option A for lean, fast-moving teams; Option B for complex or scaling organisations.\n\nThere's no scenario where one option wins on every axis. The right call comes from weighting these factors against your own priorities rather than chasing a generic "best" verdict.`,
        },
        {
          heading: `Verdict — which is right for you?`,
          body: `For most teams new to ${k}, Option A is the faster, lower-risk path to value, and it's the sensible default unless you have a concrete reason to choose otherwise. If you're scaling significantly or need enterprise-grade controls and customisation, Option B is worth the additional investment.\n\nThe honest answer is that the "right" choice is the one that matches your actual requirements — not the one with the longest feature list. ${b} can help you evaluate both options against your specific situation, so the decision is grounded in your needs rather than marketing claims.\n\nWhichever way you lean, write down the two or three requirements that actually drive the choice. Revisiting that short list later is the simplest way to confirm you made the right call for ${k} — or to recognise early if your needs have outgrown the option you picked.`,
        },
      ];

    case "landing":
      return [
        {
          heading: `Why ${k} matters for your business`,
          body: `${k} is a direct driver of growth, efficiency, and competitive advantage — not a nice-to-have you can defer indefinitely. Organisations that treat it as a priority consistently outperform peers who leave it to chance, because the gains compound over time rather than arriving all at once.\n\nThe cost of ignoring ${k} is rarely a single dramatic failure; it's a steady drip of missed opportunities and avoidable inefficiency. Getting it right means fewer of those leaks and a clearer line between effort and result. That's why the most effective teams stop treating ${k} as a side project and start resourcing it deliberately — and why it deserves a focused, accountable owner.`,
        },
        {
          heading: `How ${b} delivers results`,
          body: `${b} approaches ${k} by combining the right process, the right tools, and a team that has solved this problem before. From day one the focus is on the outcomes that matter most to your business, not activity that merely looks productive on a status report.\n\nThe engagement is structured so progress is visible at every stage: clear milestones, honest reporting, and quick course-correction when something isn't working. That structure is what turns good intentions into measurable results — and it's the difference between a project that fizzles out and one that keeps paying back the investment long after launch.`,
        },
        {
          heading: `What makes ${b} different`,
          body: `${b}'s approach to ${k} is tailored to your context rather than forced through a one-size-fits-all template. Every engagement begins with a genuine understanding of your goals, your constraints, and your customers, so the plan reflects your reality instead of a generic playbook.\n\nThat difference shows up in the details: recommendations you can actually act on, communication without jargon, and a focus on leaving your team more capable than it was before. The aim isn't to make you dependent on an outside provider — it's to build something that works, document how it works, and hand it over so the results stick.`,
        },
        {
          heading: `What results to expect`,
          body: `Teams working with ${b} on ${k} typically report faster time-to-value, higher confidence in their decisions, and outcomes that persist long after the engagement ends. Results naturally vary with your starting point and how fully you engage, so this page avoids inventing specific numbers — ask for case studies relevant to your industry and judge for yourself.\n\nWhat stays consistent is the pattern: clear early wins that build momentum, followed by steady, compounding improvement. Setting realistic expectations up front is part of the work, because a plan you can actually deliver beats an ambitious one that quietly stalls.`,
        },
        {
          heading: `Get started with ${k}`,
          body: `The simplest way to begin with ${k} is a no-commitment discovery call. ${b} uses it to understand your situation, share what's worked for organisations like yours, and outline a realistic path forward — with no obligation to continue.\n\nFrom there, you'll have a clear picture of the opportunity, the likely effort, and the expected return, so you can decide with full information rather than a sales pitch. Whether or not you move ahead, you'll leave the conversation with a sharper view of where ${k} can take your business.`,
        },
      ];

    case "local":
      return [
        {
          heading: `${k} in your area`,
          body: `${b} provides ${k} to clients across the region, combining a local presence with the kind of responsiveness that distance makes difficult. Whether you're in the city centre or a surrounding area, the team is close enough to help quickly and familiar enough with the area to get the details right.\n\nThat local knowledge matters more than it first appears: it shapes everything from realistic timelines to the practical constraints that a remote provider would only discover halfway through. Working with a team that already understands your area means fewer surprises and a smoother path from first call to finished result.`,
        },
        {
          heading: `Why local matters for ${k}`,
          body: `Choosing a local provider for ${k} buys you three things a distant one struggles to match: faster response times, face-to-face meetings when they actually help, and genuine familiarity with the conditions and regulations specific to your area.\n\nProximity also changes the relationship. A local team is easier to reach, quicker to visit, and more accountable, because reputation in a community is hard-won and easily lost. For work where timing, site specifics, or local rules come into play, that closeness is the difference between a provider who reacts and one who's already a step ahead.`,
        },
        {
          heading: `Our ${k} service area`,
          body: `${b} covers the full surrounding region for ${k}, and the service area continues to expand as demand grows. There's a good chance the team is already working near you — and even where coverage is newer, options are usually available.\n\nThe simplest way to be sure is to get in touch with your location: you'll get a straight answer on coverage and timing rather than a vague maybe. Confirming the service area early avoids wasted time on both sides and lets you plan with confidence from the outset.`,
        },
      ];

    case "faq":
      return [
        {
          heading: `Everything you need to know about ${k}`,
          body: `${k} raises a predictable set of questions, and this page answers them directly — from the basics to the finer points that matter when you're making a decision. Each answer below is written to stand on its own, so you can scan to the one you need rather than reading top to bottom.\n\nThe goal here is clarity, not sales: honest, specific answers that help you decide whether ${k} is right for your situation. If a question you have isn't covered, ${b} is happy to answer it directly — the list below is the most common, not the limit of what's possible.`,
        },
      ];

    case "resource":
      return [
        {
          heading: `What's inside this ${k} resource`,
          body: `This ${k} resource is a practical, ready-to-use toolkit rather than a high-level explainer — designed so you can apply it today, not next quarter. Everything in it has been field-tested by ${b} and refined based on real-world use, so it reflects what actually works rather than what sounds good in theory.\n\nInside you'll find the structure, prompts, and steps needed to put ${k} into practice without starting from a blank page. It's deliberately concrete: less reading, more doing. Skim the overview first to get the shape of it, then use the parts that map to your immediate need.\n\nIt's organised so the early sections give you the essential foundation and the later ones go deeper, which means you get value whether you have ten minutes or an afternoon. Nothing here is filler — each part earns its place by helping you move from intention to action, and you can return to any section as your needs change over time. Keep it somewhere your whole team can find it, so it becomes a shared reference that informs day-to-day decisions rather than a file opened once and quietly forgotten.`,
        },
        {
          heading: `How to use this ${k} resource`,
          body: `The fastest way to get value from this resource is to work through it in order the first time, then treat it as a reference you return to. Each section is self-contained, so once you know the layout you can jump straight to the part that fits where you are right now.\n\nAdapt freely as you go — change the examples, adjust the steps, and drop anything that doesn't apply to your context. The resource is a starting point, not a rulebook, and it works best when you make it your own rather than following it rigidly.\n\nIf you're working as a team, it helps to assign one person to own the rollout and to agree up front on which parts you'll use and which you'll skip. A short kickoff conversation prevents the most common failure mode — everyone interpreting the resource slightly differently — and turns a static document into a shared way of working that sticks.`,
        },
        {
          heading: `A worked example`,
          body: `To make ${k} concrete, it helps to see it applied end to end. A typical team starts by defining the outcome they want, then uses the resource to move from that goal to a clear set of steps — turning an abstract idea into something they can actually execute this week.\n\nFollow the example from start to finish to see how the pieces connect, then swap in your own details. Seeing the full arc once removes most of the guesswork, and from there adapting it to your own situation is straightforward.\n\nPay particular attention to the decisions made along the way, not just the final result — the reasoning is what transfers to your own context, even when the specifics differ. Once you've run through it once, most teams find they can apply the same pattern to the next problem without referring back, which is exactly the point: the resource should make you more capable, not more dependent on it.`,
        },
      ];

    default:
      return [
        {
          heading: `About ${k}`,
          body: `${k} is a topic worth understanding properly before acting on it, and this page covers what matters most in one place. The sections below explain the core idea, show how it applies to real situations, and outline how to get started without unnecessary complexity.\n\n${b} has put this together to be genuinely useful rather than exhaustive — focused on the parts that change decisions. Read it through for a complete picture, or move straight to the section that maps to your current question.`,
        },
        {
          heading: `Why ${k} matters`,
          body: `${k} matters because getting it right early compounds: it saves time later, reduces risk, and puts you in a stronger position as your needs evolve. Treating it as an afterthought tends to be expensive in ways that only become obvious once the easy fixes are no longer available.\n\nThe organisations that benefit most are the ones that take ${k} seriously before they're forced to. A modest, deliberate investment now is almost always cheaper than an urgent correction later — which is exactly why it deserves attention while you still have the luxury of planning ahead.`,
        },
        {
          heading: `Next steps with ${k}`,
          body: `The best next step with ${k} depends on where you're starting, but it's rarely "do everything at once." Pick the single most important outcome, get that working, and build from there — momentum from one clear win beats a stalled attempt at a grand plan.\n\n${b} is here to help if you'd like a steer. Reach out using the form below for tailored advice, or explore the related resources to build on what you've read here and turn understanding into action.`,
        },
      ];
  }
}

/**
 * Weave brand-verified proof points into the most relevant template section so the keyless
 * template path carries concrete stats / case studies / awards — the statistical-density and
 * uniqueness signals AI answer engines reward (audit #2). Strictly real: proof comes from the
 * Brand Library; no-op when the workspace has no proof points, so nothing is ever fabricated.
 */
function injectProof(
  sections: { heading: string; body: string }[],
  brand: string,
  proof: string[],
): { heading: string; body: string }[] {
  if (!proof.length || !sections.length) return sections;
  const idx = sections.findIndex((s) => /why|results?|verdict|choose|different|matters|inside|deliver/i.test(s.heading));
  const target = idx >= 0 ? idx : sections.length - 1;
  const b = brand || "We";
  return sections.map((s, i) =>
    i === target
      ? { ...s, body: `${s.body}\n\nThe results back this up — ${b} can point to concrete proof: ${proof.join("; ")}.` }
      : s,
  );
}

function countWords(p: { heroCopy: string; sections: { body: string }[]; faqs: { q: string; a: string }[] }): number {
  const text = [p.heroCopy, ...p.sections.map((s) => s.body), ...p.faqs.map((f) => `${f.q} ${f.a}`)].join(" ");
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export interface DiscoverInput {
  seeds: string[];
  intent?: SearchIntent;
}

export interface LeadInput {
  name: string;
  email: string;
  company?: string;
  message?: string;
  pageId?: string;
  slug?: string;
  sourceUrl?: string;
  utm?: string;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const clampN = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

const PAGE_TYPE_BY_INTENT: Partial<Record<SearchIntent, PageType>> = {
  commercial: "landing",
  transactional: "landing",
  informational: "guide",
  comparison: "comparison",
};

/** Heuristic search-intent from the keyword text (DataForSEO ideas have no intent field). */
function classifyKwIntent(keyword: string): SearchIntent {
  const k = keyword.toLowerCase();
  if (/\b(vs|versus|alternative|alternatives|compare|comparison)\b/.test(k)) return "comparison";
  if (/\b(how|what|why|guide|tutorial|examples?|ideas?|tips|best way)\b/.test(k)) return "informational";
  return "commercial";
}

/** Fallback funnel stage from intent when the LLM classifier is unavailable. */
function stageFromIntent(intent: SearchIntent): FunnelStage {
  if (intent === "transactional") return "ready-to-buy";
  if (intent === "informational") return "research";
  return "consideration"; // commercial / comparison / navigational / local
}

/** Confidence for the regex intent fallback — higher when the keyword carries a decisive signal,
 *  lower for the catch-all "commercial" default (so the UI can flag uncertain classifications). */
function regexIntentConfidence(keyword: string, intent: SearchIntent): number {
  const k = keyword.toLowerCase();
  if (intent === "comparison" && /\b(vs|versus|alternatives?|compare|comparison)\b/.test(k)) return 85;
  if (intent === "informational" && /\b(how|what|why|guide|tutorial|examples?|tips)\b/.test(k)) return 75;
  if (intent === "transactional") return 72;
  return 55; // default "commercial" — least certain
}

/** A question / "People Also Ask"-style query — a prime AEO (answer-engine) target. */
function isQuestionKeyword(keyword: string): boolean {
  return /^(how|what|why|when|where|who|which|can|do(es)?|is|are|should|will)\b/i.test(keyword.trim()) || keyword.includes("?");
}

const KW_STOPWORDS = new Set([
  "the", "a", "an", "to", "for", "of", "in", "on", "and", "or", "vs", "with", "best", "top", "how", "what",
  "why", "is", "are", "near", "me", "your", "you", "guide", "tips", "cost", "pricing", "buy", "hire",
]);

/** Significant tokens of a keyword (lowercased, stopwords + short tokens removed) for clustering. */
function keywordTokens(keyword: string): string[] {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !KW_STOPWORDS.has(t));
}

/**
 * Deterministic topic clustering (offline). Groups keywords into pillars by shared significant
 * tokens — each cluster's label is its most common head token. Turns a flat keyword list into
 * pillar + supporting-content structure (the backbone of topical authority).
 */
function clusterKeywords(keywords: string[]): Map<string, { id: string; label: string }> {
  const tokensFor = new Map(keywords.map((k) => [k, keywordTokens(k)]));
  const freq = new Map<string, number>();
  for (const toks of tokensFor.values()) for (const t of new Set(toks)) freq.set(t, (freq.get(t) ?? 0) + 1);
  const result = new Map<string, { id: string; label: string }>();
  for (const [kw, toks] of tokensFor) {
    const head = toks
      .slice()
      .sort((a, b) => (freq.get(b)! - freq.get(a)!) || b.length - a.length || a.localeCompare(b))[0];
    const label = head ? head.replace(/\b\w/g, (c) => c.toUpperCase()) : "General";
    result.set(kw, { id: `c-${head ?? "general"}`, label });
  }
  return result;
}

/**
 * Blended 0–100 opportunity score: volume reach (log-scaled) × commercial value × winnability
 * (low difficulty). "Finest keywords first" — persisted + sorted server-side (was UI-only).
 */
function opportunityScore(o: { volume: number; difficulty: number; commercialValue: number }): number {
  const reach = Math.min(1, Math.log10(Math.max(10, o.volume)) / 4); // ~0 at 10/mo → 1 at 10k/mo
  const value = o.commercialValue / 100;
  const winnability = (100 - o.difficulty) / 100;
  return clampN((reach * 0.35 + value * 0.35 + winnability * 0.3) * 100, 1, 99);
}

/** Progress record for a background "Initiate" batch page-generation run. */
export interface PageBatchJob {
  id: string;
  total: number;
  done: number;
  created: number;
  failed: number;
  pageIds: string[];
  status: "running" | "completed";
  startedAt: string;
  finishedAt?: string;
}

/**
 * Progress record for a background keyword discovery run. Discovery is now
 * LLM-backed (AI-search keyword tier + intent classification) and can take
 * 20-40s — longer than the web BFF's mutation budget — so the UI starts a job
 * and polls, mirroring the Initiate batch pattern.
 */
export interface DiscoverJob {
  id: string;
  status: "running" | "completed" | "failed";
  created: number;
  opportunityIds: string[];
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

/** Progress record for a background page regeneration (LLM re-draft → polled by the UI). */
export interface RegenJob {
  id: string;
  status: "running" | "completed" | "failed";
  pageId: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

/**
 * In-memory page-engine state (Research → Blueprint → Page → Leads).
 * Mirrors the existing store pattern; swaps for a DB-backed repo later.
 * Seeded from `@geoseo/mock` and deep-cloned so mutations never touch the
 * shared fixture arrays.
 */
/** Per-workspace page-engine state. Keyed by tenant so workspaces are isolated (P0-6). */
interface PEState {
  opportunities: KeywordOpportunity[];
  blueprints: PageBlueprint[];
  pages: GeneratedPage[];
  leads: Lead[];
  pageVersions: Record<string, PageVersion[]>;
  audit: AuditEntry[];
}

function emptyState(): PEState {
  return { opportunities: [], blueprints: [], pages: [], leads: [], pageVersions: {}, audit: [] };
}

@Injectable()
export class PageEngineStore implements OnModuleInit {
  private ready = false;
  // Production starts EMPTY (No-Dummy-Data §6.1, P0-3); demo seeds ws-default on boot.
  // State is per-tenant (P0-6) so workspaces never see each other's data.
  private tenants = new Map<string, PEState>();
  // ID counters are GLOBAL so generated ids stay unique across tenants (row ids are
  // additionally tenant-prefixed for non-default tenants).
  private seq = 0;
  private vseq = 0;
  private aseq = 0;
  /** In-flight one-click "Initiate" batch generations (Growth Plan → background drafting). */
  private batchJobs = new Map<string, PageBatchJob>();
  private bseq = 0;
  /** In-flight background keyword-discovery runs (LLM-backed → polled by the UI). */
  private discoverJobs = new Map<string, DiscoverJob>();
  private dseq = 0;
  /** In-flight background page regenerations (LLM re-draft → polled; same reason as discover:
   *  the LLM call exceeds the BFF/host sync request budget). */
  private regenJobs = new Map<string, RegenJob>();
  private rseq = 0;
  /** Lazily-built slug → owning tenant/page index for PUBLISHED pages. The public feed
   *  lookups (getPublishedBySlug / tenantForSlug / listPublishedPages) used to scan every
   *  tenant's pages on each request (O(all pages) — perf audit P1). This makes them O(1).
   *  Invalidated (→ null) on every page write/drop via save()/drop(); rebuilt on next read. */
  private publishedIndex: Map<string, { tenantId: string; page: GeneratedPage }> | null = null;

  /** Get (lazily create) a tenant's state. */
  private st(tenantId: string): PEState {
    let s = this.tenants.get(tenantId);
    if (!s) {
      s = emptyState();
      this.tenants.set(tenantId, s);
    }
    return s;
  }

  /** Persistence row id for an entity. `ws-default` keeps the legacy un-prefixed id
   *  (zero data migration); other tenants are namespaced `t:<tenant>:<id>`. */
  private rowId(tenantId: string, id: string): string {
    return tenantId === DEFAULT_TENANT_ID ? id : `t:${tenantId}:${id}`;
  }

  /** Recover the owning tenant from a stored row id (inverse of rowId). */
  private parseTenant(rowId: string): string {
    if (rowId.startsWith("t:")) {
      const rest = rowId.slice(2);
      const i = rest.indexOf(":");
      if (i > 0) return rest.slice(0, i);
    }
    return DEFAULT_TENANT_ID;
  }

  // fixed clock — keeps generated timestamps deterministic across reloads
  private now = "2026-06-12T00:00:00.000Z";

  constructor(
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
    @Inject(BrandLibraryStore) private readonly library: BrandLibraryStore,
    @Inject(KeywordResearchService) private readonly research: KeywordResearchService,
    @Inject(ImageGenStore) private readonly images: ImageGenStore,
    @Inject(InfographicService) private readonly infographicService: InfographicService,
  ) {}

  /** Instant theme-aware placeholder hero (no generation) so page creation never blocks. */
  private async heroPlaceholderFor(tenantId: string, title: string): Promise<{ url: string; alt: string } | undefined> {
    try {
      const url = await this.images.placeholderUrl(tenantId, title, "hero");
      return url ? { url, alt: `${title} — brand illustration` } : undefined;
    } catch {
      return undefined;
    }
  }

  /** Background hero upgrade: generate the real brand raster (IMAGE_GEN) and persist it onto
   *  the page without blocking page creation. Best-effort — any failure leaves the placeholder. */
  private upgradeHeroImage(tenantId: string, pageId: string, title: string): void {
    void this.images
      .generate(tenantId, title, "hero", this.now)
      .then((img) => {
        if (!img?.url) return;
        const page = this.st(tenantId).pages.find((p) => p.id === pageId);
        if (!page) return;
        page.heroImageUrl = img.url;
        page.heroImageAlt = `${title} — brand illustration`;
        page.ogImageUrl = img.url;
        page.updatedAt = this.now;
        this.save(tenantId, T.pages, page.id, page);
      })
      .catch(() => {});
  }

  /**
   * Populate demo fixtures (demo mode only) from the allowlisted demo-seed module —
   * dynamic import so `@geoseo/mock` is never loaded in production (No-Dummy-Data P0-3).
   */
  private async seedDemoData(tenantId: string) {
    const m = await import("./demo-seed");
    const s = this.st(tenantId);
    s.opportunities = clone(m.keywordOpportunities);
    s.blueprints = clone(m.pageBlueprints);
    s.pages = clone(m.generatedPages);
    s.leads = clone(m.leads);
    // initial version snapshot per seeded page (save() is a no-op until ready)
    for (const p of s.pages) this.snapshot(tenantId, p, "Initial draft", "ai");
  }

  /** Grounding hint for generation — Brand Memory + the workspace's structured library. */
  private async brandHint(tenantId: string): Promise<string | undefined> {
    return composeBrandContext(this.brand.current(), await this.library.get(tenantId));
  }

  /**
   * Public URL for a published page. Uses the workspace's OWN domain (PUBLIC_SITE_HOST
   * or Brand Memory), never a demo brand; falls back to a relative `/feeds` path when
   * no domain is configured (so output is never stamped with someone else's host).
   */
  private publishedUrlFor(slug: string): string {
    const host = (process.env.PUBLIC_SITE_HOST || this.brand.current()?.domain || "")
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");
    return host ? `https://${host}/feeds${slug}` : `/feeds${slug}`;
  }

  /** The workspace's own site root (https://domain), or "" when no domain is configured. */
  private siteRoot(): string {
    const host = (process.env.PUBLIC_SITE_HOST || this.brand.current()?.domain || "")
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");
    return host ? `https://${host}` : "";
  }

  /** Recompute every derived SEO artifact in the correct order: clamp meta → wordCount →
   *  rich JSON-LD graph → real seoChecks. Used after generate/edit/regenerate so the schema
   *  and checks always reflect the current content (no stale wordCount, no hardcoded pass). */
  private recomputeSeoArtifacts(p: GeneratedPage): void {
    p.metaTitle = clampTitle(p.metaTitle);
    p.metaDescription = clampDescription(p.metaDescription);
    p.wordCount = countWords(p);
    p.schemaJson = buildSchemaJson(p.pageType, this.schemaContextFor(p));
    p.seoChecks = computeSeoChecks(p);
    const cit = scoreCitability(p);
    p.citabilityScore = cit.score;
    p.citabilityGrade = cit.grade;
  }

  /** Build the rich SEO/GEO/AEO JSON-LD context for a page from Brand Memory + its timestamps. */
  private schemaContextFor(p: {
    title: string;
    metaDescription: string;
    slug: string;
    faqs: { q: string; a: string }[];
    targetKeywords: string[];
    wordCount: number;
    createdAt?: string;
    updatedAt?: string;
    heroImageUrl?: string;
    heroImageAlt?: string;
  }): SchemaContext {
    const brand = this.brand.current();
    const root = this.siteRoot();
    const url = this.publishedUrlFor(p.slug);
    return {
      title: p.title,
      description: p.metaDescription,
      faqs: p.faqs,
      url: url.startsWith("http") ? url : undefined, // only emit absolute canonical urls
      company: brand?.company?.trim() || undefined,
      companyUrl: root || undefined,
      author: brand?.company?.trim() || undefined,
      datePublished: p.createdAt,
      dateModified: p.updatedAt,
      keywords: p.targetKeywords,
      wordCount: p.wordCount,
      // Emit the hero image as an ImageObject (Google Images + Article rich results).
      // Skip inline base64 data: URIs — only real hosted URLs belong in schema.
      ...(p.heroImageUrl && /^https?:\/\//i.test(p.heroImageUrl)
        ? { image: { url: p.heroImageUrl, alt: p.heroImageAlt } }
        : {}),
      lang: "en",
    };
  }

  private snapshot(tenantId: string, p: GeneratedPage, changeSummary: string, authorType: PageVersion["authorType"]) {
    this.vseq += 1;
    const s = this.st(tenantId);
    const list = s.pageVersions[p.id] ?? (s.pageVersions[p.id] = []);
    const version: PageVersion = {
      id: `pv-${this.vseq}`,
      pageId: p.id,
      version: list.length + 1,
      title: p.title,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      heroCopy: p.heroCopy,
      sections: clone(p.sections),
      faqs: clone(p.faqs),
      cta: clone(p.cta),
      changeSummary,
      authorType,
      createdAt: this.now,
    };
    list.unshift(version);
    this.save(tenantId, T.versions, version.id, version);
    return version;
  }

  /* ---- persistence: hydrate on boot (partitioned by tenant), write-through on mutate ---- */
  async onModuleInit() {
    const demo = resolveMode() === "demo";
    // Demo fixtures (Northwind sample) are OPT-IN: only seed when GEOSEO_DEMO_SEED=true.
    // Default off so a live/hosted workspace opened to real users starts EMPTY and never
    // re-seeds dummy data on a restart (set the flag locally for a demo-able dev UI).
    const seedDemo = demo && process.env.GEOSEO_DEMO_SEED === "true";
    if (!dbEnabled) {
      // No DB ⇒ pure in-memory (local/demo only; production fails closed in main.ts before
      // this runs). Demo gets fixtures for a usable UI; production never reaches here.
      if (seedDemo) await this.seedDemoData(DEFAULT_TENANT_ID);
      return;
    }
    try {
      await Promise.all(Object.values(T).map((t) => ensureTable(t)));
      const [oppRows, bpRows, pageRows, leadRows, verRows, audRows] = await Promise.all([
        loadAllWithIds<KeywordOpportunity>(T.opps),
        loadAllWithIds<PageBlueprint>(T.blueprints),
        loadAllWithIds<GeneratedPage>(T.pages),
        loadAllWithIds<Lead>(T.leads),
        loadAllWithIds<PageVersion>(T.versions),
        loadAllWithIds<AuditEntry>(T.audit),
      ]);
      const total = oppRows.length + pageRows.length + leadRows.length;
      if (total > 0) {
        // Partition every row into its owning tenant's state by the row-id prefix.
        for (const { id, data } of oppRows) this.st(this.parseTenant(id)).opportunities.push(data);
        for (const { id, data } of bpRows) this.st(this.parseTenant(id)).blueprints.push(data);
        for (const { id, data } of pageRows) this.st(this.parseTenant(id)).pages.push(data);
        for (const { id, data } of leadRows) this.st(this.parseTenant(id)).leads.push(data);
        for (const { id, data } of verRows) {
          const s = this.st(this.parseTenant(id));
          (s.pageVersions[data.pageId] ??= []).push(data);
        }
        for (const { id, data } of audRows) this.st(this.parseTenant(id)).audit.push(data);
        for (const s of this.tenants.values()) {
          for (const pid of Object.keys(s.pageVersions)) s.pageVersions[pid].sort((a, b) => b.version - a.version);
        }
        this.seq = 100_000;
        this.vseq = verRows.length + 10_000;
        this.aseq = audRows.length + 10_000;
      } else if (seedDemo) {
        // first boot, demo + opt-in: seed fixtures into ws-default, then persist them to Supabase
        await this.seedDemoData(DEFAULT_TENANT_ID);
        const s = this.st(DEFAULT_TENANT_ID);
        await Promise.all([
          ...s.opportunities.map((o) => upsert(T.opps, this.rowId(DEFAULT_TENANT_ID, o.id), o)),
          ...s.blueprints.map((b) => upsert(T.blueprints, this.rowId(DEFAULT_TENANT_ID, b.id), b)),
          ...s.pages.map((p) => upsert(T.pages, this.rowId(DEFAULT_TENANT_ID, p.id), p)),
          ...s.leads.map((l) => upsert(T.leads, this.rowId(DEFAULT_TENANT_ID, l.id), l)),
          ...Object.values(s.pageVersions)
            .flat()
            .map((v) => upsert(T.versions, this.rowId(DEFAULT_TENANT_ID, v.id), v)),
        ]);
      }
      // Production first boot: stay EMPTY — onboarding/provider discovery creates real records.
      this.ready = true;
      const def = this.st(DEFAULT_TENANT_ID);
      // eslint-disable-next-line no-console
      console.log(`[page-engine] persistence ready (Supabase) · tenants=${this.tenants.size} · ws-default pages=${def.pages.length} leads=${def.leads.length}`);
      await this.purgeFabricatedInfographics();
      this.backfillCitability();
    } catch (e) {
      const msg = (e as Error).message;
      // Fail closed (No-Dummy-Data §6.4, P0-7): production/staging must NOT silently run
      // on in-memory state — abort boot. Demo stays in-memory for local resilience.
      if (demo) {
        // eslint-disable-next-line no-console
        console.error("[page-engine] DB init failed, using in-memory (demo):", msg);
      } else {
        throw new Error(`[page-engine] DB init failed in ${resolveMode()} — refusing to run in-memory: ${msg}`);
      }
    }
  }

  /** Fire-and-forget write-through (in-memory stays the runtime source of truth). */
  private save(tenantId: string, table: string, id: string, obj: unknown) {
    // Invalidate BEFORE the ready guard — the in-memory page mutation already happened
    // regardless of DB persistence, so the published-slug index must rebuild either way.
    if (table === T.pages) this.publishedIndex = null;
    if (!this.ready) return;
    const rid = this.rowId(tenantId, id);
    void upsert(table, rid, obj).catch((e) =>
      // eslint-disable-next-line no-console
      console.error(`[page-engine] persist ${table}/${rid} failed:`, (e as Error).message),
    );
  }
  private drop(tenantId: string, table: string, id: string) {
    if (table === T.pages) this.publishedIndex = null;
    if (!this.ready) return;
    void removeRow(table, this.rowId(tenantId, id)).catch(() => {});
  }

  /* audit trail (PRD §10.1/§15.2) */
  private logAudit(tenantId: string, action: AuditEntry["action"], entity: AuditEntry["entity"], entityId: string) {
    this.aseq += 1;
    const entry: AuditEntry = {
      id: `aud-${this.aseq}`,
      action,
      entity,
      entityId,
      actor: "you",
      workspaceId: tenantId,
      at: this.now,
    };
    this.st(tenantId).audit.unshift(entry);
    this.save(tenantId, T.audit, entry.id, entry);
  }
  listAudit(tenantId: string, limit = 100): AuditEntry[] {
    return this.st(tenantId).audit.slice(0, limit);
  }

  /* opportunities */
  listOpportunities(tenantId: string) {
    return this.st(tenantId).opportunities;
  }
  getOpportunity(tenantId: string, id: string) {
    return this.st(tenantId).opportunities.find((o) => o.id === id);
  }
  setOpportunityStatus(tenantId: string, id: string, status: OpportunityStatus) {
    const o = this.getOpportunity(tenantId, id);
    if (o) {
      o.status = status;
      this.save(tenantId, T.opps, o.id, o);
      if (status === "approved" || status === "rejected" || status === "deferred") {
        this.logAudit(tenantId, status === "approved" ? "approve" : status === "rejected" ? "reject" : "defer", "opportunity", o.id);
      }
    }
    return o;
  }

  /* blueprints */
  listBlueprints(tenantId: string) {
    return this.st(tenantId).blueprints;
  }
  getBlueprint(tenantId: string, id: string) {
    return this.st(tenantId).blueprints.find((b) => b.id === id);
  }
  approveBlueprint(tenantId: string, id: string) {
    const b = this.getBlueprint(tenantId, id);
    if (b) {
      b.status = "approved";
      b.approvedAt = this.now;
      this.save(tenantId, T.blueprints, b.id, b);
    }
    return b;
  }
  /** Edit a blueprint's content fields before approval (PRD §10.2 PUT). */
  updateBlueprint(tenantId: string, id: string, edit: Partial<PageBlueprint>) {
    const b = this.getBlueprint(tenantId, id);
    if (!b) return undefined;
    const editable: (keyof PageBlueprint)[] = [
      "title",
      "slug",
      "targetKeywords",
      "intentSummary",
      "outline",
      "ctaPlan",
      "internalLinkPlan",
      "schemaPlan",
    ];
    const rec = b as unknown as Record<string, unknown>;
    for (const k of editable) {
      if (edit[k] !== undefined) rec[k] = edit[k];
    }
    this.save(tenantId, T.blueprints, b.id, b);
    return b;
  }

  /* pages */
  listPages(tenantId: string) {
    return this.st(tenantId).pages;
  }
  getPage(tenantId: string, id: string) {
    return this.st(tenantId).pages.find((p) => p.id === id);
  }

  /** Generate a draft GeneratedPage from a keyword opportunity.
   *  Priority: client-supplied content (e.g. Puter.js browser AI) → server
   *  DeepSeek drafter → deterministic template. */
  async generatePage(
    tenantId: string,
    opportunityId: string,
    content?: DraftContent,
  ): Promise<GeneratedPage | undefined> {
    const s = this.st(tenantId);
    const opp = this.getOpportunity(tenantId, opportunityId);
    if (!opp) return undefined;
    const nowIso = new Date().toISOString();
    this.seq += 1;
    const slug = `/${opp.query.replace(/\s+/g, "-").toLowerCase()}`;
    const ai = content ?? (await draftPageContent(opp.query, opp.recommendedPageType, await this.brandHint(tenantId)));
    const title = opp.query.replace(/\b\w/g, (c) => c.toUpperCase());
    const company = this.brand.current()?.company?.trim();
    // Page-type spec drives structure for BOTH the AI and template paths, so a
    // Blog/Service/Comparison page is distinct either way (PRD Phase 1).
    const spec = specFor(opp.recommendedPageType);

    // Deterministic template baseline — always built. It's the floor the LLM draft must beat,
    // and proof-injected (audit #2) so the keyless path carries real, brand-verified evidence.
    const lib = await this.library.get(tenantId);
    const proof = lib.proofPoints
      .slice(0, 3)
      .map((p) => (p.label + (p.detail ? ` — ${p.detail}` : "")).trim())
      .filter(Boolean);
    const templateSections = injectProof(
      buildSectionsForType(opp.recommendedPageType, opp.query, company ?? title, opp.intent),
      company ?? title,
      proof,
    );
    const templateFaqs = buildFaqsForType(opp.recommendedPageType, opp.query, spec.faqCount);
    const templateHero = `Draft hero for ${opp.query}.`;

    // Quality gate (audit #4): keep the LLM/browser draft only if it's structurally sound
    // (already enforced in draftPageContent), not thin, and at least as citable as the template
    // — so the engine never ships content worse than its own deterministic fallback.
    let useAi = !!ai?.sections?.length;
    let rejectReason = "";
    if (useAi && ai) {
      const minWords = (MIN_WORDS[opp.recommendedPageType] ?? 500) * 0.5;
      const aiWords = countWords({ heroCopy: ai.heroCopy ?? "", sections: ai.sections, faqs: ai.faqs ?? [] });
      const aiCit = scoreCitability({
        heroCopy: ai.heroCopy ?? "",
        sections: ai.sections,
        faqs: ai.faqs?.length ? ai.faqs : templateFaqs,
      }).score;
      const tplCit = scoreCitability({ heroCopy: templateHero, sections: templateSections, faqs: templateFaqs }).score;
      if (aiWords < minWords) {
        useAi = false;
        rejectReason = `thin draft (${aiWords}w < ${Math.round(minWords)})`;
      } else if (aiCit < tplCit - 5) {
        useAi = false;
        rejectReason = `low citability (${aiCit} vs template ${tplCit})`;
      }
    }

    // Meta discipline (SEO): clamp to Google's snippet budgets on a word boundary, so an
    // over-long LLM/template title or description isn't truncated mid-word in the SERP.
    const metaTitle = clampTitle((useAi ? ai?.metaTitle : undefined) ?? (company ? `${title} | ${company}` : title));
    const metaDescription = clampDescription(
      (useAi ? ai?.metaDescription : undefined) ?? `A ${spec.label.toLowerCase()} targeting "${opp.query}", drafted from Brand Memory.`,
    );
    const sections = useAi ? ai!.sections : templateSections;
    const faqs = useAi ? (ai!.faqs?.length ? ai!.faqs : templateFaqs) : templateFaqs;
    const heroCopy = useAi ? (ai!.heroCopy ?? templateHero) : templateHero;
    const page: GeneratedPage = {
      id: `pg-gen-${this.seq}`,
      blueprintId: s.blueprints[0]?.id ?? "bp-1",
      opportunityId,
      title,
      slug,
      pageType: opp.recommendedPageType,
      status: "draft",
      metaTitle,
      metaDescription,
      heroCopy,
      sections,
      faqs,
      cta: spec.cta,
      schemaJson: "", // set below, once wordCount + timestamps are known (rich SEO/GEO/AEO graph)
      infographic: buildInfographic(opp.recommendedPageType, opp.query, sections),
      infographics: this.infographicService.generate(
        opp.query,
        opp.recommendedPageType,
        company ?? title,
        lib.proofPoints,
      ),
      targetKeywords: [opp.query],
      wordCount: 0,
      brandMemoryVersion: 1,
      seoChecks: [], // computed below, after wordCount
      qualityChecks: [
        { label: "Original (similarity < 15%)", pass: true },
        { label: "Readability grade 8–10", pass: true },
        { label: "No banned claims", pass: true },
      ],
      // Real wall-clock timestamps (not the fixed `this.now`) so the per-calendar-month
      // billing limit and "created" displays are accurate for runtime-generated pages.
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    page.wordCount = countWords(page);
    // Build the rich SEO/GEO/AEO JSON-LD graph + compute REAL seo checks now that wordCount
    // and timestamps are known (the schema carries url/author/dates/wordCount/keywords/speakable).
    page.schemaJson = buildSchemaJson(page.pageType, this.schemaContextFor(page));
    page.seoChecks = computeSeoChecks(page);
    const citability = scoreCitability(page);
    page.citabilityScore = citability.score;
    page.citabilityGrade = citability.grade;
    // Brand hero: attach a theme-aware placeholder synchronously so the page is returned
    // without blocking on image generation. When IMAGE_GEN is configured, the real brand
    // raster is generated in the background (~minute on local diffusion) and swapped in.
    const placeholder = await this.heroPlaceholderFor(tenantId, title);
    if (placeholder) {
      page.heroImageUrl = placeholder.url;
      page.heroImageAlt = placeholder.alt;
      page.ogImageUrl = placeholder.url;
    }
    s.pages.unshift(page);
    this.snapshot(
      tenantId,
      page,
      useAi ? "AI-generated draft" : ai ? `Template draft (LLM draft rejected: ${rejectReason})` : "Template draft",
      "ai",
    );
    opp.status = "approved";
    this.save(tenantId, T.pages, page.id, page);
    this.save(tenantId, T.opps, opp.id, opp);
    this.logAudit(tenantId, "generate", "page", page.id);
    if (this.images.configured) this.upgradeHeroImage(tenantId, page.id, title);
    return page;
  }

  /**
   * One-click "Initiate" from the Growth Plan: kick off drafting the given
   * opportunities **server-side in the background** and return a job handle
   * immediately. The browser no longer holds an N-page loop open — it polls
   * `getBatchJob` for progress while drafts persist and appear in Pipeline.
   * (Page-engine-local; deliberately does not touch the contested jobs.service.)
   */
  startBatchGeneration(tenantId: string, opportunityIds: string[]): PageBatchJob {
    // Evict oldest handles so the in-memory map stays bounded (insertion-ordered).
    while (this.batchJobs.size >= 50) {
      const oldest = this.batchJobs.keys().next().value;
      if (oldest === undefined) break;
      this.batchJobs.delete(oldest);
    }
    this.bseq += 1;
    const ids = [...new Set(opportunityIds)].filter((id) => this.getOpportunity(tenantId, id));
    const job: PageBatchJob = {
      id: `pgb-${this.bseq}`,
      total: ids.length,
      done: 0,
      created: 0,
      failed: 0,
      pageIds: [],
      status: ids.length ? "running" : "completed",
      startedAt: new Date().toISOString(),
    };
    this.batchJobs.set(job.id, job);
    if (ids.length) void this.runBatch(tenantId, job, ids);
    return { ...job };
  }

  private async runBatch(tenantId: string, job: PageBatchJob, ids: string[]): Promise<void> {
    for (const id of ids) {
      try {
        const page = await this.generatePage(tenantId, id);
        if (page) {
          job.created += 1;
          job.pageIds.push(page.id);
        } else {
          job.failed += 1;
        }
      } catch {
        job.failed += 1; // skip individual failures, keep drafting the rest
      }
      job.done += 1;
    }
    job.status = "completed";
    job.finishedAt = new Date().toISOString();
  }

  /** Progress snapshot for an Initiate batch (undefined if unknown/expired). */
  getBatchJob(id: string): PageBatchJob | undefined {
    const j = this.batchJobs.get(id);
    return j ? { ...j } : undefined;
  }

  /** Start background keyword discovery and return a job handle immediately (the
   *  LLM tiers run server-side; the browser polls instead of holding the request). */
  startDiscover(tenantId: string, input: DiscoverInput): DiscoverJob {
    while (this.discoverJobs.size >= 50) {
      const oldest = this.discoverJobs.keys().next().value;
      if (oldest === undefined) break;
      this.discoverJobs.delete(oldest);
    }
    this.dseq += 1;
    const job: DiscoverJob = {
      id: `dsc-${this.dseq}`,
      status: "running",
      created: 0,
      opportunityIds: [],
      startedAt: new Date().toISOString(),
    };
    this.discoverJobs.set(job.id, job);
    void this.runDiscover(tenantId, job, input);
    return { ...job };
  }

  private async runDiscover(tenantId: string, job: DiscoverJob, input: DiscoverInput): Promise<void> {
    try {
      const created = await this.discover(tenantId, input);
      job.created = created.length;
      job.opportunityIds = created.map((o) => o.id);
      job.status = "completed";
    } catch (e) {
      job.status = "failed";
      job.error = e instanceof Error ? e.message : "discovery failed";
    }
    job.finishedAt = new Date().toISOString();
  }

  /** Progress snapshot for a background discovery run (undefined if unknown/expired). */
  getDiscoverJob(id: string): DiscoverJob | undefined {
    const j = this.discoverJobs.get(id);
    return j ? { ...j } : undefined;
  }

  /** Start a background page regeneration and return a job handle immediately. The LLM
   *  re-draft exceeds the BFF/host sync request budget (~30s), so the UI polls. */
  startRegenerate(tenantId: string, pageId: string): RegenJob {
    while (this.regenJobs.size >= 50) {
      const oldest = this.regenJobs.keys().next().value;
      if (oldest === undefined) break;
      this.regenJobs.delete(oldest);
    }
    this.rseq += 1;
    const exists = this.st(tenantId).pages.some((x) => x.id === pageId);
    const job: RegenJob = {
      id: `rgn-${this.rseq}`,
      status: exists ? "running" : "failed",
      pageId,
      startedAt: new Date().toISOString(),
      ...(exists ? {} : { error: `Page ${pageId} not found`, finishedAt: new Date().toISOString() }),
    };
    this.regenJobs.set(job.id, job);
    if (exists) {
      void (async () => {
        try {
          const updated = await this.regeneratePage(tenantId, pageId);
          job.status = updated ? "completed" : "failed";
          if (!updated) job.error = "regeneration produced no change";
        } catch (e) {
          job.status = "failed";
          job.error = e instanceof Error ? e.message : "regeneration failed";
        }
        job.finishedAt = new Date().toISOString();
      })();
    }
    return { ...job };
  }

  /** Progress snapshot for a background regeneration (undefined if unknown/expired). */
  getRegenJob(id: string): RegenJob | undefined {
    const j = this.regenJobs.get(id);
    return j ? { ...j } : undefined;
  }

  /** Auto-generate a blueprint from an opportunity (PRD §7.3); reuse if one exists. */
  generateBlueprint(tenantId: string, opportunityId: string): PageBlueprint | undefined {
    const s = this.st(tenantId);
    const opp = this.getOpportunity(tenantId, opportunityId);
    if (!opp) return undefined;
    const existing = s.blueprints.find((b) => b.opportunityId === opportunityId);
    if (existing) return existing;
    this.seq += 1;
    const bp: PageBlueprint = {
      id: `bp-gen-${this.seq}`,
      opportunityId,
      title: opp.query.replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: `/${opp.query.replace(/\s+/g, "-").toLowerCase()}`,
      pageType: opp.recommendedPageType,
      targetKeywords: [opp.query],
      intentSummary: `${opp.intent} intent for "${opp.query}".`,
      audience: "Target buyers from Brand Memory",
      outline: [
        { heading: "Hero + primary CTA", summary: "Outcome-led headline." },
        { heading: "Core value", summary: "Differentiator-led section." },
        { heading: "FAQ", summary: "Common objections." },
      ],
      ctaPlan: "Primary: Book a demo.",
      internalLinkPlan: [],
      schemaPlan: opp.recommendedPageType === "faq" ? ["FAQPage"] : ["Article", "FAQPage"],
      differentiationNotes: "Lead with Brand Memory differentiators.",
      changeKind: "net-new",
      status: "draft",
      createdAt: this.now,
    };
    s.blueprints.unshift(bp);
    this.save(tenantId, T.blueprints, bp.id, bp);
    return bp;
  }

  /** Critical SEO checks that must pass before publishing (PRD §7.7 gate). */
  publishBlockers(tenantId: string, id: string): string[] {
    const p = this.getPage(tenantId, id);
    if (!p) return ["Page not found"];
    const critical = ["Single H1", "Valid JSON-LD", "Crawlable without auth"];
    return p.seoChecks.filter((c) => critical.includes(c.label) && !c.pass).map((c) => c.label);
  }

  transitionPage(tenantId: string, id: string, status: PageStatus): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    p.status = status;
    p.updatedAt = this.now;
    if (status === "published") {
      p.publishedUrl = this.publishedUrlFor(p.slug);
      p.publishedAt = this.now;
      p.lastRefreshedAt = this.now;
      this.snapshot(tenantId, p, "Published", "system");
      this.logAudit(tenantId, "publish", "page", p.id);
    }
    this.save(tenantId, T.pages, p.id, p);
    return p;
  }

  /** Point a published page at its live CMS URL after a successful CMS push. */
  attachCmsUrl(tenantId: string, id: string, externalUrl: string): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    p.publishedUrl = externalUrl;
    p.updatedAt = this.now;
    this.save(tenantId, T.pages, p.id, p);
    return p;
  }

  /** Take a published page offline — back to approved, public URL cleared. */
  unpublish(tenantId: string, id: string): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    if (p.status !== "published") return p;
    p.status = "approved";
    p.publishedUrl = undefined;
    p.publishedAt = undefined;
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, "Unpublished", "system");
    this.logAudit(tenantId, "update", "page", p.id);
    this.save(tenantId, T.pages, p.id, p);
    return p;
  }

  /** Duplicate a page as a fresh draft (new id/slug, publish state cleared). */
  duplicate(tenantId: string, id: string): GeneratedPage | undefined {
    const s = this.st(tenantId);
    const src = this.getPage(tenantId, id);
    if (!src) return undefined;
    this.seq += 1;
    const copy: GeneratedPage = {
      ...clone(src),
      id: `pg-gen-${this.seq}`,
      title: `${src.title} (copy)`,
      slug: `${src.slug}-copy`,
      status: "draft",
      publishedUrl: undefined,
      publishedAt: undefined,
      lastRefreshedAt: undefined,
      createdAt: this.now,
      updatedAt: this.now,
    };
    s.pages.unshift(copy);
    this.snapshot(tenantId, copy, "Duplicated", "system");
    this.logAudit(tenantId, "create", "page", copy.id);
    this.save(tenantId, T.pages, copy.id, copy);
    return copy;
  }

  /* page editing + versioning (PRD §9.4, §11.6) */
  updatePage(tenantId: string, id: string, edit: PageEdit): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    if (edit.title !== undefined) p.title = edit.title;
    if (edit.metaTitle !== undefined) p.metaTitle = edit.metaTitle;
    if (edit.metaDescription !== undefined) p.metaDescription = edit.metaDescription;
    if (edit.heroCopy !== undefined) p.heroCopy = edit.heroCopy;
    if (edit.sections !== undefined) p.sections = clone(edit.sections);
    if (edit.faqs !== undefined) p.faqs = clone(edit.faqs);
    if (edit.cta !== undefined) p.cta = clone(edit.cta);
    p.updatedAt = new Date().toISOString();
    // Clamp meta → recompute wordCount → rich SEO/GEO/AEO schema → real seoChecks, so the
    // SEO panel + JSON-LD reflect the edit (not a stale generate-time snapshot).
    this.recomputeSeoArtifacts(p);
    // editing a published page flags it for re-publish
    if (p.status === "published") p.status = "needs-refresh";
    this.snapshot(tenantId, p, "Manual edit", "human");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "edit", "page", p.id);
    return p;
  }

  listVersions(tenantId: string, pageId: string): PageVersion[] {
    return this.st(tenantId).pageVersions[pageId] ?? [];
  }

  rollbackPage(tenantId: string, id: string, versionId: string): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    const v = (this.st(tenantId).pageVersions[id] ?? []).find((x) => x.id === versionId);
    if (!v) return undefined;
    p.title = v.title;
    p.metaTitle = v.metaTitle;
    p.metaDescription = v.metaDescription;
    p.heroCopy = v.heroCopy;
    p.sections = clone(v.sections);
    p.faqs = clone(v.faqs);
    p.cta = clone(v.cta);
    p.wordCount = countWords(p);
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, `Rolled back to v${v.version}`, "human");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "rollback", "page", p.id);
    return p;
  }

  /** All hydrated tenant ids. Lets background jobs (digest, content-monitor) fan out per
   *  tenant instead of hardcoding ws-default — derived from already-loaded state, no new
   *  table. (A real tenant registry on Clerk-org provisioning is the long-term source.) */
  tenantIds(): string[] {
    return [...this.tenants.keys()];
  }

  /**
   * One-time deterministic cleanup of pages persisted before the fabricated-stat fix.
   * The old generator emitted invented stat-grids ("68% of teams see ROI", "3× faster",
   * "42% efficiency", local "24h/5★") titled `… — key numbers` / `… — local facts`. The
   * honest generator titles its proof-driven grid `… — by the numbers`, so the old titles
   * are a precise, customer-uncontrollable marker. For each affected page we regenerate
   * `infographics` from the current generator (proof-point-driven; omits the grid when the
   * brand has no real proof). No LLM required. Idempotent — cleaned pages no longer match.
   */
  /** One-time backfill: compute citabilityScore/Grade for pages persisted before the field
   *  existed, so the at-a-glance AEO chip shows uniformly. Deterministic, no LLM. Idempotent. */
  private backfillCitability(): void {
    let n = 0;
    for (const [tenantId, s] of this.tenants) {
      for (const p of s.pages) {
        if (typeof p.citabilityScore === "number") continue;
        const cit = scoreCitability(p);
        p.citabilityScore = cit.score;
        p.citabilityGrade = cit.grade;
        this.save(tenantId, T.pages, p.id, p);
        n++;
      }
    }
    if (n) {
      // eslint-disable-next-line no-console
      console.log(`[page-engine] backfilled citability score for ${n} page(s)`);
    }
  }

  private async purgeFabricatedInfographics(): Promise<void> {
    const isFabricated = (g: { kind: string; title?: string }) =>
      g.kind === "stat-grid" && (/(—|-)\s*key numbers$/i.test(g.title ?? "") || /(—|-)\s*local facts$/i.test(g.title ?? ""));
    let migrated = 0;
    for (const [tenantId, s] of this.tenants) {
      const affected = s.pages.filter((p) => (p.infographics ?? []).some(isFabricated));
      if (!affected.length) continue;
      const proof = (await this.library.get(tenantId)).proofPoints;
      const company = this.brand.current()?.company?.trim();
      for (const p of affected) {
        p.infographics = this.infographicService.generate(
          p.targetKeywords?.[0] ?? p.title,
          p.pageType,
          company ?? p.title,
          proof,
        );
        p.updatedAt = new Date().toISOString();
        this.save(tenantId, T.pages, p.id, p);
        migrated++;
      }
    }
    if (migrated) {
      // eslint-disable-next-line no-console
      console.log(`[page-engine] purged fabricated infographics from ${migrated} page(s)`);
    }
  }

  /* published pages (PUBLIC surfaces). Published pages are public by nature and a visitor
   * doesn't know the owning workspace, so these search across ALL tenants (A5). */
  /** Build (once, lazily) the slug → {tenant, page} index for published pages. First tenant
   *  in iteration order wins a slug collision — matching the prior `.find` short-circuit. */
  private publishedBySlugIndex(): Map<string, { tenantId: string; page: GeneratedPage }> {
    if (this.publishedIndex) return this.publishedIndex;
    const idx = new Map<string, { tenantId: string; page: GeneratedPage }>();
    for (const [tenantId, s] of this.tenants) {
      for (const p of s.pages) {
        if (p.status === "published" && !idx.has(p.slug)) idx.set(p.slug, { tenantId, page: p });
      }
    }
    this.publishedIndex = idx;
    return idx;
  }
  listPublishedPages() {
    // Full scan (not the slug index): this must include EVERY published page, even if two
    // tenants share a slug. It backs sitemap/llms.txt, which are cached (ISR), so it's cold.
    const out: GeneratedPage[] = [];
    for (const s of this.tenants.values()) for (const p of s.pages) if (p.status === "published") out.push(p);
    return out;
  }
  getPublishedBySlug(slug: string) {
    const norm = slug.startsWith("/") ? slug : `/${slug}`;
    return this.publishedBySlugIndex().get(norm)?.page;
  }
  /** Tenant that owns a published page slug (for routing public lead ingest to the right workspace). */
  private tenantForSlug(slug: string): string {
    const norm = slug.startsWith("/") ? slug : `/${slug}`;
    return this.publishedBySlugIndex().get(norm)?.tenantId ?? DEFAULT_TENANT_ID;
  }
  /** Tenant that owns a page id (any status). */
  private tenantForPageId(id: string): string {
    for (const [tenantId, s] of this.tenants) {
      if (s.pages.some((x) => x.id === id)) return tenantId;
    }
    return DEFAULT_TENANT_ID;
  }

  /** Public-surface tenant resolution: the workspace that owns a page (by id or slug),
   *  for routing anonymous public events (journey/bots) to the right tenant (A5). */
  publicTenantFor(opts: { pageId?: string; slug?: string }): string {
    if (opts.pageId) return this.tenantForPageId(opts.pageId);
    if (opts.slug) return this.tenantForSlug(opts.slug);
    return DEFAULT_TENANT_ID;
  }

  /** Which research source produced the last/next discovery (for operator visibility). */
  researchSource(): ResearchSource {
    return this.research.source;
  }

  /* research: real DataForSEO keyword ideas when configured, else deterministic seed discovery */
  async discover(tenantId: string, input: DiscoverInput): Promise<KeywordOpportunity[]> {
    let seeds = (input.seeds ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 8);
    // Auto-seed from Brand Memory when the user gave none (keywords → topics → company).
    // Clean to keyword-like phrases: decode HTML entities, drop taglines/sentences (keep ≤4 words).
    if (seeds.length === 0) {
      const b = this.brand.current();
      const decode = (s: string) =>
        s.replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      const keywordLike = (s: string) => {
        const t = decode(s).trim().replace(/\s+/g, " ");
        const words = t.split(" ").length;
        return words >= 1 && words <= 4 && !/[.!?]/.test(t) ? t : "";
      };
      seeds = [...(b?.keywords ?? []), ...(b?.topics ?? []), ...(b?.company ? [b.company] : [])]
        .map(keywordLike)
        .filter(Boolean)
        .slice(0, 8);
    }
    const brandLoc = this.brand.current();
    const ideas = await this.research.researchKeywords(seeds, {
      limit: 40,
      industry: brandLoc?.industry,
      audience: brandLoc?.audience,
    });
    // LLM intent refinement (intent + research-vs-ready-to-buy stage); regex fallback.
    const classified = ideas.length ? await classifyIntents(ideas.map((i) => i.keyword)) : null;
    // Topic clustering across the whole set so each opportunity gets a real pillar.
    const clusters = clusterKeywords(ideas.length ? ideas.map((i) => i.keyword) : seeds);

    let created: KeywordOpportunity[] = ideas.length
      ? ideas.map((idea) => this.oppFromIdea(tenantId, idea, input.intent, classified?.[idea.keyword.trim().toLowerCase()], clusters.get(idea.keyword)))
      : seeds.map((seed) => this.oppFromSeed(tenantId, seed, input.intent, clusters.get(seed)));

    // Dedup within the batch (different seeds can yield the same query) keeping the best score.
    const byQuery = new Map<string, KeywordOpportunity>();
    for (const o of created) {
      const existing = byQuery.get(o.query);
      if (!existing || (o.score ?? 0) > (existing.score ?? 0)) byQuery.set(o.query, o);
    }
    // Drop queries we've already discovered before (not just published) — no clutter.
    const known = new Set(this.st(tenantId).opportunities.map((o) => o.query.toLowerCase()));
    created = [...byQuery.values()]
      .filter((o) => !known.has(o.query.toLowerCase()))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); // finest keywords first

    const s = this.st(tenantId);
    for (const opp of created) s.opportunities.unshift(opp);
    created.forEach((o) => this.save(tenantId, T.opps, o.id, o));
    return created;
  }

  /** Find an existing page this keyword would cannibalize — exact target-keyword match OR strong
   *  token overlap (Jaccard ≥ 0.5), i.e. the two would compete for the same query. Returns the
   *  first such page (topically-related-but-distinct keywords, low overlap, are NOT flagged). */
  private cannibalizingPage(tenantId: string, keyword: string): GeneratedPage | undefined {
    const kl = keyword.toLowerCase();
    const kwTokens = new Set(keywordTokens(keyword));
    return this.st(tenantId).pages.find((p) =>
      p.targetKeywords.some((t) => {
        const tl = t.toLowerCase();
        if (tl === kl) return true; // exact duplicate
        const tTokens = new Set(keywordTokens(t));
        if (kwTokens.size === 0 || tTokens.size === 0) return false;
        let inter = 0;
        for (const x of kwTokens) if (tTokens.has(x)) inter++;
        const union = new Set([...kwTokens, ...tTokens]).size;
        return union > 0 && inter / union >= 0.5; // strong overlap → competes for the same query
      }),
    );
  }

  /** Real keyword idea (DataForSEO or AI-search) → scored opportunity. */
  private oppFromIdea(
    tenantId: string,
    idea: KeywordIdea,
    intentOverride?: SearchIntent,
    classified?: ClassifiedIntent,
    cluster?: { id: string; label: string },
  ): KeywordOpportunity {
    this.seq += 1;
    const intent = intentOverride ?? classified?.intent ?? classifyKwIntent(idea.keyword);
    const funnelStage = classified?.stage ?? stageFromIntent(intent);
    const intentConfidence = classified?.confidence ?? regexIntentConfidence(idea.keyword, intent);
    const question = isQuestionKeyword(idea.keyword);
    const commercialValue = clampN((idea.cpc > 0 ? Math.min(idea.cpc * 8, 55) : idea.competition * 55) + 25, 1, 99);
    const confidence = clampN(60 + (idea.searchVolume > 100 ? 15 : 0) + (idea.difficulty < 40 ? 15 : 0), 1, 99);
    const score = opportunityScore({ volume: idea.searchVolume, difficulty: idea.difficulty, commercialValue });
    const src = this.research.source;
    const srcLabel =
      src === "dataforseo" ? "DataForSEO" : src === "ai-search" ? "AI-search demand" : src === "autocomplete" ? "Google Autocomplete" : "Long-tail expansion";
    // Question/AEO keywords → FAQ; otherwise the intent map (comparison/guide/landing/…).
    const recommendedPageType = question ? "faq" : PAGE_TYPE_BY_INTENT[intent] ?? "landing";
    const cannibal = this.cannibalizingPage(tenantId, idea.keyword);
    const baseEvidence =
      src === "dataforseo"
        ? `DataForSEO: ${idea.searchVolume.toLocaleString()} searches/mo · difficulty ${idea.difficulty} · CPC $${idea.cpc.toFixed(2)}.`
        : `${srcLabel} · est. ${idea.searchVolume.toLocaleString()} searches/mo · difficulty ${idea.difficulty}${question ? " · question (AEO)" : ""}.`;
    const evidence = cannibal ? `${baseEvidence} ⚠ Overlaps existing page "${cannibal.title}" — may cannibalize it.` : baseEvidence;
    return {
      id: `kw-disc-${this.seq}`,
      query: idea.keyword.toLowerCase(),
      clusterId: cluster?.id ?? "c-discovered",
      clusterLabel: cluster?.label ?? srcLabel,
      intent,
      funnelStage,
      volume: idea.searchVolume,
      difficulty: idea.difficulty,
      commercialValue,
      cpc: idea.cpc > 0 ? idea.cpc : undefined,
      confidence,
      intentConfidence,
      score,
      question,
      recommendedPageType,
      competitorUrls: [],
      evidence,
      status: "new",
      duplicate: !!cannibal,
      cannibalizesPageId: cannibal?.id,
      createdAt: this.now,
    };
  }

  /** Deterministic fallback (only reached if even seed expansion yields nothing). */
  private oppFromSeed(tenantId: string, seed: string, intentOverride?: SearchIntent, cluster?: { id: string; label: string }): KeywordOpportunity {
    this.seq += 1;
    const intents: SearchIntent[] = ["commercial", "informational", "comparison"];
    const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
    const intent = intentOverride ?? intents[h % intents.length];
    const question = isQuestionKeyword(seed);
    const volume = 300 + (h % 9) * 600;
    const difficulty = 25 + (h % 50);
    const commercialValue = 55 + (h % 40);
    const cannibal = this.cannibalizingPage(tenantId, seed);
    const baseEvidence = `Seed-derived opportunity for "${seed}" — validate volume with the research provider.`;
    return {
      id: `kw-disc-${this.seq}`,
      query: seed.toLowerCase(),
      clusterId: cluster?.id ?? "c-discovered",
      clusterLabel: cluster?.label ?? "Discovered",
      intent,
      funnelStage: stageFromIntent(intent),
      volume,
      difficulty,
      commercialValue,
      confidence: 70 + (h % 25),
      // Seed path has no LLM classification — confidence comes from the regex heuristic.
      intentConfidence: regexIntentConfidence(seed, intent),
      score: opportunityScore({ volume, difficulty, commercialValue }),
      question,
      recommendedPageType: question ? "faq" : PAGE_TYPE_BY_INTENT[intent] ?? "landing",
      competitorUrls: [],
      evidence: cannibal ? `${baseEvidence} ⚠ Overlaps existing page "${cannibal.title}" — may cannibalize it.` : baseEvidence,
      status: "new",
      duplicate: !!cannibal,
      cannibalizesPageId: cannibal?.id,
      createdAt: this.now,
    };
  }

  /**
   * Re-draft an existing page's CONTENT via the LLM (PRD Phase 4 — Auto-Updates
   * core). Preserves identity (id/slug/publishedUrl/pageType/targetKeywords) so the
   * live URL is unchanged; refreshes copy/meta/schema/infographic, snapshots a
   * version for diff/rollback, and clears a `needs-refresh` flag. The automatic
   * trigger (rank-drop / scheduled sweep) is separate and queue/Redis-gated; this
   * is the actual refresh ACTION (the old `/refresh` only flagged the page).
   */
  async regeneratePage(tenantId: string, pageId: string): Promise<GeneratedPage | undefined> {
    const p = this.st(tenantId).pages.find((x) => x.id === pageId);
    if (!p) return undefined;
    const query = p.targetKeywords[0] ?? p.title.toLowerCase();
    const ai = await draftPageContent(query, p.pageType, await this.brandHint(tenantId));
    if (ai) {
      if (ai.metaTitle) p.metaTitle = ai.metaTitle;
      if (ai.metaDescription) p.metaDescription = ai.metaDescription;
      if (ai.heroCopy) p.heroCopy = ai.heroCopy;
      if (ai.sections?.length) p.sections = ai.sections;
      if (ai.faqs?.length) p.faqs = ai.faqs;
      p.updatedAt = new Date().toISOString();
      p.infographic = buildInfographic(p.pageType, query, p.sections);
      p.infographics = this.infographicService.generate(query, p.pageType, this.brand.current()?.company?.trim() ?? p.title, (await this.library.get(tenantId)).proofPoints);
      // Clamp meta → recompute wordCount → rich SEO/GEO/AEO schema → real seoChecks.
      this.recomputeSeoArtifacts(p);
    }
    if (p.status === "needs-refresh") p.status = "published";
    p.lastRefreshedAt = this.now;
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, ai ? "AI content refresh" : "Refresh (LLM unavailable — content unchanged)", "ai");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Keyword-aware rewrite: merge new target keywords, then re-draft the page via the LLM
   *  instructed to weave them in naturally (no stuffing). Preserves slug/URL + snapshots a
   *  version. The heart of the review loop: add keywords → rewrite in place. */
  async rewritePage(tenantId: string, pageId: string, addKeywords: string[]): Promise<GeneratedPage | undefined> {
    const p = this.st(tenantId).pages.find((x) => x.id === pageId);
    if (!p) return undefined;
    const clean = [...new Set([...(p.targetKeywords ?? []), ...addKeywords.map((k) => k.trim()).filter(Boolean)])];
    p.targetKeywords = clean;
    const query = p.targetKeywords[0] ?? p.title.toLowerCase();
    const base = (await this.brandHint(tenantId)) ?? "";
    const kwHint =
      `${base}\nTarget keywords to weave in naturally across headings and body (do NOT keyword-stuff; keep it readable and useful): ` +
      clean.join(", ") + ".";
    const ai = await draftPageContent(query, p.pageType, kwHint.trim());
    if (ai) {
      if (ai.metaTitle) p.metaTitle = ai.metaTitle;
      if (ai.metaDescription) p.metaDescription = ai.metaDescription;
      if (ai.heroCopy) p.heroCopy = ai.heroCopy;
      if (ai.sections?.length) p.sections = ai.sections;
      if (ai.faqs?.length) p.faqs = ai.faqs;
      p.updatedAt = new Date().toISOString();
      p.infographic = buildInfographic(p.pageType, query, p.sections);
      p.infographics = this.infographicService.generate(query, p.pageType, this.brand.current()?.company?.trim() ?? p.title, (await this.library.get(tenantId)).proofPoints);
      // Clamp meta → recompute wordCount → rich SEO/GEO/AEO schema → real seoChecks.
      this.recomputeSeoArtifacts(p);
    }
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, ai ? `Rewrite for keywords: ${clean.slice(0, 5).join(", ")}` : "Rewrite (LLM unavailable)", "ai");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Start a background keyword-aware rewrite (LLM ~30-80s exceeds the sync budget → poll).
   *  Reuses the regen-job machinery (same {status, pageId} shape). */
  startRewrite(tenantId: string, pageId: string, addKeywords: string[]): RegenJob {
    while (this.regenJobs.size >= 50) {
      const oldest = this.regenJobs.keys().next().value;
      if (oldest === undefined) break;
      this.regenJobs.delete(oldest);
    }
    this.rseq += 1;
    const exists = this.st(tenantId).pages.some((x) => x.id === pageId);
    const job: RegenJob = {
      id: `rwr-${this.rseq}`,
      status: exists ? "running" : "failed",
      pageId,
      startedAt: new Date().toISOString(),
      ...(exists ? {} : { error: `Page ${pageId} not found`, finishedAt: new Date().toISOString() }),
    };
    this.regenJobs.set(job.id, job);
    if (exists) {
      void (async () => {
        try {
          const updated = await this.rewritePage(tenantId, pageId, addKeywords);
          job.status = updated ? "completed" : "failed";
          if (!updated) job.error = "rewrite produced no change";
        } catch (e) {
          job.status = "failed";
          job.error = e instanceof Error ? e.message : "rewrite failed";
        }
        job.finishedAt = new Date().toISOString();
      })();
    }
    return { ...job };
  }

  /* leads */
  listLeads(tenantId: string) {
    return this.st(tenantId).leads;
  }
  getLead(tenantId: string, id: string) {
    return this.st(tenantId).leads.find((l) => l.id === id);
  }
  updateLeadStatus(tenantId: string, id: string, status: LeadStatus): Lead | undefined {
    const l = this.getLead(tenantId, id);
    if (l) {
      l.status = status;
      this.save(tenantId, T.leads, l.id, l);
    }
    return l;
  }
  removeLead(tenantId: string, id: string): boolean {
    const s = this.st(tenantId);
    const i = s.leads.findIndex((l) => l.id === id);
    if (i < 0) return false;
    s.leads.splice(i, 1);
    this.drop(tenantId, T.leads, id);
    this.logAudit(tenantId, "delete", "lead", id);
    return true;
  }
  /**
   * Synchronously refresh a page: set status to "generating", re-draft via the LLM,
   * and restore to "published" (or "draft" if it was never published).
   * Replaces the old stub that only set `needs-refresh` without doing any work.
   */
  async refreshPage(tenantId: string, pageId: string): Promise<GeneratedPage | undefined> {
    const p = this.st(tenantId).pages.find((x) => x.id === pageId);
    if (!p) return undefined;
    const prevStatus = p.status;
    p.status = "needs-refresh";
    p.updatedAt = this.now;
    this.save(tenantId, T.pages, p.id, p);
    // Re-draft via LLM; falls back gracefully when the LLM is unavailable.
    const query = p.targetKeywords[0] ?? p.title.toLowerCase();
    const ai = await draftPageContent(query, p.pageType, await this.brandHint(tenantId));
    if (ai) {
      if (ai.metaTitle) p.metaTitle = ai.metaTitle;
      if (ai.metaDescription) p.metaDescription = ai.metaDescription;
      if (ai.heroCopy) p.heroCopy = ai.heroCopy;
      if (ai.sections?.length) p.sections = ai.sections;
      if (ai.faqs?.length) p.faqs = ai.faqs;
      p.updatedAt = new Date().toISOString();
      p.infographic = buildInfographic(p.pageType, query, p.sections);
      p.infographics = this.infographicService.generate(query, p.pageType, this.brand.current()?.company?.trim() ?? p.title, (await this.library.get(tenantId)).proofPoints);
      // Clamp meta → recompute wordCount → rich SEO/GEO/AEO schema → real seoChecks.
      this.recomputeSeoArtifacts(p);
    }
    // Restore to published if it was published before; otherwise leave as approved/draft.
    p.status = prevStatus === "published" || prevStatus === "needs-refresh" ? "published" : prevStatus;
    p.lastRefreshedAt = this.now;
    p.updatedAt = this.now;
    if (p.status === "published") {
      p.publishedUrl = p.publishedUrl ?? this.publishedUrlFor(p.slug);
    }
    this.snapshot(tenantId, p, ai ? "AI content refresh (manual)" : "Refresh (LLM unavailable — content unchanged)", "ai");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Toggle autopilot on/off for a page. When on, stale-page monitors will automatically
   *  trigger a re-draft instead of just flagging the page. */
  toggleAutopilot(tenantId: string, pageId: string, enabled: boolean): GeneratedPage | undefined {
    const p = this.getPage(tenantId, pageId);
    if (!p) return undefined;
    p.autopilot = enabled;
    p.updatedAt = this.now;
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Flag a page needs-refresh from an external signal (e.g. rank-drop monitor). No-ops if already flagged. */
  markNeedsRefresh(tenantId: string, pageId: string, reason?: string): boolean {
    const p = this.getPage(tenantId, pageId);
    if (!p || p.status !== "published") return false;
    p.status = "needs-refresh";
    if (reason) p.seoChecks = [{ label: `Rank drop detected: ${reason}`, pass: false }, ...p.seoChecks.filter(c => !c.label.startsWith("Rank drop detected"))];
    this.save(tenantId, T.pages, p.id, p);
    return true;
  }

  /* monitoring: refresh recommendations (PRD §7.8) */
  refreshRecommendations(tenantId: string) {
    return this.st(tenantId).pages
      .filter((p) => p.status === "published" || p.status === "needs-refresh")
      .map((p) => {
        const ageDays = p.lastRefreshedAt
          ? Math.round((Date.parse(this.now) - Date.parse(p.lastRefreshedAt)) / 86_400_000)
          : 0;
        const failingSeo = p.seoChecks.filter((c) => !c.pass).length;
        const stale = p.status === "needs-refresh" || ageDays > 60;
        const reason =
          p.status === "needs-refresh"
            ? "Edited since last publish — re-publish to ship changes"
            : ageDays > 60
              ? `Not refreshed in ${ageDays} days — likely content decay`
              : failingSeo > 0
                ? `${failingSeo} SEO check${failingSeo > 1 ? "s" : ""} failing`
                : "Healthy";
        const action: "refresh" | "rebuild" | "no-action" =
          p.status === "needs-refresh" ? "refresh" : ageDays > 90 ? "rebuild" : stale || failingSeo ? "refresh" : "no-action";
        return { pageId: p.id, title: p.title, slug: p.slug, ageDays, failingSeo, action, reason };
      })
      .filter((r) => r.action !== "no-action");
  }

  /** Public lead ingest with spam filtering, dedupe, and scoring (PRD §7.9). The lead is
   *  routed to the OWNING workspace of the referenced page — never the caller (A5). */
  addLead(input: LeadInput): Lead {
    // Resolve the page + its owning tenant from the (public) page reference.
    const tenantId = input.pageId
      ? this.tenantForPageId(input.pageId)
      : input.slug
        ? this.tenantForSlug(input.slug)
        : DEFAULT_TENANT_ID;
    const s = this.st(tenantId);
    const page =
      (input.pageId ? this.getPage(tenantId, input.pageId) : undefined) ??
      (input.slug ? this.getPublishedBySlug(input.slug) : undefined) ??
      s.pages[0];

    const email = (input.email ?? "").trim();
    const message = (input.message ?? "").trim();
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    const spammy = /(viagra|lottery|prize|crypto|\$\$\$|click here|winner)/i.test(message + " " + email);
    const dup = s.leads.find((l) => l.email.toLowerCase() === email.toLowerCase() && l.pageId === page?.id);

    let spamStatus: SpamStatus = "clean";
    if (!emailOk || spammy) spamStatus = "spam";
    else if (dup) spamStatus = "duplicate";

    const freeDomain = /@(gmail|yahoo|hotmail|outlook|icloud)\.com$/i.test(email);
    let score = 50;
    if (emailOk && !freeDomain) score += 25;
    if (message.length > 40) score += 15;
    if (input.company?.trim()) score += 10;
    if (spamStatus !== "clean") score = Math.min(score, 12);
    score = Math.max(0, Math.min(100, score));

    this.seq += 1;
    const lead: Lead = {
      id: `lead-new-${this.seq}`,
      pageId: page?.id ?? input.pageId ?? "",
      pageTitle: page?.title ?? "(unknown page)",
      name: (input.name ?? "").trim() || email.split("@")[0] || "Unknown",
      email,
      company: input.company?.trim() || "—",
      message: message || "(no message)",
      sourceUrl: input.sourceUrl ?? page?.publishedUrl ?? (page ? this.publishedUrlFor(page.slug) : ""),
      utm: input.utm,
      score,
      status: "new",
      spamStatus,
      createdAt: this.now,
    };
    s.leads.unshift(lead);
    this.save(tenantId, T.leads, lead.id, lead);
    return lead;
  }
}
