/**
 * Honest production providers (No-Dummy-Data §6.1, P0-4).
 *
 * In production/staging the SEO/brand/outreach DI tokens must NOT be backed by mock
 * fixtures. Until a real provider is connected (DataForSEO for SEO/backlinks, the
 * Brand Memory store for brand, an LLM for outreach), these return empty / setup-required
 * results — so endpoints render an honest "connect a provider" state instead of fabricated
 * authority scores, backlinks, or rankings. Real seams (KeywordResearchService, GscService,
 * CompetitorAnalysisService, BrandMemoryStore) supply live data where wired.
 */
import type {
  SeoDataProvider,
  BrandProfileSource,
  OutreachDrafter,
  DomainHealth,
  BrandProfile,
} from "@geoseo/types";

const SETUP_REQUIRED_HEALTH: DomainHealth = {
  score: 0,
  grade: "D",
  delta: { pct: 0, direction: "flat", goodWhen: "up" },
  factors: [],
  backlinksAcquired: 0,
  backlinksOpportunities: 0,
};

/** Empty brand seed — the real profile is captured during onboarding and persisted. */
const EMPTY_BRAND: BrandProfile = {
  company: "",
  domain: "",
  url: "",
  valueProp: "",
  topics: [],
  industry: "",
  tone: "professional",
  contactName: "",
  contactEmail: "",
};

class EmptySeoDataProvider implements SeoDataProvider {
  async getDomainHealth() {
    return SETUP_REQUIRED_HEALTH;
  }
  async getKpis() {
    return [];
  }
  async getProspects() {
    return [];
  }
  async getBacklinks() {
    return [];
  }
  async getTrackedPages() {
    return [];
  }
  async getRankSeries() {
    return [];
  }
  async getImpressionSeries() {
    return [];
  }
  async getAiVisibility() {
    return [];
  }
  async getAlerts() {
    return [];
  }
  async getActivity() {
    return [];
  }
}

class EmptyBrandProfileSource implements BrandProfileSource {
  async getBrandProfile() {
    return EMPTY_BRAND;
  }
}

class EmptyOutreachDrafter implements OutreachDrafter {
  async draft() {
    return [];
  }
}

export const emptySeoProvider: SeoDataProvider = new EmptySeoDataProvider();
export const emptyBrandSource: BrandProfileSource = new EmptyBrandProfileSource();
export const emptyOutreachDrafter: OutreachDrafter = new EmptyOutreachDrafter();
