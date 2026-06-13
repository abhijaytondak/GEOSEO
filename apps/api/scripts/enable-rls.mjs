/**
 * One-off security migration: enable Row-Level Security on every GEOSEO table.
 *
 * Without RLS, anything holding the Supabase anon key can read/write these tables
 * via the auto-generated PostgREST API. Enabling RLS with NO policies makes them
 * unreachable by anon/authenticated roles, while this server's privileged
 * `postgres` connection (DATABASE_URL) bypasses RLS and keeps working.
 *
 * Run:  node --env-file=.env scripts/enable-rls.mjs   (from apps/api)
 * Idempotent — safe to re-run.
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set — nothing to do.");
  process.exit(1);
}

// Fixed allowlist (no user input) — the cx_* (this account) + pe_* (page-engine) tables.
const TABLES = [
  "cx_brand",
  "cx_settings",
  "cx_jobs",
  "cx_alerts",
  "cx_opportunities",
  "cx_content",
  "pe_blueprints",
  "pe_leads",
  "pe_opportunities",
  "pe_versions",
  "pe_pages",
  "pe_audit",
];

const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 15 });

try {
  for (const t of TABLES) {
    // IF EXISTS so it tolerates any table that hasn't been created yet.
    await sql.unsafe(`alter table if exists public."${t}" enable row level security`);
  }

  const rows = await sql`
    select relname, relrowsecurity, relforcerowsecurity
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = any(${sql.array(TABLES)})
    order by relname
  `;

  let onCount = 0;
  console.log("table                  rls_enabled");
  console.log("---------------------- -----------");
  for (const r of rows) {
    if (r.relrowsecurity) onCount++;
    console.log(`${r.relname.padEnd(22)} ${r.relrowsecurity ? "✅ ON" : "❌ OFF"}`);
  }
  const missing = TABLES.filter((t) => !rows.some((r) => r.relname === t));
  if (missing.length) console.log(`\n(not present in DB, skipped: ${missing.join(", ")})`);
  console.log(`\nRLS enabled on ${onCount}/${rows.length} present tables.`);
} catch (e) {
  console.error("RLS migration failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
