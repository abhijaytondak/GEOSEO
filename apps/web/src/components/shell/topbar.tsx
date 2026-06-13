"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Bell, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { useAppFeedback } from "@/components/system/app-feedback";

const ranges = ["Last 30 days", "Last 8 weeks", "Last quarter"];

export function Topbar() {
  const router = useRouter();
  const { notify, startJob } = useAppFeedback();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(0);

  function runSearch() {
    const q = query.trim();
    if (!q) return;
    notify({ kind: "info", title: "Search ready", message: `Filtering opportunities for "${q}".` });
    router.push(`/opportunities?query=${encodeURIComponent(q)}`);
  }

  function cycleRange() {
    const next = (range + 1) % ranges.length;
    setRange(next);
    notify({ kind: "info", title: "Dashboard range updated", message: ranges[next] });
  }

  async function newCampaign() {
    await startJob("discover", "Creating a new backlink acquisition campaign.");
    router.push("/opportunities");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-5">
      {/* mobile nav trigger */}
      <MobileNav />

      {/* workspace switcher */}
      <button
        className="flex h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        onClick={() => router.push("/settings")}
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-brand/15 text-[11px] font-bold text-brand">
          NW
        </span>
        <span className="hidden sm:inline">Northwind Labs</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      {/* search */}
      <div className="relative ml-1 hidden max-w-sm flex-1 items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search pages, prospects, keywords…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") runSearch();
          }}
          className="h-9 w-full rounded-lg border border-border bg-surface-sunken pl-9 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card"
        />
        <kbd className="absolute right-2.5 hidden rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* date range */}
        <button
          className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted sm:flex"
          onClick={cycleRange}
        >
          <Calendar className="size-4 text-muted-foreground" />
          {ranges[range]}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>

        {/* notifications */}
        <button
          className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted"
          onClick={() => router.push("/alerts")}
          aria-label="Open alerts"
        >
          <Bell className="size-[18px] text-foreground" strokeWidth={2} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-negative ring-2 ring-card" />
        </button>

        {/* primary CTA — black pill */}
        <Button className="h-9 rounded-full px-3.5" size="lg" onClick={newCampaign}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">New campaign</span>
        </Button>

        {/* avatar */}
        <button
          className="ml-0.5 flex size-10 items-center justify-center rounded-full transition-transform hover:scale-105"
          onClick={() => router.push("/settings")}
          aria-label="Open workspace settings"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-info text-[12px] font-semibold text-white ring-2 ring-card">
            MC
          </span>
        </button>
      </div>
    </header>
  );
}
