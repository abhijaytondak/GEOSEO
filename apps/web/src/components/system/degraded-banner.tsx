"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Surfaces a persistent banner whenever the API client falls back to mock data
 * (demo-mode safety net). Without this, a dead/5xx API would silently render demo
 * data as if it were live — the exact "misleading" failure the audit flagged.
 * Listens for the `geoseo:degraded` CustomEvent dispatched by api-client's fallback.
 */
export function DegradedBanner() {
  const [degraded, setDegraded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onDegraded = () => setDegraded(true);
    window.addEventListener("geoseo:degraded", onDegraded);
    return () => window.removeEventListener("geoseo:degraded", onDegraded);
  }, []);

  if (!degraded || dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-warning/30 bg-warning/12 px-4 py-2 text-[12.5px] text-warning"
    >
      <AlertTriangle className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <strong className="font-semibold">Showing demo data.</strong> The live API is unreachable, so this view is
        using mock content — values are illustrative, not your real data.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-warning/20"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
