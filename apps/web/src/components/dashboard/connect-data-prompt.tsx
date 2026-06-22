import Link from "next/link";
import { PlugZap, ArrowRight } from "lucide-react";

export interface ConnectSource {
  /** What lights up once connected, e.g. "Rankings & impressions". */
  metric: string;
  /** The integration that powers it, e.g. "Google Search Console". */
  source: string;
}

/**
 * Intentional empty-state for metric surfaces with no real data yet. Frames the
 * zeros as "not connected" rather than "failing", and names the integration that
 * turns each metric real. The provider seams are already wired server-side, so
 * connecting one flips the metric to live with no code change (CLAUDE.md seams).
 */
export function ConnectDataPrompt({
  title,
  description,
  sources,
  cta = { label: "Connect a data source", href: "/settings?tab=integrations" },
}: {
  title: string;
  description: string;
  sources: ConnectSource[];
  cta?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/12 text-brand">
          <PlugZap className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
          {sources.length > 0 && (
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {sources.map((s) => (
                <li key={s.metric} className="flex items-baseline gap-1.5 text-[12px]">
                  <span className="font-medium text-foreground">{s.metric}</span>
                  <span className="text-muted-foreground">— {s.source}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={cta.href}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-[13px] font-semibold text-background transition-colors hover:opacity-90"
          >
            {cta.label}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
