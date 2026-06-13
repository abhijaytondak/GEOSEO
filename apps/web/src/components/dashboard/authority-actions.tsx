"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

export function AuthorityActions() {
  const router = useRouter();
  const { startJob } = useAppFeedback();

  async function runAudit() {
    await startJob("audit");
  }

  async function acquireBacklinks() {
    await startJob("acquire-backlinks");
    router.push("/opportunities");
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={runAudit}>
        <Zap className="size-4" />
        Run audit
      </Button>
      <Button className="h-9 rounded-full px-4" onClick={acquireBacklinks}>
        <Sparkles className="size-4" />
        Acquire backlinks
      </Button>
    </>
  );
}
