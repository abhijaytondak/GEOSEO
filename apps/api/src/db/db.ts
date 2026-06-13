import postgres from "postgres";

/**
 * Postgres (Supabase) client. Null when DATABASE_URL is unset, so the app
 * degrades to pure in-memory state with no DB dependency.
 */
const url = process.env.DATABASE_URL;

export const sql = url
  ? postgres(url, { ssl: "require", max: 4, idle_timeout: 20, connect_timeout: 15 })
  : null;

export const dbEnabled = Boolean(sql);

/** Generic JSONB key-value table: `id text pk, data jsonb, updated_at`. One per entity. */
export async function ensureTable(table: string): Promise<void> {
  if (!sql) return;
  await sql`
    create table if not exists ${sql(table)} (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
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

export async function upsert(table: string, id: string, data: unknown): Promise<void> {
  if (!sql) return;
  await sql`
    insert into ${sql(table)} (id, data, updated_at)
    values (${id}, ${JSON.stringify(data)}::jsonb, now())
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
