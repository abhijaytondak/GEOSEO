"use client";

import { useState } from "react";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

const ranges = ["Last 8 weeks", "Last 30 days", "Last quarter"];

export function PerformanceActions() {
  const { notify, startJob } = useAppFeedback();
  const [index, setIndex] = useState(0);

  function cycleRange() {
    const next = (index + 1) % ranges.length;
    setIndex(next);
    notify({ kind: "info", title: "Date range updated", message: ranges[next] });
  }

  async function exportReport() {
    await startJob("export", `Preparing performance report for ${ranges[index]}.`);
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={cycleRange}>
        <Calendar className="size-4" />
        {ranges[index]}
      </Button>
      <Button variant="outline" className="h-9" onClick={exportReport}>
        <Download className="size-4" />
        Export
      </Button>
    </>
  );
}
