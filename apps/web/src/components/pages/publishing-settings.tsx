"use client";

import { useState } from "react";
import { Plug, Check, ExternalLink, ShieldCheck, History } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-brand" : "bg-muted")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

export function PublishingSettings() {
  const [requireApproval, setRequireApproval] = useState(true);
  const [autoSitemap, setAutoSitemap] = useState(true);
  const [autoLlms, setAutoLlms] = useState(true);

  return (
    <Sheet>
      <SheetTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted">
        <Plug className="size-4" />
        Publishing settings
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <SheetTitle className="text-lg">Publishing</SheetTitle>
          <SheetDescription>Where pages go live and how AI crawlers find them.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          {/* destination */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Destination</h3>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface-sunken p-3.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-positive/12 text-positive">
                <Check className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-foreground">Managed subdirectory</div>
                <div className="font-mono text-[12px] text-muted-foreground">northwindlabs.io/feeds/…</div>
              </div>
              <span className="rounded-full bg-positive/12 px-2 py-0.5 text-[11px] font-semibold text-positive">Active</span>
            </div>
          </section>

          {/* AI crawler surfaces */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Crawler surfaces</h3>
            <div className="mt-2 space-y-2">
              {[
                { label: "sitemap.xml", href: "/sitemap.xml", on: autoSitemap, set: setAutoSitemap },
                { label: "llms.txt", href: "/llms.txt", on: autoLlms, set: setAutoLlms },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[13px] font-medium text-foreground">{row.label}</div>
                    <div className="text-[11.5px] text-muted-foreground">Auto-updated on publish</div>
                  </div>
                  <a href={row.href} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-brand" aria-label={`View ${row.label}`}>
                    <ExternalLink className="size-4" />
                  </a>
                  <Toggle on={row.on} onChange={row.set} />
                </div>
              ))}
            </div>
          </section>

          {/* policy */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Policy</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
                  Require human approval before publish
                </div>
                <Toggle on={requireApproval} onChange={setRequireApproval} />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <History className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground">Rollback retention</div>
                  <div className="text-[11.5px] text-muted-foreground">Keep the last 10 published versions per page</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
