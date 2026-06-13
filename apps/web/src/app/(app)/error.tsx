"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-negative/10 text-negative">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Something did not load</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {error.message || "The dashboard hit an unexpected state. Try reloading this view."}
        </p>
        <Button className="mt-5 rounded-full" onClick={reset}>
          <RotateCcw className="size-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
