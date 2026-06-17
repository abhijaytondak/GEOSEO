import postgres from "postgres";
import { DEFAULT_TENANT_ID } from "../common/tenant";

/**
 * Postgres (Supabase) client. Null when DATABASE_URL is unset, so the app
 * degrades to pure in-memory state with no DB dependency.
 */
const url = process.env.DATABASE_URL;

export const sql = url
  ? postgres(url, { ssl: "require", max: 4, idle_timeout: 20, connect_timeout: 15 })
  : null;

export const dbEnabled = Boolean(sql);

/** Actively probe the DB connection (not just env presence) so /health can tell
 *  the truth: a configured DATABASE_URL whose host is unreachable (e.g. a Supabase
 *  DNS outage) reports `reachable: false`, and stores are running in-memory. */
export async function dbPing(): Promise<{ reachable: boolean; error?: string }> {
  if (!sql) return { reachable: false };
  try {
    await sql`select 1`;
    return { reachable: true };
  } catch (e) {
    return { reachable: false, error: (e as Error).message };
  }
}

/** Generic JSONB key-value table: `id text pk, data jsonb, updated_at`. One per entity.
 *  RLS is enabled (no policies) so the table is never reachable via Supabase's
 *  anon/PostgREST API — only this server's privileged `postgres` connection (which
 *  bypasses RLS) can touch it. Both statements are idempotent. */
export async function ensureTable(table: string): Promise<void> {
  if (!sql) return;
  await sql`
    create table if not exists ${sql(table)} (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
  await sql`alter table ${sql(table)} enable row level security`;
}

export async function loadAll<T>(table: string): Promise<T[]> {
  if (!sql) return [];
  const rows = await sql`select data from ${sql(table)} order by updated_at asc`;
  const out: T[] = [];
  for (const r of rows) {
    let v: unknown = r.data;
    // tolerate double-encoded rows (jsonb stored as a JSON string)
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        continue;
      }
    }
    if (v && typeof v === "object") out.push(v as T);
  }
  return out;
}

/** Like loadAll, but also returns each row's id — needed to partition multi-row tables
 *  by tenant (per-tenant row ids are prefixed `t:<tenant>:<id>`; default is un-prefixed). */
export async function loadAllWithIds<T>(table: string): Promise<{ id: string; data: T }[]> {
  if (!sql) return [];
  const rows = await sql`select id, data from ${sql(table)} order by updated_at asc`;
  const out: { id: string; data: T }[] = [];
  for (const r of rows) {
    let v: unknown = r.data;
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        continue;
      }
    }
    if (v && typeof v === "object") out.push({ id: r.id as string, data: v as T });
  }
  return out;
}

export async function upsert(table: string, id: string, data: unknown): Promise<void> {
  if (!sql) return;
  // `sql.json` lets postgres.js serialize the value exactly once into the jsonb
  // column. Passing a pre-stringified value (`JSON.stringify(data)::jsonb`)
  // double-encodes it — postgres.js re-serializes params bound to jsonb, so the
  // row ends up a JSON *string* (jsonb_typeof = 'string') instead of an object.
  await sql`
    insert into ${sql(table)} (id, data, updated_at)
    values (${id}, ${sql.json(data as Parameters<typeof sql.json>[0])}, now())
    on conflict (id) do update set data = excluded.data, updated_at = now()
  `;
}

export async function removeRow(table: string, id: string): Promise<void> {
  if (!sql) return;
  await sql`delete from ${sql(table)} where id = ${id}`;
}

export async function countRows(table: string): Promise<number> {
  if (!sql) return 0;
  const rows = await sql`select count(*)::int as n from ${sql(table)}`;
  return rows[0]?.n ?? 0;
}

/** Load a single document by id (tolerates double-encoded rows). */
export async function loadDoc<T>(table: string, id: string): Promise<T | null> {
  if (!sql) return null;
  const rows = await sql`select data from ${sql(table)} where id = ${id} limit 1`;
  let v: unknown = rows[0]?.data;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v && typeof v === "object" ? (v as T) : null;
}

/**
 * Single-document persistence for a store's whole state (one JSONB row id="state").
 * Hydrate-on-init, fire-and-forget write-through. Degrades to no-op without a DB.
 */
export class DocStore<S> {
  private ready = false;
  constructor(private readonly table: string) {}

  async init(seed: S, apply: (loaded: S) => void): Promise<void> {
    if (!sql) return;
    try {
      await ensureTable(this.table);
      const existing = await loadDoc<S>(this.table, "state");
      if (existing) apply(existing);
      else await upsert(this.table, "state", seed);
      this.ready = true;
    } catch (e) {
      // never crash the API on DB issues
      // eslint-disable-next-line no-console
      console.error(`[${this.table}] DB init failed, in-memory:`, (e as Error).message);
    }
  }

  save(state: S): void {
    if (!this.ready) return;
    void upsert(this.table, "state", state).catch((e) =>
      // eslint-disable-next-line no-console
      console.error(`[${this.table}] persist failed:`, (e as Error).message),
    );
  }

  /* --- Multi-tenant groundwork (docs/MULTI-TENANCY.md) ---
   * Per-tenant rows live in the SAME entity table under a tenant-scoped id; the
   * default tenant maps to the legacy "state" row so existing data needs no
   * migration. These are additive — adopt them per-store as services start
   * threading `tenantId` (from `req.tenantId`); the single-doc API above is the
   * `ws-default` special case. */

  /** Row id for a tenant's document. `ws-default` → the legacy "state" row. */
  static tenantRowId(tenantId: string): string {
    return tenantId === DEFAULT_TENANT_ID ? "state" : `t:${tenantId}`;
  }

  /** Hydrate a specific tenant's document (ensures the table exists). */
  async loadForTenant(tenantId: string): Promise<S | null> {
    if (!sql) return null;
    await ensureTable(this.table);
    this.ready = true;
    return loadDoc<S>(this.table, DocStore.tenantRowId(tenantId));
  }

  /** Write-through a specific tenant's document (fire-and-forget). */
  saveForTenant(tenantId: string, state: S): void {
    if (!sql) return;
    void upsert(this.table, DocStore.tenantRowId(tenantId), state).catch((e) =>
      // eslint-disable-next-line no-console
      console.error(`[${this.table}:${tenantId}] persist failed:`, (e as Error).message),
    );
  }
}
