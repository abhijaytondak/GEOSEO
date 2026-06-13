import type {
  BacklinkProspect,
  BrandProfile,
  BrandProfileSource,
  OutreachDrafter,
  OutreachTemplate,
  SeoDataProvider,
} from "@geoseo/types";
import {
  activity,
  aiVisibility,
  alerts,
  backlinks,
  brand,
  domainHealth,
  impressionSeries,
  kpis,
  prospects,
  rankSeries,
  trackedPages,
} from "./data";

const resolve = <T>(value: T): Promise<T> => Promise.resolve(value);

/** In-memory SEO data — swap for a DataForSEO-backed impl in production. */
export class MockSeoDataProvider implements SeoDataProvider {
  getDomainHealth() {
    return resolve(domainHealth);
  }
  getKpis() {
    return resolve(kpis);
  }
  getProspects() {
    return resolve(prospects);
  }
  getBacklinks() {
    return resolve(backlinks);
  }
  getTrackedPages() {
    return resolve(trackedPages);
  }
  getRankSeries() {
    return resolve(rankSeries);
  }
  getImpressionSeries() {
    return resolve(impressionSeries);
  }
  getAiVisibility() {
    return resolve(aiVisibility);
  }
  getAlerts() {
    return resolve(alerts);
  }
  getActivity() {
    return resolve(activity);
  }
}

/** Standalone brand profile — swap for the brand-memory product in production. */
export class MockBrandProfileSource implements BrandProfileSource {
  getBrandProfile() {
    return resolve(brand);
  }
}

/**
 * Template-based outreach drafting — swap for Claude (prompt-cached) in
 * production. Produces 3 tonal variants with brand variables interpolated.
 */
export class MockOutreachDrafter implements OutreachDrafter {
  draft(p: BacklinkProspect, b: BrandProfile) {
    const topic = b.topics[0];
    const editor = p.contactEmail?.split("@")[0] ?? "there";
    const firstName = editor === "editor" ? "team" : editor;

    // The four PRD outreach archetypes: cold · follow-up · value-offer · content-swap.
    const variants: OutreachTemplate[] = [
      {
        id: `${p.id}-cold`,
        prospectId: p.id,
        variantName: "Cold",
        subject: `Loved your work at ${p.domain} — quick idea`,
        body: [
          `Hi ${firstName},`,
          ``,
          `I'm ${b.contactName} from ${b.company}. I've been following ${p.domain}'s coverage of ${p.industry.toLowerCase()} and your audience feels like exactly the kind of people we built ${b.company} for.`,
          ``,
          `We help teams with ${b.valueProp.toLowerCase()} I'd love to contribute a data-backed piece on ${topic} that your readers could actually use — no fluff, original numbers from our platform.`,
          ``,
          `Worth exploring?`,
          ``,
          `— ${b.contactName}`,
          `${b.url}`,
        ].join("\n"),
      },
      {
        id: `${p.id}-followup`,
        prospectId: p.id,
        variantName: "Follow-up",
        subject: `Re: ${topic} idea for ${p.domain}`,
        body: [
          `Hi ${firstName},`,
          ``,
          `Floating this back to the top of your inbox — I know how fast things move at a site like ${p.domain}.`,
          ``,
          `Still happy to write an original, data-driven piece on ${topic} for your readers, on me. If now's not the moment, just say the word and I'll check back next quarter.`,
          ``,
          `Either way, thanks for the great work at ${p.domain}.`,
          ``,
          `— ${b.contactName}, ${b.company}`,
        ].join("\n"),
      },
      {
        id: `${p.id}-value`,
        prospectId: p.id,
        variantName: "Value-offer",
        subject: `A free ${topic} teardown for ${p.domain}'s readers`,
        body: [
          `Hi ${firstName},`,
          ``,
          `Quick one: we just pulled benchmark data on ${topic} across 400+ ${b.industry.toLowerCase()} teams, and a few findings genuinely surprised us.`,
          ``,
          `I think a guest piece breaking this down would resonate with ${p.domain}'s audience. I'll do the writing and bring the charts — you get original, link-worthy content at zero cost.`,
          ``,
          `Happy to send an outline first. Interested?`,
          ``,
          `Best,`,
          `${b.contactName}, ${b.company}`,
          `${b.contactEmail}`,
        ].join("\n"),
      },
      {
        id: `${p.id}-swap`,
        prospectId: p.id,
        variantName: "Content-swap",
        subject: `A relevant link for your ${topic} piece (+ one of ours)`,
        body: [
          `Hi ${firstName},`,
          ``,
          `I was reading ${p.domain}'s piece on ${p.industry.toLowerCase()} and we have a ${topic} resource at ${b.url} that would slot in naturally as a reference for your readers.`,
          ``,
          `In return, I'd be glad to cite ${p.domain} in an upcoming ${b.company} article going out to our audience. A genuine two-way link that helps both sets of readers.`,
          ``,
          `Want me to send the exact spots I had in mind?`,
          ``,
          `— ${b.contactName}`,
        ].join("\n"),
      },
    ];

    return resolve(variants);
  }
}

/** Ready-to-use singletons for the prototype. */
export const seoProvider: SeoDataProvider = new MockSeoDataProvider();
export const brandSource: BrandProfileSource = new MockBrandProfileSource();
export const outreachDrafter: OutreachDrafter = new MockOutreachDrafter();
