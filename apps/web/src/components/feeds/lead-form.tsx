"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { pageEngineApi } from "@/lib/page-engine-client";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-sm outline-none focus:border-ring focus:bg-card";

export function LeadForm({ slug, sourceUrl, brandName = "us" }: { slug: string; sourceUrl: string; brandName?: string }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    setState("sending");
    setError("");
    try {
      await pageEngineApi.captureLead({ ...form, slug, sourceUrl });
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-positive/12 text-positive">
          <Check className="size-5" />
        </div>
        <h3 className="mt-3 text-[15px] font-semibold text-foreground">Thanks — we&apos;ll be in touch</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">Your request reached the team. Expect a reply shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-[15px] font-semibold text-foreground">Talk to our team</h3>
      <p className="mt-0.5 text-[12.5px] text-muted-foreground">See it on your own data — book a quick walkthrough.</p>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <input className={inputCls} placeholder="Work email *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <input className={`${inputCls} mt-2.5`} placeholder="Company" value={form.company} onChange={(e) => set("company", e.target.value)} />
      <textarea
        className={`${inputCls} mt-2.5 h-auto resize-none py-2`}
        rows={3}
        placeholder="What are you trying to solve?"
        value={form.message}
        onChange={(e) => set("message", e.target.value)}
      />
      {error && <p className="mt-2 text-[12px] text-negative">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-cta px-4 text-[13px] font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Request a demo
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        By submitting you agree to be contacted about {brandName}. No spam.
      </p>
    </form>
  );
}
