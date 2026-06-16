"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { OnboardingStatus } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STEPS: { key: keyof OnboardingStatus["steps"]; label: string }[] = [
  { key: "websiteScanned", label: "Website scanned" },
  { key: "brandSaved", label: "Brand Memory saved" },
  { key: "themeScanned", label: "Site theme captured" },
  { key: "publishingConfigured", label: "Publishing configured" },
  { key: "opportunitiesSeeded", label: "Opportunities seeded" },
];

/** Setup-health checklist for Home (docs/PRD-workflow-navigation-optimization.md
 *  §6.1). Self-fetching so it composes into the dashboard without touching its
 *  server load. Surfaces how ready the workspace is to generate leads. */
export function SetupHealth() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    api
      .getOnboardingStatus()
      .then((s) => {
        if (live) {
          setStatus(s);
          setLoading(false);
        }
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const steps = status?.steps;
  const done = steps ? STEPS.filter((s) => steps[s.key]).length : 0;
  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-foreground">Setup health</div>
        {!loading && (
          <span className="tnum text-[12.5px] font-semibold text-muted-foreground">
            {done}/{STEPS.length} · {pct}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-6 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {STEPS.map((s) => {
              const ok = !!steps?.[s.key];
              return (
                <div key={s.key} className="flex items-center gap-2 text-[13px]">
                  {ok ? (
                    <CheckCircle2 className="size-4 shrink-0 text-positive" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                </div>
              );
            })}
          </div>
          {pct < 100 && (
            <Link
              href="/onboarding"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Finish setup
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
