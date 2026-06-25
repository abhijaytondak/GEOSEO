import { Injectable } from "@nestjs/common";
import type {
  ComparisonTableSpec,
  InfographicSpecV2,
  PageType,
  ProcessFlowSpec,
  ProsConsSpec,
  StatGridSpec,
  TimelineSpec,
} from "@geoseo/types";
import type { ProofPoint } from "./brand-library.service";

/**
 * InfographicService — Phase 3 of the Page Engine PRD.
 *
 * Generates 1–2 AI-crawlable, structured infographic specs appropriate for
 * each page type. Process-flow / comparison / pros-cons content is deterministic
 * and template-based (no numbers asserted). The **stat-grid is built only from
 * the brand's real proof points** (Brand Memory) — never fabricated statistics —
 * and is omitted entirely when the brand has no proof points, so a published page
 * never presents an unsourced number as fact.
 *
 * Rendered as semantic HTML (table / ol / dl / figure) on the public feed page
 * so AI crawlers can read every label and value — a deliberate edge over
 * image-only infographics.
 */
@Injectable()
export class InfographicService {
  /**
   * Returns 1–2 `InfographicSpecV2` objects suited to the given page type.
   *
   * Page-type → infographic mapping (PRD Phase 3). A stat-grid is included only
   * when `proofPoints` yields real numbers; otherwise the page falls back to a
   * number-free infographic (process-flow / pros-cons) rather than fake stats.
   */
  generate(
    keyword: string,
    pageType: PageType,
    brandName: string,
    proofPoints: ProofPoint[] = [],
  ): InfographicSpecV2[] {
    const k = keyword.trim() || "this topic";
    const b = brandName.trim() || "our team";
    const statGrid = this.statGridFromProof(k, proofPoints); // null when no real proof numbers

    switch (pageType) {
      case "guide":
        return statGrid ? [this.processFlow(k, b), statGrid] : [this.processFlow(k, b)];

      case "comparison":
        return [this.comparisonTable(k), this.prosCons(k, b)];

      case "service":
      case "landing":
        return statGrid ? [statGrid, this.prosCons(k, b)] : [this.prosCons(k, b), this.processFlow(k, b)];

      case "local":
        return [statGrid ?? this.processFlow(k, b)];

      case "faq":
      case "resource":
        return [this.processFlow(k, b)];

      default:
        return [this.processFlow(k, b)];
    }
  }

  /**
   * Build a stat-grid from the brand's REAL proof points (Brand Memory). Each card
   * maps to a proof point the customer entered — a leading metric token ("99.9%",
   * "10,000+", "3×") becomes the big value; a stat-type proof without a parseable
   * number uses its label as the value. Non-numeric, non-stat proofs (testimonials,
   * awards, logos) are not forced into a numbers grid. Returns null when nothing
   * usable remains — the caller then omits the stat-grid rather than fabricate one.
   */
  private statGridFromProof(keyword: string, proofPoints: ProofPoint[]): StatGridSpec | null {
    const cards = proofPoints
      .map((p) => this.proofToStat(p))
      .filter((c): c is { value: string; label: string; note?: string } => c !== null)
      .slice(0, 4);
    if (cards.length === 0) return null;
    return { kind: "stat-grid", title: `${titleCase(keyword)} — by the numbers`, stats: cards };
  }

  private proofToStat(p: ProofPoint): { value: string; label: string; note?: string } | null {
    // ONLY statistics become number cards. Testimonials, awards, case-studies, and logos
    // are real proof but are NOT statistics — never promote a number inside them (e.g. a
    // "5-star" testimonial) into a "stat" card.
    if (p.type !== "stat") return null;
    const label = (p.label ?? "").trim();
    if (!label) return null;
    // Provenance only when the customer actually supplied it — never fabricate "source on file".
    const note = p.detail?.trim() || p.source?.trim() || undefined;
    // Leading metric token kept WHOLE with combined units (2M+, 99.9%, 3.5/5, $2M, 24h, 3×).
    // `*` allows multiple trailing unit chars; lookahead (not \b) keeps non-word units (%,+) in the value.
    const m = label.match(/^([$€£]?\d[\d.,]*(?:%|×|x|\+|★|k|m|bn|h|\/\d+)*)(?=\s|$|[—–:-])\s*[—–:-]?\s*(.*)$/i);
    if (m && /\d/.test(m[1])) return { value: m[1].trim(), label: (m[2] || "").trim() || label, note };
    // Stat-typed but no parseable leading number → show the whole label as the card value.
    return { value: label, label: "", note };
  }

  /* ------------------------------------------------------------------ */
  /* Private builders                                                     */
  /* ------------------------------------------------------------------ */

  private processFlow(keyword: string, brandName: string): ProcessFlowSpec {
    const k = titleCase(keyword);
    return {
      kind: "process-flow",
      title: `How to get started with ${keyword}`,
      steps: [
        {
          number: 1,
          heading: `Research ${k}`,
          detail: `Define your goal and audit your current position. Knowing where you stand with ${keyword} is the fastest way to identify the highest-impact next step.`,
        },
        {
          number: 2,
          heading: "Build your strategy",
          detail: `Map a clear, prioritised plan for ${keyword}. Focus on the actions that move the needle in the first 30 days before adding complexity.`,
        },
        {
          number: 3,
          heading: `Implement with ${brandName}`,
          detail: `${brandName} guides you through implementation so you avoid the most common pitfalls and reach measurable results faster.`,
        },
        {
          number: 4,
          heading: "Monitor results",
          detail: `Track the metrics that matter: traction, quality, and ROI. Review weekly in the early stages and monthly once you reach steady state.`,
        },
        {
          number: 5,
          heading: "Iterate and improve",
          detail: `Use what you learn to sharpen your ${keyword} approach every cycle. Continuous improvement compounds into a lasting competitive edge.`,
        },
      ].map((s) => ({
        ...s,
        // Defensive de-template: replace any literal ${brandName} in BOTH fields (a
        // double-quoted string above won't interpolate at construction).
        heading: s.heading.replace(/\$\{brandName\}/g, brandName),
        detail: s.detail.replace(/\$\{brandName\}/g, brandName),
      })),
    };
  }


  private comparisonTable(keyword: string): ComparisonTableSpec {
    // Try to parse "A vs B" from the keyword; fall back to generic labels.
    const parts = keyword
      .split(/\s+vs\.?\s+|\s+versus\s+/i)
      .map((p) => p.replace(/\b\w/g, (c) => c.toUpperCase()).trim())
      .filter(Boolean);

    const [optionA, optionB] = parts.length >= 2 ? parts : ["Option A", "Option B"];

    return {
      kind: "comparison-table",
      title: `${optionA} vs ${optionB} — feature comparison`,
      columns: ["Feature", optionA, optionB],
      rows: [
        {
          label: "Best for",
          values: ["Use case fit", "Simplicity & quick setup", "Scale & customisation"],
        },
        {
          label: "Pricing model",
          values: ["Cost structure", "Lower upfront cost", "Higher ceiling, usage-based"],
        },
        {
          label: "Ease of use",
          values: ["Learning curve", "Beginner-friendly", "More configuration required"],
        },
        {
          label: "Integrations",
          values: ["Ecosystem depth", "Core integrations included", "Wide API / enterprise connectors"],
        },
        {
          label: "Support",
          values: ["Help options", "Community + docs", "Dedicated CSM at higher tiers"],
        },
        {
          label: "Time to value",
          values: ["Speed to first result", "Days", "Weeks (more setup)"],
        },
      ],
    };
  }

  private prosCons(keyword: string, brandName: string): ProsConsSpec {
    const k = keyword;
    return {
      kind: "pros-cons",
      title: `${titleCase(k)} — pros and considerations`,
      pros: [
        `Directly improves outcomes tied to ${k} when implemented with clear goals`,
        `Scales with your team — start small, expand as you see results`,
        `${brandName}'s structured approach reduces the typical trial-and-error period`,
        `Measurable ROI: set baseline metrics upfront and track progress every cycle`,
        `Builds internal capability so your team doesn't depend on external help indefinitely`,
      ],
      cons: [
        `Requires an upfront time investment to set goals and baseline metrics`,
        `Results compound over time — teams expecting overnight changes will be disappointed`,
        `${k} done well needs cross-functional buy-in, not just one champion`,
        `Ongoing iteration is essential; a "set and forget" approach loses ground quickly`,
      ],
    };
  }

  /** Unused but exported for potential future use (e.g. news/changelog pages). */
  buildTimeline(keyword: string, brandName: string): TimelineSpec {
    return {
      kind: "timeline",
      title: `${titleCase(keyword)} — milestones`,
      events: [
        {
          date: "Week 1",
          heading: "Discovery & goal-setting",
          detail: `Define what success looks like for ${keyword} in your context. ${brandName} runs a structured discovery session to align on priorities.`,
        },
        {
          date: "Week 2–3",
          heading: "Strategy and planning",
          detail: `Build the ${keyword} roadmap: prioritised actions, owners, and success metrics for the first quarter.`,
        },
        {
          date: "Month 1",
          heading: "Implementation begins",
          detail: `The first ${keyword} actions go live. ${brandName} provides hands-on guidance throughout the launch phase.`,
        },
        {
          date: "Month 2–3",
          heading: "Measure and iterate",
          detail: `Review early ${keyword} results against baseline metrics. Adjust priorities based on what's working and what isn't.`,
        },
        {
          date: "Quarter 2+",
          heading: "Scale and sustain",
          detail: `With the ${keyword} foundation in place, expand the programme and embed it into your regular workflow.`,
        },
      ],
    };
  }
}

/** Title-case a string (every word's first letter capitalised). */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
