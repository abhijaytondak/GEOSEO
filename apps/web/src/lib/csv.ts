/**
 * Tiny client-side CSV builder + download helper. Used by the Opportunities and
 * Performance "Export" actions to hand the user a real file (not just a job).
 */

export interface CsvColumn<T> {
  key: keyof T;
  header: string;
}

function escapeCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Quote anything containing a delimiter, quote, or newline; double internal quotes.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// `key: keyof T` already makes `row[c.key]` safe, so T needs no index-signature bound
// (a plain interface like SummaryRow doesn't satisfy Record<string, unknown>).
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(",")).join("\n");
  return `${head}\n${body}`;
}

/** Triggers a browser download of `content` as `filename`. */
export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8;"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** YYYY-MM-DD stamp for export filenames (UTC-safe, no locale surprises). */
export function dateStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
