"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, Check, AlertTriangle, X, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

type AuditStatus = "pass" | "warn" | "fail";
interface Finding {
  id: string;
  label: string;
  status: AuditStatus;
  detail: string;
  recommendation: string;
}
interface AuditResult {
  url: string;
  score: number;
  grade: "A" | "B" | "C" | "D";
  findings: Finding[];
  crawled: boolean;
  auditedAt: string;
  error?: string;
}

// Self-contained client calls via the same /api/v1 proxy the app clients use.
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    headers: { accept: "application/json", "content-type": "application/json" },
    cache: "no-store",
    ...init,
  });
  const json = (await res.json()) as { success: boolean; data: T; errors?: { message: string }[] };
  if (!res.ok || !json.success) throw new Error(json.errors?.[0]?.message ?? `Request failed (${res.status})`);
  return json.data;
}

const STATUS: Record<AuditStatus, { cls: string; Icon: typeof Check }> = {
  pass: { cls: "text-positive", Icon: Check },
  warn: { cls: "text-warning", Icon: AlertTriangle },
  fail: { cls: "text-negative", Icon: X },
};
const GRADE_CLS: Record<AuditResult["grade"], string> = {
  A: "text-positive",
  B: "text-info",
  C: "text-warning",
  D: "text-negative",
};

export function ConversionAuditView() {
  const { notify } = useAppFeedback();
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);

  // Load the last audit on mount (no loading flash if none).
  useEffect(() => {
    let cancelled = false;
    call<{ audit: AuditResult | null }>("/conversion-audit")
      .then((d) => {
        if (!cancelled && d.audit) {
          setAudit(d.audit);
          setUrl(d.audit.url);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    if (!url.trim()) return;
    setRunning(true);
    try {
      const { audit: result } = await call<{ audit: AuditResult }>("/conversion-audit/run", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      });
      setAudit(result);
      if (result.error) notify({ kind: "error", title: "Couldn't audit that site", message: result.error });
      else notify({ kind: "success", title: `Conversion score ${result.score}/100 (${result.grade})` });
    } catch (err) {
      notify({ kind: "error", title: "Audit failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setRunning(false);
    }
  }

  const passes = audit?.findings.filter((f) => f.status === "pass").length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* run bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="https://yourcompany.com"
              className="h-11 w-full rounded-xl border border-border bg-surface-sunken pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:bg-card"
            />
          </div>
          <Button className="h-11 rounded-xl px-5" onClick={run} disabled={running || !url.trim()}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
            Run audit
          </Button>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Crawls the page (public, SSRF-guarded) and scores conversion readiness — capture form, CTA, headline, proof, and mobile.
        </p>
      </div>

      {audit && audit.crawled && (
        <div className="space-y-4">
          {/* score */}
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-sunken">
              <span className={cn("tnum text-3xl font-bold", GRADE_CLS[audit.grade])}>{audit.grade}</span>
              <span className="tnum text-[11px] text-muted-foreground">{audit.score}/100</span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground">Conversion readiness</div>
              <div className="truncate font-mono text-[12px] text-muted-foreground">{audit.url}</div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">
                {passes} of {audit.findings.length} checks passing.
              </div>
            </div>
          </div>

          {/* findings */}
          <div className="rounded-2xl border border-border bg-card p-2 shadow-card">
            {audit.findings.map((f) => {
              const s = STATUS[f.status];
              const Icon = s.Icon;
              return (
                <div key={f.id} className="flex items-start gap-3 rounded-xl p-3">
                  <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface-sunken", s.cls)}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-foreground">{f.label}</span>
                      <span className={cn("text-[11px] font-semibold uppercase", s.cls)}>{f.status}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{f.detail}</p>
                    {f.status !== "pass" && (
                      <p className="mt-1 text-[12.5px] text-foreground">
                        <span className="font-medium text-brand">Fix:</span> {f.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {audit && !audit.crawled && (
        <div className="rounded-2xl border border-negative/30 bg-negative/5 p-4 text-[13px] text-negative">
          {audit.error ?? "Couldn't reach that site."}
        </div>
      )}

      {!audit && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-[13px] text-muted-foreground">
          Enter a URL and run an audit to score its conversion readiness.
        </div>
      )}
    </div>
  );
}
