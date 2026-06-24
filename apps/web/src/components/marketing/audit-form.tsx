"use client";

import { useId, useState } from "react";
import { Globe, Mail, Loader2, Check, ArrowRight, AlertCircle } from "lucide-react";
import { pageEngineApi } from "@/lib/page-engine-client";
import { getVisitorId } from "@/lib/visitor";
import { trackOnboarding } from "@/lib/analytics";
import { validateWebsite, cn } from "@/lib/utils";
import { submitAuditLead } from "./audit-submit";

/**
 * Free AI-visibility audit lead capture — the marketing site's primary conversion.
 * Reuses the public lead endpoint (`captureLead` → POST /public/leads); the website
 * is validated client-side with the shared `validateWebsite` util and sent as the
 * lead message + company. Honest microcopy: public pages only, no card.
 */
export function AuditForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const websiteId = useId();
  const emailId = useId();
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateWebsite(website);
    if (!v.ok) {
      setError(v.reason === "empty" ? "Enter your website to get started." : v.reason === "local_or_private" ? "Use a publicly accessible website." : "Enter a valid domain, like example.com.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a work email so we can send your audit.");
      return;
    }
    setError(null);
    setState("sending");
    const result = await submitAuditLead(
      {
        email: email.trim(),
        company: v.domain,
        websiteUrl: v.url,
        sourceUrl: typeof window !== "undefined" ? window.location.href : "",
        visitorId: getVisitorId(),
      },
      {
        captureLead: (input) => pageEngineApi.captureLead(input),
        linkLeadVisitor: (leadId, visitorId) => pageEngineApi.linkLeadVisitor(leadId, visitorId),
        trackAuditStarted: (domain) => trackOnboarding({ event: "website_analysis_started", domain }),
      },
    );
    if (result.ok) {
      setState("done");
    } else {
      setError("We couldn't submit your request. Please try again in a moment.");
      setState("idle");
    }
  }

  const dark = tone === "dark";

  if (state === "done") {
    return (
      <div
        className={cn(
          "rounded-2xl border p-6 text-center shadow-card",
          dark ? "border-white/15 bg-white/10 backdrop-blur" : "border-border bg-card",
        )}
      >
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-positive/15 text-positive">
          <Check className="size-5" />
        </div>
        <h3 className={cn("mt-3 text-lg font-semibold", dark ? "text-white" : "text-foreground")}>Your audit is on the way</h3>
        <p className={cn("mt-1 text-sm", dark ? "text-white/70" : "text-muted-foreground")}>
          We&apos;ll review your AI visibility and email you what to fix first. No spam.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn(
        "rounded-2xl border p-4 shadow-raised sm:p-5",
        dark ? "border-white/15 bg-white/10 backdrop-blur-md" : "border-border bg-card",
      )}
    >
      <div className="grid gap-2.5">
        <label htmlFor={websiteId} className="sr-only">Website URL</label>
        <div className={cn("flex items-center gap-2.5 rounded-xl border px-3.5 transition-colors focus-within:ring-4 focus-within:ring-brand/20", error && !website ? "border-negative" : dark ? "border-white/20 bg-white/5 focus-within:border-brand" : "border-input bg-surface-sunken focus-within:border-brand")}>
          <Globe className={cn("size-[18px] shrink-0", dark ? "text-white/50" : "text-muted-foreground")} aria-hidden />
          <input
            id={websiteId}
            type="url"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="yourcompany.com"
            value={website}
            onChange={(e) => { setWebsite(e.target.value); if (error) setError(null); }}
            className={cn("h-12 w-full border-0 bg-transparent text-base outline-none placeholder:text-muted-foreground", dark ? "text-white placeholder:text-white/40" : "text-foreground")}
          />
        </div>
        <label htmlFor={emailId} className="sr-only">Work email</label>
        <div className={cn("flex items-center gap-2.5 rounded-xl border px-3.5 transition-colors focus-within:ring-4 focus-within:ring-brand/20", dark ? "border-white/20 bg-white/5 focus-within:border-brand" : "border-input bg-surface-sunken focus-within:border-brand")}>
          <Mail className={cn("size-[18px] shrink-0", dark ? "text-white/50" : "text-muted-foreground")} aria-hidden />
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
            className={cn("h-12 w-full border-0 bg-transparent text-base outline-none", dark ? "text-white placeholder:text-white/40" : "text-foreground")}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-sm text-negative">
          <AlertCircle className="size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="ease-expo mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-brand-foreground shadow-raised transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:opacity-70"
      >
        {state === "sending" ? <Loader2 className="size-5 animate-spin" /> : <>Get my free visibility audit <ArrowRight className="size-5" /></>}
      </button>
      <p className={cn("mt-2.5 text-center text-xs", dark ? "text-white/60" : "text-muted-foreground")}>
        Free audit · public pages only · no credit card
      </p>
    </form>
  );
}
