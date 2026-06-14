"use client";

import { useState } from "react";
import { Bot, Quote, FileText, Target, Link2, Search, RefreshCw, Sparkles } from "lucide-react";
import type { AiBotHit, AiMention, AiSearchOverview } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

export function AiSearchView({
  overview,
  mentions: initialMentions,
  botActivity,
}: {
  overview: AiSearchOverview;
  mentions: AiMention[];
  botActivity: { hits: AiBotHit[]; byBot: { bot: string; hits: number }[] };
}) {
  const { notify } = useAppFeedback();
  const [mentions, setMentions] = useState(initialMentions);
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);

  async function check() {
    if (!query.trim()) return;
    setChecking(true);
    try {
      const { recorded, live } = await api.checkAiMentions(query.trim());
      setMentions((m) => [...recorded, ...m]);
      notify({
        kind: live ? "success" : "info",
        title: live ? "Live citation check complete" : "Heuristic check (no provider connected)",
        message: `Recorded ${recorded.length} engine result(s) for “${query.trim()}”.`,
      });
      setQuery("");
    } catch (err) {
      notify({ kind: "error", title: "Check failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setChecking(false);
    }
  }

  const kpis = [
    { label: "Active pages", value: overview.activePages, icon: FileText },
    { label: "AI mentions", value: overview.aiMentions, icon: Quote },
    { label: "AI bot crawls", value: overview.botCrawls, icon: Bot },
    { label: "Qualified leads", value: overview.qualifiedLeads, icon: Target },
    { label: "Authority links", value: overview.authorityLinks, icon: Link2 },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-[13px] text-foreground">
        <span className="font-semibold">AI Search — beta.</span> Page creation, lead capture, and mention/bot tracking
        are live. Real per-engine citation tracking and AI-bot analytics activate once a monitoring provider is connected.
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{k.label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="tnum mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-foreground">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* AI mentions */}
        <Panel title="AI Mentions" description="Brand citations across AI answer engines" className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && check()}
                placeholder="Check a buyer query, e.g. “best product analytics tools”"
                className="h-10 w-full rounded-lg border border-border bg-surface-sunken pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-card"
              />
            </div>
            <Button className="h-10" disabled={checking || !query.trim()} onClick={check}>
              {checking ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Check
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {mentions.length === 0 && (
              <p className="py-8 text-center text-[13px] text-muted-foreground">No mention checks yet — run one above.</p>
            )}
            {mentions.slice(0, 12).map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <span className={cn("mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold capitalize", m.mentioned ? "bg-positive/12 text-positive" : "bg-muted text-muted-foreground")}>
                  {m.engine}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">{m.query}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {m.mentioned ? `Cited${m.position ? ` · pos ${m.position}` : ""}` : "Not cited"} · {m.source} · {relativeTime(m.checkedAt)}
                  </div>
                  {m.snippet && <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{m.snippet}</p>}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Bot activity */}
        <Panel title="AI Bot Crawls" description="AI crawlers fetching your pages">
          {botActivity.byBot.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              No AI-bot visits recorded yet. Once pages publish on your domain, GPTBot, PerplexityBot, ClaudeBot &amp;
              Google-Extended hits appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {botActivity.byBot.map((b) => (
                <div key={b.bot} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                    <Bot className="size-4 text-muted-foreground" /> {b.bot}
                  </span>
                  <span className="tnum text-[14px] font-semibold text-foreground">{b.hits}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
