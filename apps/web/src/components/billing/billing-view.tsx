"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { platformApi, type BillingStatus, type PlanId } from "@/lib/platform-client";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  none: { label: "No plan", cls: "bg-muted text-muted-foreground" },
  trialing: { label: "Trialing", cls: "bg-warning/15 text-warning" },
  active: { label: "Active", cls: "bg-positive/12 text-positive" },
  past_due: { label: "Past due", cls: "bg-destructive/12 text-destructive" },
  canceled: { label: "Canceled", cls: "bg-muted text-muted-foreground" },
};

function fmtLimit(n: number): string {
  return n === -1 ? "Unlimited" : n.toLocaleString();
}

export function BillingView() {
  const [data, setData] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<PlanId | "portal" | null>(null);

  const fetchStatus = () =>
    platformApi
      .getBillingStatus()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load billing."));
  useEffect(() => {
    void fetchStatus();
  }, []);
  const reload = () => {
    setError(null);
    void fetchStatus();
  };

  async function checkout(plan: PlanId) {
    setBusy(plan);
    try {
      const r = await platformApi.startCheckout(plan);
      if (r.url) window.location.assign(r.url);
      else setError(r.message ?? "Checkout is not available.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setBusy(null);
    }
  }

  async function portal() {
    setBusy("portal");
    try {
      const r = await platformApi.openPortal();
      if (r.url) window.location.assign(r.url);
      else setError(r.message ?? "The billing portal is not available.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the portal.");
    } finally {
      setBusy(null);
    }
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-[13px] text-foreground">
        <p className="font-semibold">Billing is unavailable.</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }
  if (!data) {
    return <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading billing…</div>;
  }

  const sub = data.subscription;
  const badge = STATUS_LABEL[sub.status] ?? STATUS_LABEL.none;

  return (
    <div className="space-y-5">
      {!data.configured && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-[13px] text-foreground">
          <span className="font-semibold">Billing is not connected.</span>{" "}
          <span className="text-muted-foreground">
            {data.message ?? "Set STRIPE_SECRET_KEY and plan price ids on the API to enable checkout."} Plans below are
            shown for reference — checkout activates once Stripe is configured.
          </span>
        </div>
      )}

      {/* current subscription */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-foreground">Current plan — {data.plan.label}</h3>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.cls)}>{badge.label}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {fmtLimit(data.plan.pagesPerMonth)} pages/mo · {fmtLimit(data.plan.leadsPerMonth)} leads/mo · {data.plan.teamSeats} seats
            {sub.currentPeriodEnd ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : ""}
          </p>
        </div>
        {data.configured && sub.source === "stripe" && (
          <Button variant="outline" size="sm" disabled={busy === "portal"} onClick={portal}>
            {busy === "portal" ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            Manage billing
          </Button>
        )}
      </div>

      {error && <p className="text-[12.5px] text-destructive">{error}</p>}

      {/* plans */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {data.plans.map((p) => {
          const current = p.id === data.plan.id;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-5 shadow-card",
                current ? "border-primary ring-1 ring-primary/30" : "border-border",
              )}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold text-foreground">{p.label}</h3>
                <div className="text-[13px] text-muted-foreground">
                  <span className="text-[20px] font-bold text-foreground tnum">${p.priceMonthlyUsd}</span>/mo
                </div>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-[12.5px] text-foreground">
                <li className="text-muted-foreground">{fmtLimit(p.pagesPerMonth)} pages/mo · {fmtLimit(p.leadsPerMonth)} leads/mo</li>
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5 w-full rounded-full"
                variant={current ? "outline" : "default"}
                disabled={current || busy === p.id || !data.configured}
                onClick={() => checkout(p.id)}
              >
                {busy === p.id ? <Loader2 className="size-4 animate-spin" /> : null}
                {current ? "Current plan" : !data.configured ? "Connect Stripe to enable" : (
                  <>Choose {p.label} <ExternalLink className="size-3.5" /></>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
