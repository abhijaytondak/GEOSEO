import type {
  ActivityEvent,
  AiVisibilitySignal,
  Alert,
  Backlink,
  BacklinkProspect,
  BrandProfile,
  Delta,
  DomainHealth,
  ImpressionPoint,
  KpiMetric,
  RankPoint,
  TrackedPage,
} from "@geoseo/types";
import { clamp, daysAgo, hoursAgo, mulberry32, round } from "./rng";

const rand = mulberry32(20260612);

function delta(pct: number, goodWhen: "up" | "down"): Delta {
  return {
    pct: round(pct, 1),
    direction: pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat",
    goodWhen,
  };
}

/* ---------------------------------------------------------------- brand */

export const brand: BrandProfile = {
  company: "Northwind Labs",
  domain: "northwindlabs.io",
  url: "https://northwindlabs.io",
  valueProp:
    "AI-powered customer analytics that turn product usage into revenue decisions.",
  topics: [
    "product analytics",
    "customer data platform",
    "retention",
    "growth metrics",
    "AI insights",
  ],
  industry: "B2B SaaS · Analytics",
  tone: "professional",
  contactName: "Maya Chen",
  contactEmail: "maya@northwindlabs.io",
  audience:
    "Heads of Product, Growth, and Data at Series A–C B2B SaaS companies (50–500 employees) who own activation, retention, and expansion metrics.",
  differentiators: [
    "Warehouse-native — runs on your existing data stack, no double-tracking",
    "AI insights that explain *why* a metric moved, not just that it did",
    "Self-serve setup in under an hour vs. multi-week implementations",
  ],
  competitors: ["amplitude.com", "mixpanel.com", "heap.io", "june.so"],
  keywords: [
    "product analytics",
    "cohort retention analysis",
    "north star metric",
    "self-serve analytics",
    "warehouse-native analytics",
  ],
};

/* ------------------------------------------------------- prospects */

interface ProspectSeed {
  domain: string;
  industry: string;
  da: number;
  rel: number;
  traffic: number;
  tags: string[];
  status: BacklinkProspect["status"];
}

const prospectSeeds: ProspectSeed[] = [
  { domain: "saastr.com", industry: "SaaS Media", da: 82, rel: 94, traffic: 1_200_000, tags: ["SaaS", "Editorial"], status: "new" },
  { domain: "indiehackers.com", industry: "Startup Community", da: 78, rel: 88, traffic: 2_400_000, tags: ["Community", "Founders"], status: "contacted" },
  { domain: "searchenginejournal.com", industry: "SEO Media", da: 86, rel: 81, traffic: 3_100_000, tags: ["SEO", "Editorial"], status: "new" },
  { domain: "g2.com", industry: "Review Platform", da: 91, rel: 90, traffic: 8_900_000, tags: ["Reviews", "Listing"], status: "replied" },
  { domain: "producthunt.com", industry: "Launch Platform", da: 90, rel: 85, traffic: 6_200_000, tags: ["Launch", "Listing"], status: "acquired" },
  { domain: "hubspot.com", industry: "Marketing Media", da: 93, rel: 79, traffic: 22_000_000, tags: ["Guest", "Editorial"], status: "new" },
  { domain: "zapier.com", industry: "Automation Blog", da: 92, rel: 76, traffic: 18_500_000, tags: ["Guest", "Integrations"], status: "new" },
  { domain: "growthhackers.com", industry: "Growth Community", da: 74, rel: 91, traffic: 640_000, tags: ["Growth", "Community"], status: "contacted" },
  { domain: "demandcurve.com", industry: "Growth Media", da: 71, rel: 89, traffic: 410_000, tags: ["Growth", "Editorial"], status: "new" },
  { domain: "foundr.com", industry: "Entrepreneurship", da: 80, rel: 72, traffic: 1_500_000, tags: ["Founders", "Guest"], status: "new" },
  { domain: "smashingmagazine.com", industry: "Dev/Design Media", da: 89, rel: 64, traffic: 4_300_000, tags: ["Editorial", "Technical"], status: "rejected" },
  { domain: "css-tricks.com", industry: "Dev Media", da: 88, rel: 58, traffic: 3_800_000, tags: ["Technical", "Editorial"], status: "new" },
  { domain: "capterra.com", industry: "Review Platform", da: 89, rel: 87, traffic: 7_100_000, tags: ["Reviews", "Listing"], status: "new" },
  { domain: "betalist.com", industry: "Launch Platform", da: 68, rel: 80, traffic: 320_000, tags: ["Launch", "Listing"], status: "acquired" },
  { domain: "starterstory.com", industry: "Founder Stories", da: 73, rel: 77, traffic: 900_000, tags: ["Founders", "Interview"], status: "new" },
  { domain: "failory.com", industry: "Startup Media", da: 66, rel: 75, traffic: 280_000, tags: ["Founders", "Editorial"], status: "contacted" },
  { domain: "nocode.tech", industry: "No-Code Media", da: 61, rel: 70, traffic: 190_000, tags: ["No-Code", "Listing"], status: "new" },
  { domain: "marketingexamples.com", industry: "Marketing Media", da: 69, rel: 83, traffic: 350_000, tags: ["Marketing", "Editorial"], status: "new" },
  { domain: "openviewpartners.com", industry: "VC Content", da: 76, rel: 86, traffic: 520_000, tags: ["SaaS", "Editorial"], status: "replied" },
  { domain: "cxl.com", industry: "Optimization Media", da: 79, rel: 88, traffic: 740_000, tags: ["Growth", "Editorial"], status: "new" },
  { domain: "baremetrics.com", industry: "SaaS Blog", da: 72, rel: 90, traffic: 480_000, tags: ["SaaS", "Guest"], status: "new" },
  { domain: "userpilot.com", industry: "Product Blog", da: 70, rel: 92, traffic: 560_000, tags: ["Product", "Guest"], status: "contacted" },
  { domain: "amplitude.com", industry: "Analytics Blog", da: 84, rel: 95, traffic: 2_900_000, tags: ["Analytics", "Editorial"], status: "new" },
  { domain: "segment.com", industry: "CDP Blog", da: 87, rel: 93, traffic: 3_400_000, tags: ["Data", "Editorial"], status: "new" },
];

function rationaleFor(s: ProspectSeed): string {
  if (s.rel >= 90)
    return `Audience overlaps directly with ${brand.topics[0]} buyers — a guest post here drives qualified referral traffic.`;
  if (s.tags.includes("Listing") || s.tags.includes("Reviews"))
    return `High-DA listing with strong "best ${brand.industry.toLowerCase()}" SERP presence — fast, durable citation.`;
  if (s.da >= 88)
    return `Exceptional authority (DA ${s.da}); even a single editorial link materially lifts domain trust.`;
  return `Relevant ${s.industry.toLowerCase()} audience with healthy authority — solid mid-funnel link target.`;
}

export const prospects: BacklinkProspect[] = prospectSeeds.map((s, i) => {
  const trafficFactor = clamp(Math.log10(s.traffic) * 10, 0, 100);
  const impact = round(s.da * 0.45 + s.rel * 0.4 + trafficFactor * 0.15);
  return {
    id: `prospect-${i + 1}`,
    domain: s.domain,
    url: `https://${s.domain}`,
    domainAuthority: s.da,
    relevanceScore: s.rel,
    impactScore: impact,
    trafficEstimate: s.traffic,
    industry: s.industry,
    tags: s.tags,
    status: s.status,
    contactEmail: `editor@${s.domain}`,
    lastInteraction:
      s.status === "new" ? undefined : daysAgo(2 + Math.floor(rand() * 20)),
    rationale: rationaleFor(s),
  };
});

/* ------------------------------------------------------- backlinks */

const backlinkSeeds: Array<[string, string, Backlink["status"], Backlink["type"], number]> = [
  ["producthunt.com", "/", "live", "directory", 90],
  ["betalist.com", "/", "live", "directory", 68],
  ["openviewpartners.com", "/blog/product-analytics-stack", "live", "editorial", 76],
  ["g2.com", "/products/northwind-labs", "pending", "directory", 91],
  ["userpilot.com", "/blog/activation-metrics", "live", "guest", 70],
  ["growthhackers.com", "/posts/retention-teardown", "live", "editorial", 74],
  ["failory.com", "/interviews/northwind", "live", "editorial", 66],
  ["nocode.tech", "/tools/northwind", "broken", "directory", 61],
  ["indiehackers.com", "/product/northwind-labs", "lost", "directory", 78],
  ["baremetrics.com", "/academy/cohort-analysis", "pending", "guest", 72],
];

export const backlinks: Backlink[] = backlinkSeeds.map(
  ([sourceDomain, targetPage, status, type, da], i) => ({
    id: `backlink-${i + 1}`,
    sourceDomain,
    targetPage,
    anchorText:
      type === "directory" ? "Northwind Labs" : "AI customer analytics platform",
    domainAuthority: da,
    status,
    type,
    acquiredAt: daysAgo(8 + i * 6),
  }),
);

/* ------------------------------------------------------- series */

/** 90 daily points; avg SERP rank trending from ~22 down to ~12 (improving). */
function buildRankSeries(): RankPoint[] {
  const pts: RankPoint[] = [];
  for (let i = 89; i >= 0; i--) {
    const progress = (89 - i) / 89;
    const base = 22 - progress * 9.5;
    const noise = (rand() - 0.5) * 1.8;
    pts.push({ date: daysAgo(i), rank: round(clamp(base + noise, 1, 100), 1) });
  }
  return pts;
}

/** 90 daily points; impressions + clicks trending up. */
function buildImpressionSeries(): ImpressionPoint[] {
  const pts: ImpressionPoint[] = [];
  for (let i = 89; i >= 0; i--) {
    const progress = (89 - i) / 89;
    const weekend = new Date(daysAgo(i)).getUTCDay();
    const dip = weekend === 0 || weekend === 6 ? 0.82 : 1;
    const impressions = Math.round(
      (5200 + progress * 7400 + (rand() - 0.5) * 900) * dip,
    );
    const ctr = 0.031 + progress * 0.018 + (rand() - 0.5) * 0.004;
    pts.push({
      date: daysAgo(i),
      impressions,
      clicks: Math.round(impressions * clamp(ctr, 0.01, 0.12)),
    });
  }
  return pts;
}

export const rankSeries: RankPoint[] = buildRankSeries();
export const impressionSeries: ImpressionPoint[] = buildImpressionSeries();

/* ------------------------------------------------------- tracked pages */

const pageSeeds: Array<[string, string, number, number]> = [
  ["/product/analytics", "Product Analytics Platform", 6, 9],
  ["/blog/cohort-retention-guide", "The Complete Cohort Retention Guide", 11, 8],
  ["/compare/vs-amplitude", "Northwind vs Amplitude", 18, 14],
  ["/blog/north-star-metric", "How to Choose a North Star Metric", 4, 7],
  ["/integrations/segment", "Segment Integration", 22, 19],
  ["/blog/ai-product-insights", "AI Product Insights, Explained", 9, 16],
];

export const trackedPages: TrackedPage[] = pageSeeds.map(
  ([path, title, currentRank, prevRank], idx) => {
    const ranks: RankPoint[] = [];
    const imps: ImpressionPoint[] = [];
    for (let w = 11; w >= 0; w--) {
      const progress = (11 - w) / 11;
      const r = prevRank + (currentRank - prevRank) * progress + (rand() - 0.5) * 1.4;
      ranks.push({ date: daysAgo(w * 7), rank: round(clamp(r, 1, 100), 1) });
      const impressions = Math.round(900 + progress * 1500 + idx * 120 + (rand() - 0.5) * 200);
      imps.push({
        date: daysAgo(w * 7),
        impressions,
        clicks: Math.round(impressions * (0.03 + progress * 0.02)),
      });
    }
    const impressions = imps.reduce((a, p) => a + p.impressions, 0);
    const clicks = imps.reduce((a, p) => a + p.clicks, 0);
    return {
      id: `page-${idx + 1}`,
      path,
      title,
      currentRank,
      prevRank,
      impressions,
      clicks,
      ranks,
      impressionsSeries: imps,
    };
  },
);

/* ------------------------------------------------------- AI visibility */

export const aiVisibility: AiVisibilitySignal[] = [
  { engine: "chatgpt", label: "ChatGPT", mentions: 142, shareOfVoice: 31, delta: delta(12.4, "up") },
  { engine: "perplexity", label: "Perplexity", mentions: 88, shareOfVoice: 24, delta: delta(18.1, "up") },
  { engine: "google-ai", label: "Google AI Overviews", mentions: 64, shareOfVoice: 19, delta: delta(-4.2, "up") },
  { engine: "gemini", label: "Gemini", mentions: 37, shareOfVoice: 12, delta: delta(6.8, "up") },
];

/* ------------------------------------------------------- KPIs */

function sparkFromRanks(): number[] {
  // invert rank so "up" reads as improvement in the sparkline
  return rankSeries.filter((_, i) => i % 6 === 0).map((p) => round(100 - p.rank, 1));
}
function sparkFromImpr(): number[] {
  return impressionSeries.filter((_, i) => i % 6 === 0).map((p) => p.clicks);
}

export const kpis: KpiMetric[] = [
  {
    id: "total-backlinks",
    label: "Total Backlinks",
    value: 342,
    unit: "",
    delta: delta(12.4, "up"),
    caption: "vs last 30 days",
    spark: [288, 296, 305, 311, 318, 324, 333, 342],
  },
  {
    id: "avg-rank",
    label: "Avg. Rank",
    value: 12.4,
    unit: "",
    prefix: "#",
    delta: delta(-14.2, "down"),
    caption: "improved vs last 30 days",
    spark: sparkFromRanks(),
  },
  {
    id: "domain-authority",
    label: "Domain Authority",
    value: 58,
    unit: "/100",
    delta: delta(5.5, "up"),
    caption: "vs last 30 days",
    spark: [52, 53, 53, 54, 55, 56, 57, 58],
  },
  {
    id: "ai-visibility",
    label: "AI Visibility",
    value: 68,
    unit: "/100",
    delta: delta(8.2, "up"),
    caption: "share of AI answers",
    spark: sparkFromImpr(),
  },
];

/* ------------------------------------------------------- domain health */

export const domainHealth: DomainHealth = {
  score: 72,
  grade: "B",
  delta: delta(4.0, "up"),
  factors: [
    {
      label: "Authority",
      score: 58,
      explanation: "Aggregate domain strength from referring-domain count and quality. Improve by earning links from high-DA, topically-relevant sites.",
    },
    {
      label: "Backlink Profile",
      score: 76,
      explanation: "Health of your live links vs. lost/broken ones. Reclaim broken backlinks and convert pending outreach to lift this.",
    },
    {
      label: "Technical SEO",
      score: 84,
      explanation: "Crawlability, Core Web Vitals, structured data, and index coverage. Fix crawl errors and slow pages to raise it.",
    },
    {
      label: "Content Freshness",
      score: 69,
      explanation: "How recently key pages were updated. Refresh decaying pages and add internal links to keep this high.",
    },
  ],
  backlinksAcquired: 342,
  backlinksOpportunities: 480,
};

/* ------------------------------------------------------- alerts */

export const alerts: Alert[] = [
  {
    id: "alert-1",
    type: "rank-drop",
    severity: "critical",
    title: "3 pages lost ranking this week",
    description:
      "Avg. position dropped 5%+ on /compare/vs-amplitude and 2 others. Likely a competitor content refresh.",
    recommendedAction: { label: "Optimize pages", href: "/performance" },
    createdAt: hoursAgo(5),
    metric: "3 pages",
  },
  {
    id: "alert-2",
    type: "opportunity",
    severity: "success",
    title: "15 high-impact backlink opportunities ready",
    description:
      "New prospects with DA 80+ and strong topical relevance just surfaced for your published pages.",
    recommendedAction: { label: "Review opportunities", href: "/opportunities" },
    createdAt: hoursAgo(9),
    metric: "15 new",
  },
  {
    id: "alert-3",
    type: "broken-backlink",
    severity: "warning",
    title: "Backlink from nocode.tech is broken",
    description:
      "A previously live link now returns 404. Reach out to restore it before authority leaks.",
    recommendedAction: { label: "View backlink", href: "/opportunities" },
    createdAt: hoursAgo(26),
    metric: "1 link",
  },
  {
    id: "alert-4",
    type: "traffic-drop",
    severity: "warning",
    title: "Organic clicks down 8% on /integrations/segment",
    description:
      "Impressions held steady but CTR fell — the title/meta may need a refresh to match intent.",
    recommendedAction: { label: "Inspect page", href: "/performance" },
    createdAt: hoursAgo(31),
    metric: "-8%",
  },
  {
    id: "alert-5",
    type: "ai-underperform",
    severity: "info",
    title: "Underrepresented in Google AI Overviews",
    description:
      "Competitors are cited 2× more often for your core topics. Structured content could close the gap.",
    recommendedAction: { label: "See AI visibility", href: "/performance" },
    createdAt: hoursAgo(48),
    metric: "19% SOV",
  },
  {
    id: "alert-6",
    type: "lost-backlink",
    severity: "warning",
    title: "Lost a dofollow link from saasweekly.io",
    description:
      "An editor removed your citation during a roundup refresh. A quick re-outreach usually recovers these.",
    recommendedAction: { label: "Re-outreach", href: "/opportunities" },
    createdAt: hoursAgo(54),
    metric: "DA 71",
  },
  {
    id: "alert-7",
    type: "rank-drop",
    severity: "critical",
    title: "/pricing slipped off page one",
    description:
      "Dropped from #8 to #11 for its primary keyword after a SERP layout change. High-intent traffic at risk.",
    recommendedAction: { label: "Refresh content", href: "/performance" },
    createdAt: hoursAgo(62),
    metric: "#8 → #11",
  },
  {
    id: "alert-8",
    type: "opportunity",
    severity: "success",
    title: "Competitor gap: 6 unlinked brand mentions",
    description:
      "Six sites mention your brand without linking. These convert to backlinks at a high rate with one ask.",
    recommendedAction: { label: "Add links", href: "/opportunities" },
    createdAt: hoursAgo(70),
    metric: "6 mentions",
  },
];

/* ------------------------------------------------------- activity */

export const activity: ActivityEvent[] = [
  { id: "act-1", kind: "backlink-acquired", message: "New editorial backlink from openviewpartners.com (DA 76)", at: hoursAgo(3) },
  { id: "act-2", kind: "rank-improved", message: "/blog/north-star-metric moved #7 → #4 for “north star metric”", at: hoursAgo(7) },
  { id: "act-3", kind: "outreach-sent", message: "Outreach sent to 6 prospects in SaaS Media", at: hoursAgo(20) },
  { id: "act-4", kind: "backlink-acquired", message: "Listing approved on producthunt.com (DA 90)", at: hoursAgo(28) },
  { id: "act-5", kind: "page-optimized", message: "/product/analytics meta + schema refreshed", at: hoursAgo(34) },
  { id: "act-6", kind: "alert-resolved", message: "Resolved broken backlink on baremetrics.com", at: hoursAgo(52) },
  { id: "act-7", kind: "rank-improved", message: "/blog/cohort-retention-guide entered page 1 (#11 → #8)", at: hoursAgo(70) },
];
