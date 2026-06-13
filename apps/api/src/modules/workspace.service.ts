import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { Workspace } from "@geoseo/types";
import { DocStore } from "../db/db";

type WorkspaceState = { workspaces: Workspace[]; seq: number };

/** Tenant-root CRUD (PRD §11.1). Persisted to Supabase (cx_workspaces) with the
 *  same hydrate-on-boot + write-through pattern as the other stores. Seeds one
 *  default workspace so the single-tenant prototype keeps working. */
@Injectable()
export class WorkspaceStore implements OnModuleInit {
  private seq = 1;
  private workspaces: Workspace[] = [
    {
      id: "ws-default",
      name: "Northwind Labs",
      domain: "northwindlabs.io",
      industry: "B2B SaaS · Analytics",
      status: "active",
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z",
    },
  ];
  private db = new DocStore<WorkspaceState>("cx_workspaces");

  async onModuleInit() {
    await this.db.init({ workspaces: this.workspaces, seq: this.seq }, (loaded) => {
      this.workspaces = loaded.workspaces;
      this.seq = loaded.seq;
    });
  }

  private persist() {
    this.db.save({ workspaces: this.workspaces, seq: this.seq });
  }

  list(): Workspace[] {
    return this.workspaces;
  }

  get(id: string): Workspace {
    const ws = this.workspaces.find((w) => w.id === id);
    if (!ws) throw new NotFoundException(`Workspace ${id} not found`);
    return ws;
  }

  create(input: { name: string; domain: string; industry?: string }): Workspace {
    this.seq += 1;
    const now = new Date().toISOString();
    const ws: Workspace = {
      id: `ws-${this.seq}`,
      name: input.name,
      domain: input.domain,
      industry: input.industry ?? "",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    this.workspaces.unshift(ws);
    this.persist();
    return ws;
  }

  update(id: string, update: Partial<Omit<Workspace, "id" | "createdAt">>): Workspace {
    const ws = this.get(id);
    Object.assign(ws, {
      name: update.name ?? ws.name,
      domain: update.domain ?? ws.domain,
      industry: update.industry ?? ws.industry,
      status: update.status ?? ws.status,
      updatedAt: new Date().toISOString(),
    });
    this.persist();
    return ws;
  }
}
