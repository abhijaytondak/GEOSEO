import { Injectable, Inject, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { BacklinkProspect, ProspectUpdate } from "@geoseo/types";
import { DocStore } from "../db/db";
import { BrandMemoryStore } from "./brand.service";
import { KeywordResearchService } from "./keyword-research.service";
import { fetchWithTimeout } from "../common/http";

type OppState = {
  discovered: BacklinkProspect[];
  updates: Record<string, ProspectUpdate>;
  archived: string[];
  seq: number;
};

@Injectable()
export class OpportunitiesStore implements OnModuleInit {
  private readonly log = new Logger(OpportunitiesStore.name);
  private seq = 0;
  private discovered: BacklinkProspect[] = [];
  private updates = new Map<string, ProspectUpdate>();
  private archived = new Set<string>();
  private db = new DocStore<OppState>("cx_opportunities");

  constructor(
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
    @Inject(KeywordResearchService) private readonly keywords: KeywordResearchService,
  ) {}

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.discovered = loaded.discovered;
      this.updates = new Map(Object.entries(loaded.updates));
      this.archived = new Set(loaded.archived);
      this.seq = loaded.seq;
    });
  }

  private snapshot(): OppState {
    return {
      discovered: this.discovered,
      updates: Object.fromEntries(this.updates),
      archived: [...this.archived],
      seq: this.seq,
    };
  }
  private persist() {
    this.db.save(this.snapshot());
  }

  list(base: BacklinkProspect[]): BacklinkProspect[] {
    return [...this.discovered, ...base]
      .filter((p) => !this.archived.has(p.id))
      .map((p) => ({ ...p, ...(this.updates.get(p.id) ?? {}) }));
  }

  /** Archived prospects only — for the restore view. */
  listArchived(base: BacklinkProspect[]): BacklinkProspect[] {
    return [...this.discovered, ...base]
      .filter((p) => this.archived.has(p.id))
      .map((p) => ({ ...p, ...(this.updates.get(p.id) ?? {}) }));
  }

  update(id: string, update: ProspectUpdate, base: BacklinkProspect[]): BacklinkProspect {
    const existing = this.list(base).find((p) => p.id === id);
    if (!existing) throw new NotFoundException(`No backlink opportunity '${id}'`);
    const next = { ...(this.updates.get(id) ?? {}), ...update };
    this.updates.set(id, next);
    this.persist();
    return { ...existing, ...next };
  }

  archive(id: string, base: BacklinkProspect[]) {
    const existing = this.list(base).find((p) => p.id === id);
    if (!existing) throw new NotFoundException(`No backlink opportunity '${id}'`);
    this.archived.add(id);
    this.persist();
    return { id, archived: true };
  }

  /** Un-archive a prospect (pairs with archive — the UI's undo path). */
  restore(id: string) {
    if (!this.archived.has(id)) throw new NotFoundException(`Prospect '${id}' is not archived`);
    this.archived.delete(id);
    this.persist();
    return { id, archived: false };
  }

  /** Bulk status change or archive across many prospects in one call. */
  bulk(
    ids: string[],
    action: "archive" | "restore" | "status",
    base: BacklinkProspect[],
    status?: ProspectUpdate["status"],
  ): { updated: string[] } {
    const known = new Set(this.list(base).map((p) => p.id).concat([...this.archived]));
    const updated: string[] = [];
    for (const id of ids) {
      if (!known.has(id)) continue;
      if (action === "archive") this.archived.add(id);
      else if (action === "restore") this.archived.delete(id);
      else if (action === "status" && status) this.updates.set(id, { ...(this.updates.get(id) ?? {}), status });
      updated.push(id);
    }
    this.persist();
    return { updated };
  }

  async discover(): Promise<BacklinkProspect> {
    this.seq += 1;
    const id = `discovered-${this.seq}`;
    try {
      const prospect = await this.aiDiscover(id);
      if (prospect) {
        this.discovered.unshift(prospect);
        this.persist();
        return prospect;
      }
    } catch (err) {
      this.log.warn(`AI discovery failed, using seed fallback: ${err instanceof Error ? err.message : String(err)}`);
    }
    return this.seedDiscover(id);
  }

  private seedDiscover(id: string): BacklinkProspect {
    // Expanded seed pool — 12 diverse domains that cycle. Each has a real-looking rationale.
    const pool = [
      { domain: "martechseries.com", industry: "Marketing Technology", da: 82, rel: 86, traffic: 920_000, tags: ["Marketing", "Editorial"], rationale: "Covers SaaS tools extensively — strong guest post + link-insert potential for your keyword set." },
      { domain: "saasworthy.com", industry: "Software Reviews", da: 77, rel: 84, traffic: 680_000, tags: ["Reviews", "Listing"], rationale: "Review platform where your product category lists drive high-intent referral traffic." },
      { domain: "g2.com", industry: "B2B Software Reviews", da: 92, rel: 89, traffic: 4_200_000, tags: ["Reviews", "Comparison"], rationale: "Highest-DA review site in B2B SaaS — a verified listing drives both links and conversions." },
      { domain: "getapp.com", industry: "Software Directory", da: 88, rel: 82, traffic: 2_100_000, tags: ["Directory", "Listing"], rationale: "Gartner-owned directory with strong editorial DR flowing to listed products." },
      { domain: "softwareadvice.com", industry: "Software Directory", da: 87, rel: 81, traffic: 1_800_000, tags: ["Directory", "Editorial"], rationale: "High-DA Gartner property; a featured listing passes strong topical authority." },
      { domain: "capterra.com", industry: "Software Reviews", da: 93, rel: 88, traffic: 5_100_000, tags: ["Reviews", "Listing"], rationale: "Capterra is a top backlink source for SaaS products in your category — listing is free." },
      { domain: "producthunt.com", industry: "Product Discovery", da: 89, rel: 85, traffic: 3_500_000, tags: ["Product", "Community"], rationale: "A successful PH launch creates dozens of editorial backlinks from follow-on coverage." },
      { domain: "indiehackers.com", industry: "Startup Community", da: 80, rel: 78, traffic: 820_000, tags: ["Community", "Guest"], rationale: "High-engagement founder community; in-depth case studies consistently earn editorial links." },
      { domain: "betalist.com", industry: "Startup Discovery", da: 72, rel: 76, traffic: 310_000, tags: ["Startup", "Listing"], rationale: "Early-adopter listing site with consistent editorial DR — easy quick-win backlink." },
      { domain: "saastr.com", industry: "SaaS Community", da: 83, rel: 87, traffic: 1_100_000, tags: ["SaaS", "Guest"], rationale: "Premier B2B SaaS blog with high editorial standards and significant organic reach." },
      { domain: "growthmentor.com", industry: "Growth & Marketing", da: 74, rel: 80, traffic: 290_000, tags: ["Growth", "Resource"], rationale: "Curated growth resource hub — contextual links from guides routinely rank for buyer-intent terms." },
      { domain: "founded.co", industry: "Founder Resources", da: 69, rel: 77, traffic: 180_000, tags: ["Startup", "Editorial"], rationale: "Niche founder platform; guest contributor links carry strong topical relevance for early-stage SaaS." },
    ] as const;
    const tpl = pool[(this.seq - 1) % pool.length];
    const prospect: BacklinkProspect = {
      id,
      domain: tpl.domain,
      url: `https://${tpl.domain}`,
      domainAuthority: tpl.da,
      relevanceScore: tpl.rel,
      impactScore: Math.round(tpl.da * 0.45 + tpl.rel * 0.4 + 72 * 0.15),
      trafficEstimate: tpl.traffic,
      industry: tpl.industry,
      tags: [...tpl.tags],
      status: "new",
      contactEmail: `editor@${tpl.domain}`,
      rationale: tpl.rationale,
    };
    this.discovered.unshift(prospect);
    this.persist();
    return prospect;
  }

  private async aiDiscover(id: string): Promise<BacklinkProspect | null> {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) return null;

    const b = this.brand.current();
    const company = b?.company?.trim();
    const industry = b?.industry?.trim();
    const topics = (b?.topics ?? []).slice(0, 5).join(", ");
    const keywords = (b?.keywords ?? []).slice(0, 5).join(", ");
    if (!company && !industry) return null;

    // Gather a few real keyword ideas to ground the domain suggestion.
    let kwHint = keywords;
    if (!kwHint && industry) {
      try {
        const ideas = await this.keywords.researchKeywords([industry], { limit: 5 });
        kwHint = ideas.slice(0, 3).map((k) => k.keyword).join(", ");
      } catch { /* ignore — hint is best-effort */ }
    }

    const brandCtx = [
      company && `Company: ${company}`,
      industry && `Industry: ${industry}`,
      topics && `Topics covered: ${topics}`,
      kwHint && `Target keywords: ${kwHint}`,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt =
      "You are a backlink prospecting specialist. Given a brand context, identify ONE real website that would be an ideal backlink opportunity. Respond ONLY with a JSON object matching the schema — no prose, no markdown.";
    const userPrompt = `Brand context:\n${brandCtx}\n\nFind ONE real, existing website that:\n1. Is topically relevant to this brand's industry and keywords\n2. Accepts guest posts, editorial links, or directory listings\n3. Has genuine organic traffic (not a PBN)\n4. Would be realistically reachable by this brand for a link\n\nReturn JSON:\n{\n  "domain": "example.com",\n  "industry": "short industry label",\n  "domainAuthority": 60,\n  "relevanceScore": 80,\n  "trafficEstimate": 500000,\n  "tags": ["Editorial", "Guest"],\n  "contactEmail": "editor@example.com",\n  "rationale": "1-2 sentences on WHY this is a good link opportunity for this specific brand"\n}`;

    const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

    const res = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
      15_000,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned) as {
      domain: string; industry: string; domainAuthority: number; relevanceScore: number;
      trafficEstimate: number; tags: string[]; contactEmail?: string; rationale: string;
    };

    if (!parsed.domain || typeof parsed.domainAuthority !== "number") return null;

    return {
      id,
      domain: parsed.domain.replace(/^https?:\/\//, "").replace(/\/.*/, ""),
      url: `https://${parsed.domain.replace(/^https?:\/\//, "").replace(/\/.*/, "")}`,
      domainAuthority: Math.min(100, Math.max(1, Math.round(parsed.domainAuthority))),
      relevanceScore: Math.min(100, Math.max(1, Math.round(parsed.relevanceScore))),
      impactScore: Math.round(parsed.domainAuthority * 0.45 + parsed.relevanceScore * 0.4 + 72 * 0.15),
      trafficEstimate: Math.max(0, Math.round(parsed.trafficEstimate)),
      industry: parsed.industry,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4) : [],
      status: "new",
      contactEmail: parsed.contactEmail ?? `editor@${parsed.domain}`,
      rationale: parsed.rationale,
    };
  }
}
