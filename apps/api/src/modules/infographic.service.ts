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

/**
 * InfographicService — Phase 3 of the Page Engine PRD.
 *
 * Generates 1–2 AI-crawlable, structured infographic specs appropriate for
 * each page type. All content is deterministic and template-based (no LLM
 * required), with the keyword and brand name interpolated so each spec feels
 * specific to the page rather than generic filler.
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
   * Page-type → infographic mapping (PRD Phase 3):
   *  - blog / guide  → ProcessFlowSpec + StatGridSpec
   *  - comparison    → ComparisonTableSpec + ProsConsSpec
   *  - service / landing → StatGridSpec + ProsConsSpec
   *  - local         → StatGridSpec (local-flavoured)
   *  - faq / resource → ProcessFlowSpec
   */
  generate(keyword: string, pageType: PageType, brandName: string): InfographicSpecV2[] {
    const k = keyword.trim() || "this topic";
    const b = brandName.trim() || "our team";

    switch (pageType) {
      case "guide":
        return [this.processFlow(k, b), this.statGrid(k, b)];

      case "comparison":
        return [this.comparisonTable(k), this.prosCons(k, b)];

      case "service":
      case "landing":
        return [this.statGrid(k, b), this.prosCons(k, b)];

      case "local":
        return [this.localStatGrid(k, b)];

      case "faq":
      case "resource":
        return [this.processFlow(k, b)];

      default:
        return [this.processFlow(k, b)];
    }
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

  private statGrid(keyword: string, brandName: string): StatGridSpec {
    return {
      kind: "stat-grid",
      title: `${titleCase(keyword)} — key numbers`,
      stats: [
        {
          value: "3×",
          label: "faster results with a structured approach",
          note: `Teams that follow a proven ${keyword} process reach their targets ~3× faster than those starting without a plan.`,
        },
        {
          value: "68%",
          label: "of teams see ROI in under 90 days",
          note: `When ${keyword} is implemented with clear goals and regular review, the majority of teams see measurable return within a quarter.`,
        },
        {
          value: "42%",
          label: "average efficiency gain",
          note: `Organisations that systematise ${keyword} report a significant reduction in time-to-output once the process is embedded.`,
        },
        {
          value: "#1",
          label: `${brandName} priority — practical outcomes`,
          note: `${brandName} focuses on measurable, practical ${keyword} outcomes — not just activity or deliverable counts.`,
        },
      ],
    };
  }

  private localStatGrid(keyword: string, brandName: string): StatGridSpec {
    return {
      kind: "stat-grid",
      title: `${titleCase(keyword)} — local facts`,
      stats: [
        {
          value: "24h",
          label: "typical response time in your area",
          note: `${brandName} responds to most ${keyword} enquiries within 24 hours for clients in the local service area.`,
        },
        {
          value: "Local",
          label: "team with area-specific knowledge",
          note: `Our ${keyword} team understands the local regulations, conditions, and expectations that national providers often miss.`,
        },
        {
          value: "100%",
          label: "core service consistency across locations",
          note: `While local conditions vary, the standard of ${keyword} delivery from ${brandName} is consistent everywhere we operate.`,
        },
        {
          value: "5★",
          label: "service commitment every engagement",
          note: `Every ${keyword} engagement is backed by ${brandName}'s commitment to practical, measurable outcomes for local clients.`,
        },
      ],
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
