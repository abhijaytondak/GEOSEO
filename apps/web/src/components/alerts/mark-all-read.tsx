"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

export function MarkAllReadButton({ ids }: { ids: string[] }) {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");

  async function markAll() {
    if (ids.length === 0) return;
    setState("saving");
    try {
      await api.markAllAlertsRead(ids);
      setState("done");
      notify({ kind: "success", title: "Alerts marked read", message: `${ids.length} alerts updated.` });
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      notify({ kind: "error", title: "Could not mark alerts", message: err instanceof Error ? err.message : "Try again." });
      setState("idle");
    }
  }

  return (
    <Button variant="outline" className="h-9" onClick={markAll} disabled={state === "saving"}>
      {state === "saving" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="size-4 text-positive" />
      ) : (
        <CheckCheck className="size-4" />
      )}
      {state === "done" ? "All caught up" : "Mark all read"}
    </Button>
  );
}
