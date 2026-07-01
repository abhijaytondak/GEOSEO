import type { InfographicSpec } from "@geoseo/types";

/**
 * Renders an in-page infographic as branded, theme-aware HTML/SVG (PRD Phase 6).
 * It inherits the page's `--brand`/surface CSS vars (set from the confirmed site
 * theme), so it's on-brand with zero config — and because it's real HTML/SVG
 * (not a raster image) AI crawlers can read every label and value.
 */
export function Infographic({ spec }: { spec: InfographicSpec }) {
  return (
    <figure className="mt-10 rounded-2xl border border-border bg-card p-5">
      <figcaption className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {spec.title}
      </figcaption>

      {spec.kind === "process-flow" && spec.steps && (
        <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
          {spec.steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2 sm:flex-1 sm:min-w-[140px]">
              <div className="flex h-full flex-1 items-center gap-3 rounded-xl border border-border bg-background p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-brand-foreground">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] font-semibold leading-tight text-foreground">{s.label}</div>
                  {s.detail && <div className="mt-0.5 text-[12px] text-muted-foreground">{s.detail}</div>}
                </div>
              </div>
              {i < spec.steps!.length - 1 && (
                <span aria-hidden className="hidden text-brand sm:inline">→</span>
              )}
            </li>
          ))}
        </ol>
      )}

      {spec.kind === "comparison-table" && spec.columns && spec.rows && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th scope="col" className="border-b border-border px-3 py-2 text-left font-semibold text-muted-foreground" />
                {spec.columns.map((c) => (
                  <th key={c} scope="col" className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spec.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="border-b border-border px-3 py-2 text-left font-medium text-foreground">{r.label}</th>
                  {r.cells.map((cell, j) => (
                    <td key={j} className="border-b border-border px-3 py-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {spec.kind === "stat-grid" && spec.stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {spec.stats.map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4 text-center">
              <div className="text-[22px] font-bold text-brand">{s.value}</div>
              <div className="mt-1 text-[12px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {spec.kind === "pros-cons" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ul className="rounded-xl border border-border bg-background p-4">
            {(spec.pros ?? []).map((p, i) => (
              <li key={i} className="flex gap-2 py-1 text-[13px] text-foreground">
                <span className="text-brand">+</span>
                {p}
              </li>
            ))}
          </ul>
          <ul className="rounded-xl border border-border bg-background p-4">
            {(spec.cons ?? []).map((c, i) => (
              <li key={i} className="flex gap-2 py-1 text-[13px] text-muted-foreground">
                <span>−</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  );
}
