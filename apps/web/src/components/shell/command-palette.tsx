"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  Sparkles,
  Telescope,
  UserPlus,
  Activity,
  Gauge,
  Loader2,
  Clock,
  Link2,
  AlertTriangle,
  LineChart,
  FileText,
  UserRound,
  Settings,
  Workflow,
  History,
  type LucideIcon,
} from "lucide-react";
import type { SearchResult, SearchEntityType } from "@geoseo/types";
import { commandDestinations } from "./nav-config";
import { api } from "@/lib/api-client";
import { useAppFeedback } from "@/components/system/app-feedback";
import { cn } from "@/lib/utils";

/** Fired by the topbar search field (and ⌘K) to open the palette. */
export const COMMAND_EVENT = "geoseo:command-open";
const RECENTS_KEY = "geoseo:recent-search";

interface Command {
  id: string;
  label: string;
  group: "Go to" | "Actions";
  icon: LucideIcon;
  keywords?: string;
  run: () => void | Promise<void>;
}

/** Lucide icon names the search API returns → components. */
const RESULT_ICONS: Record<string, LucideIcon> = {
  Link2,
  AlertTriangle,
  LineChart,
  FileText,
  Telescope,
  UserRound,
  Activity,
  Settings,
  Sparkles,
  Workflow,
  History,
};

const TYPE_LABEL: Record<SearchEntityType, string> = {
  prospect: "Prospects",
  outreach: "Outreach",
  "tracked-page": "Tracked pages",
  alert: "Alerts",
  content: "Content",
  brand: "Brand Memory",
  setting: "Settings",
  "page-opportunity": "Opportunities",
  "generated-page": "Pages",
  lead: "Leads",
  job: "Jobs",
  audit: "Activity",
  command: "Actions",
};

const ENTITY_ORDER: SearchEntityType[] = [
  "alert",
  "prospect",
  "generated-page",
  "page-opportunity",
  "tracked-page",
  "lead",
  "content",
  "brand",
  "setting",
  "job",
  "audit",
  "outreach",
  "command",
];

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 6) : [];
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  const term = q.trim();
  if (typeof window === "undefined" || term.length < 2) return;
  try {
    const next = [term, ...readRecents().filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota/availability errors */
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  // Global ⌘K / Ctrl+K + topbar-search event open it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_EVENT, onOpen);
    };
  }, []);

  // Mount the palette only while open so its query/selection state is always
  // fresh per open — no reset-on-open effect needed.
  if (!open) return null;
  return <Palette onClose={() => setOpen(false)} />;
}

type Nav = { kind: "command"; cmd: Command } | { kind: "result"; res: SearchResult };

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { startJob, openJobs } = useAppFeedback();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  // Read once per open; pushRecent persists for the next open (palette closes on nav).
  const [recents] = useState<string[]>(() => readRecents());
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  // Focus the input after paint (no state writes — safe inside an effect).
  useEffect(() => {
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  // Debounced live search; stale responses are dropped via the request id.
  // State writes happen only inside the async callback (never synchronously in
  // the effect body); the empty-query case is cleared in the input handler.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const id = ++reqId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const res = await api.search(q, { limit: 20 });
      if (id === reqId.current) {
        setResults(res.results);
        setLoading(false);
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  const commands = useMemo<Command[]>(() => {
    const go: Command[] = commandDestinations.map((item) => ({
      id: `nav:${item.href}`,
      label: item.label,
      group: "Go to" as const,
      icon: item.icon,
      keywords: `${item.keywords ?? ""} ${item.href}`.trim(),
      run: () => router.push(item.href),
    }));
    const actions: Command[] = [
      {
        id: "act:audit",
        label: "Run site audit",
        group: "Actions",
        icon: Gauge,
        keywords: "authority scan check",
        run: async () => {
          await startJob("audit", "Running a full authority + content audit.");
          router.push("/home");
        },
      },
      {
        id: "act:discover",
        label: "Discover backlink prospects",
        group: "Actions",
        icon: Sparkles,
        keywords: "opportunities links outreach",
        run: () => router.push("/opportunities"),
      },
      {
        id: "act:generate",
        label: "Generate a page",
        group: "Actions",
        icon: Telescope,
        keywords: "page engine content research blueprint",
        run: () => router.push("/research"),
      },
      {
        id: "act:member",
        label: "Add a team member",
        group: "Actions",
        icon: UserPlus,
        keywords: "invite settings workspace seat",
        run: () => router.push("/settings"),
      },
      {
        id: "act:jobs",
        label: "View background jobs",
        group: "Actions",
        icon: Activity,
        keywords: "tasks queue progress",
        run: () => openJobs(),
      },
    ];
    return [...actions, ...go];
  }, [router, startJob, openJobs]);

  const typing = query.trim().length > 0;

  const matchingCommands = useMemo(() => {
    if (!typing) return commands;
    const q = query.trim().toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q),
    );
  }, [commands, query, typing]);

  // Group results by entity type, in a stable display order.
  const grouped = useMemo(() => {
    const by = new Map<SearchEntityType, SearchResult[]>();
    for (const r of results) {
      const list = by.get(r.type) ?? [];
      list.push(r);
      by.set(r.type, list);
    }
    return ENTITY_ORDER.filter((t) => by.has(t)).map((t) => ({ type: t, items: by.get(t)! }));
  }, [results]);

  // Flat, ordered navigable list (commands first, then results) for arrow keys.
  const navItems = useMemo<Nav[]>(() => {
    const cmds: Nav[] = matchingCommands.map((cmd) => ({ kind: "command", cmd }));
    if (!typing) return cmds;
    const res: Nav[] = grouped.flatMap((g) => g.items.map((res) => ({ kind: "result", res }) as Nav));
    return [...cmds, ...res];
  }, [matchingCommands, grouped, typing]);

  function openResult(res: SearchResult) {
    pushRecent(query);
    onClose();
    if (res.type === "job") {
      openJobs();
      return;
    }
    if (res.href) router.push(res.href);
  }

  function runAt(index: number) {
    const item = navItems[index];
    if (!item) return;
    if (item.kind === "command") {
      onClose();
      void item.cmd.run();
    } else {
      openResult(item.res);
    }
  }

  const cmdIndexOf = (cmd: Command) => navItems.findIndex((n) => n.kind === "command" && n.cmd.id === cmd.id);
  const resIndexOf = (res: SearchResult) => navItems.findIndex((n) => n.kind === "result" && n.res.id === res.id);

  const showRecents = !typing && recents.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-foreground/30 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-float"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              setActive(0);
              if (!v.trim()) {
                reqId.current++; // invalidate any in-flight request
                setResults([]);
                setLoading(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, navItems.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runAt(active);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Search pages, prospects, alerts, leads…"
            aria-label="Search GEOSEO"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <kbd className="rounded border border-border bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {/* recent searches (before typing) */}
          {showRecents && (
            <div className="mb-1 px-1">
              <div className="px-1.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">
                Recent
              </div>
              <div className="flex flex-wrap gap-1.5 px-1.5 pb-1.5">
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setQuery(r);
                      setActive(0);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Clock className="size-3" />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* commands */}
          {matchingCommands.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">
                {typing ? "Commands" : "Actions"}
              </div>
              {matchingCommands.map((cmd) => {
                const index = cmdIndexOf(cmd);
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => runAt(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors",
                      index === active ? "bg-muted text-foreground" : "text-foreground/90 hover:bg-muted/60",
                    )}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="flex-1">{cmd.label}</span>
                    {index === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* live result groups (while typing) */}
          {typing &&
            grouped.map((group) => (
              <div key={group.type} className="mb-1">
                <div className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">
                  {TYPE_LABEL[group.type]}
                </div>
                {group.items.map((res) => {
                  const index = resIndexOf(res);
                  const Icon = RESULT_ICONS[res.icon ?? ""] ?? Search;
                  return (
                    <button
                      key={res.id}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => runAt(index)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        index === active ? "bg-muted" : "hover:bg-muted/60",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-foreground">{res.title}</span>
                        {res.subtitle && (
                          <span className="block truncate text-[11.5px] text-muted-foreground">{res.subtitle}</span>
                        )}
                      </span>
                      {res.status && (
                        <span className="shrink-0 rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10.5px] font-medium capitalize text-muted-foreground">
                          {res.status}
                        </span>
                      )}
                      {index === active && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            ))}

          {/* empty state */}
          {typing && !loading && navItems.length === 0 && (
            <div className="px-3 py-10 text-center">
              <div className="text-sm text-muted-foreground">No results for “{query.trim()}”.</div>
              <div className="mt-2 text-[12px] text-muted-foreground/80">
                Try a domain, keyword, status, or a command like “run audit”.
              </div>
            </div>
          )}
        </div>

        {/* view-all footer → dedicated /search page */}
        {typing && (
          <button
            onClick={() => {
              pushRecent(query);
              onClose();
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }}
            className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span>View all results for “{query.trim()}”</span>
            <CornerDownLeft className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
