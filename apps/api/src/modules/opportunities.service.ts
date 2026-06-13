import { Injectable, NotFoundException } from "@nestjs/common";
import type { BacklinkProspect, ProspectUpdate } from "@geoseo/types";

@Injectable()
export class OpportunitiesStore {
  private seq = 0;
  private discovered: BacklinkProspect[] = [];
  private updates = new Map<string, ProspectUpdate>();
  private archived = new Set<string>();

  list(base: BacklinkProspect[]): BacklinkProspect[] {
    return [...this.discovered, ...base]
      .filter((p) => !this.archived.has(p.id))
      .map((p) => ({ ...p, ...(this.updates.get(p.id) ?? {}) }));
  }

  update(id: string, update: ProspectUpdate, base: BacklinkProspect[]): BacklinkProspect {
    const existing = this.list(base).find((p) => p.id === id);
    if (!existing) throw new NotFoundException(`No backlink opportunity '${id}'`);
    const next = { ...(this.updates.get(id) ?? {}), ...update };
    this.updates.set(id, next);
    return { ...existing, ...next };
  }

  archive(id: string, base: BacklinkProspect[]) {
    const existing = this.list(base).find((p) => p.id === id);
    if (!existing) throw new NotFoundException(`No backlink opportunity '${id}'`);
    this.archived.add(id);
    return { id, archived: true };
  }

  discover(): BacklinkProspect {
    this.seq += 1;
    const templates = [
      ["martechseries.com", "Marketing Technology", 82, 86, 920_000, ["Marketing", "Editorial"]],
      ["saasworthy.com", "Review Platform", 77, 84, 680_000, ["Reviews", "Listing"]],
      ["productled.com", "Product Growth", 74, 91, 410_000, ["Product", "Guest"]],
    ] as const;
    const [domain, industry, da, rel, traffic, tags] = templates[(this.seq - 1) % templates.length];
    const prospect: BacklinkProspect = {
      id: `discovered-${this.seq}`,
      domain,
      url: `https://${domain}`,
      domainAuthority: da,
      relevanceScore: rel,
      impactScore: Math.round(da * 0.45 + rel * 0.4 + 72 * 0.15),
      trafficEstimate: traffic,
      industry,
      tags: [...tags],
      status: "new",
      contactEmail: `editor@${domain}`,
      rationale: "Newly discovered competitor-gap opportunity with strong topical overlap.",
    };
    this.discovered.unshift(prospect);
    return prospect;
  }
}
