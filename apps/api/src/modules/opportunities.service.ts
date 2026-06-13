import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { BacklinkProspect, ProspectUpdate } from "@geoseo/types";
import { DocStore } from "../db/db";

type OppState = {
  discovered: BacklinkProspect[];
  updates: Record<string, ProspectUpdate>;
  archived: string[];
  seq: number;
};

@Injectable()
export class OpportunitiesStore implements OnModuleInit {
  private seq = 0;
  private discovered: BacklinkProspect[] = [];
  private updates = new Map<string, ProspectUpdate>();
  private archived = new Set<string>();
  private db = new DocStore<OppState>("cx_opportunities");

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
    this.persist();
    return prospect;
  }
}
