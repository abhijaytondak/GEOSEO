import type { InfographicSpec, PageSection } from "@geoseo/types";
import { specFor } from "./page-type-spec";

/**
 * Build a deterministic, on-page infographic from the page's own structure
 * (PRD Phase 6 — Infographics). Keyless and always valid:
 *  - comparison pages → a comparison TABLE (columns parsed from "A vs B")
 *  - every other type except faq → a PROCESS-FLOW of the section arc
 * An LLM enrichment pass can later fill table cells / step detail; the format
 * (and its AI-crawlable HTML rendering) is the value delivered now.
 */
export function buildInfographic(
  pageType: string,
  query: string,
  sections: PageSection[],
): InfographicSpec | undefined {
  if (pageType === "faq") return undefined;

  if (pageType === "comparison") {
    const parts = query
      .split(/\s+vs\.?\s+|\s+versus\s+/i)
      .map((p) => p.replace(/\b\w/g, (c) => c.toUpperCase()).trim())
      .filter(Boolean);
    const columns = parts.length >= 2 ? parts.slice(0, 3) : ["Option A", "Option B"];
    const dimensions = ["Best for", "Pricing", "Ease of use", "Integrations", "Support"];
    return {
      kind: "comparison-table",
      title: `${columns.join(" vs ")} — at a glance`,
      columns,
      rows: dimensions.map((label) => ({ label, cells: columns.map(() => "—") })),
    };
  }

  const steps = sections.slice(0, 6).map((s) => ({ label: s.heading }));
  if (steps.length < 2) return undefined;
  return {
    kind: "process-flow",
    title: `How it works: ${specFor(pageType).label.toLowerCase()}`,
    steps,
  };
}
