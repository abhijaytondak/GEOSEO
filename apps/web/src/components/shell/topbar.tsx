"use client";

import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Plus } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { COMMAND_EVENT } from "./command-palette";
import { useAppFeedback } from "@/components/system/app-feedback";

/** 1–2 letter initials from a workspace name (e.g. "Northwind Labs" → "NL"). */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "WS";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Topbar({ workspaceName }: { workspaceName?: string }) {
  const router = useRouter();
  const { startJob } = useAppFeedback();
  const wsName = workspaceName?.trim() || "Workspace";

  function openCommand() {
    window.dispatchEvent(new Event(COMMAND_EVENT));
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
          {initialsOf(wsName)}
        </span>
        <span className="hidden sm:inline">{wsName}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      {/* search → opens command palette */}
      <button
        type="button"
        onClick={openCommand}
        className="group relative ml-1 hidden h-9 max-w-sm flex-1 items-center rounded-lg border border-border bg-surface-sunken pl-9 pr-12 text-left text-sm text-muted-foreground/70 outline-none transition-colors hover:bg-card focus-visible:border-ring md:flex"
      >
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        Search pages, prospects, keywords…
        <kbd className="absolute right-2.5 hidden rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
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

        {/* auth (Clerk) */}
        <Show when="signed-out">
          <div className="flex items-center gap-1.5">
            <SignInButton mode="modal">
              <button className="h-9 rounded-lg px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="h-9 rounded-lg border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted">
                Sign up
              </button>
            </SignUpButton>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="ml-0.5">
            <UserButton />
          </div>
        </Show>
      </div>
    </header>
  );
}
