import { Injectable, Logger } from "@nestjs/common";
import { DocStore } from "../db/db";
import { fetchWithTimeout } from "../common/http";

/**
 * Billing & plan entitlements (PRD §12 / No-Dummy-Data PRD §7.8).
 *
 * **Greenfield, env-gated, per-tenant, never-throws.** With `STRIPE_SECRET_KEY`
 * set this talks to the live Stripe API (checkout sessions + billing portal) and
 * subscription state is updated from webhooks. Unconfigured, it reports an
 * **honest** unconfigured state (`status:"none"`, `configured:false`,
 * `setupRequired:true`) — it never invents a "Grow trial" the way the old static
 * `fallbackSettings.billing` did. Subscription state persists per workspace via
 * `DocStore.loadForTenant/saveForTenant` (the conversion-audit pattern).
 */

export type PlanId = "launch" | "grow" | "scale";
export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";

export interface PlanEntitlements {
  id: PlanId;
  label: string;
  priceMonthlyUsd: number;
  /** -1 = unlimited. */
  pagesPerMonth: number;
  leadsPerMonth: number;
  teamSeats: number;
  features: string[];
  stripePriceEnv: string; // env var holding the Stripe price id for this plan
}

export interface Subscription {
  workspaceId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  /** Stripe customer/subscription ids when live. */
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  source: "stripe" | "none";
  updatedAt: string;
}

export interface BillingStatus {
  configured: boolean;
  setupRequired: boolean;
  provider: "stripe" | "none";
  subscription: Subscription;
  plan: PlanEntitlements;
  plans: PlanEntitlements[];
  /** Human-readable reason when billing actions are unavailable. */
  message?: string;
}

export const PLANS: PlanEntitlements[] = [
  {
    id: "launch",
    label: "Launch",
    priceMonthlyUsd: 0,
    pagesPerMonth: 5,
    leadsPerMonth: 50,
    teamSeats: 1,
    features: ["Managed /feeds publishing", "Basic analytics", "1 workspace"],
    stripePriceEnv: "STRIPE_PRICE_LAUNCH",
  },
  {
    id: "grow",
    label: "Grow",
    priceMonthlyUsd: 99,
    pagesPerMonth: 50,
    leadsPerMonth: 1000,
    teamSeats: 5,
    features: ["CMS publishing", "Authority workflow", "CRM sync", "Team members"],
    stripePriceEnv: "STRIPE_PRICE_GROW",
  },
  {
    id: "scale",
    label: "Scale",
    priceMonthlyUsd: 299,
    pagesPerMonth: -1,
    leadsPerMonth: -1,
    teamSeats: 25,
    features: ["Multi-site", "Advanced analytics", "AI citation tracking", "Priority queues"],
    stripePriceEnv: "STRIPE_PRICE_SCALE",
  },
];

function planFor(id: PlanId): PlanEntitlements {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

type BillingState = { subscription: Subscription };

@Injectable()
export class BillingStore {
  private readonly log = new Logger(BillingStore.name);
  private cache = new Map<string, BillingState>();
  private db = new DocStore<BillingState>("cx_billing");

  get configured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  private freshSubscription(tenantId: string): Subscription {
    return {
      workspaceId: tenantId,
      plan: "launch",
      status: "none",
      source: "none",
      updatedAt: new Date().toISOString(),
    };
  }

  private async state(tenantId: string): Promise<BillingState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { subscription: this.freshSubscription(tenantId) };
    this.cache.set(tenantId, loaded);
    return loaded;
  }

  private commit(tenantId: string, subscription: Subscription): Subscription {
    const next: BillingState = { subscription };
    this.cache.set(tenantId, next);
    this.db.saveForTenant(tenantId, next);
    return subscription;
  }

  async status(tenantId: string): Promise<BillingStatus> {
    const sub = (await this.state(tenantId)).subscription;
    return {
      configured: this.configured,
      setupRequired: !this.configured,
      provider: this.configured ? "stripe" : "none",
      subscription: sub,
      plan: planFor(sub.plan),
      plans: PLANS,
      message: this.configured ? undefined : "Billing is not connected. Set STRIPE_SECRET_KEY to enable checkout.",
    };
  }

  /** Stripe-form-encode a flat params object (Stripe uses application/x-www-form-urlencoded). */
  private form(params: Record<string, string | undefined>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined) p.set(k, v);
    return p.toString();
  }

  private async stripe<T>(path: string, body: Record<string, string | undefined>): Promise<T | null> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    try {
      const res = await fetchWithTimeout(
        `https://api.stripe.com/v1${path}`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${key}`,
            "content-type": "application/x-www-form-urlencoded",
          },
          body: this.form(body),
        },
        15_000,
      );
      if (!res.ok) {
        this.log.warn(`Stripe ${path} → HTTP ${res.status}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      this.log.warn(`Stripe ${path} failed: ${err instanceof Error ? err.message : "unknown"}`);
      return null;
    }
  }

  /**
   * Create a Stripe Checkout session for `planId`. Returns the hosted checkout URL,
   * or a setup-required result when billing is not configured / Stripe fails — never
   * a fake success.
   */
  async checkout(
    tenantId: string,
    planId: PlanId,
    opts: { successUrl: string; cancelUrl: string; email?: string },
  ): Promise<{ url: string | null; setupRequired: boolean; message?: string }> {
    if (!this.configured) {
      return { url: null, setupRequired: true, message: "Billing is not connected (STRIPE_SECRET_KEY missing)." };
    }
    const plan = planFor(planId);
    const price = process.env[plan.stripePriceEnv];
    if (!price) {
      return {
        url: null,
        setupRequired: true,
        message: `No Stripe price configured for the ${plan.label} plan (set ${plan.stripePriceEnv}).`,
      };
    }
    const session = await this.stripe<{ url?: string; customer?: string }>("/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      customer_email: opts.email,
      "metadata[workspaceId]": tenantId,
      "subscription_data[metadata][workspaceId]": tenantId,
      client_reference_id: tenantId,
    });
    if (!session?.url) {
      return { url: null, setupRequired: false, message: "Stripe checkout could not be created. Try again." };
    }
    return { url: session.url, setupRequired: false };
  }

  /** Create a Stripe Billing Portal session so the customer can manage their plan. */
  async portal(tenantId: string, returnUrl: string): Promise<{ url: string | null; setupRequired: boolean; message?: string }> {
    if (!this.configured) {
      return { url: null, setupRequired: true, message: "Billing is not connected." };
    }
    const sub = (await this.state(tenantId)).subscription;
    if (!sub.customerId) {
      return { url: null, setupRequired: true, message: "No Stripe customer for this workspace yet — start a plan first." };
    }
    const session = await this.stripe<{ url?: string }>("/billing_portal/sessions", {
      customer: sub.customerId,
      return_url: returnUrl,
    });
    return session?.url
      ? { url: session.url, setupRequired: false }
      : { url: null, setupRequired: false, message: "Could not open the billing portal." };
  }

  /**
   * Apply a Stripe webhook event to the workspace subscription. Returns the updated
   * subscription, or null when the event is irrelevant / lacks workspace metadata.
   * (Signature verification is the controller's responsibility.)
   */
  async applyWebhook(event: { type: string; data?: { object?: Record<string, unknown> } }): Promise<Subscription | null> {
    const obj = event.data?.object ?? {};
    const tenantId =
      (obj.client_reference_id as string | undefined) ||
      ((obj.metadata as Record<string, string> | undefined)?.workspaceId);
    if (!tenantId) return null;

    const now = new Date().toISOString();
    const prev = (await this.state(tenantId)).subscription;
    const next: Subscription = { ...prev, workspaceId: tenantId, source: "stripe", updatedAt: now };

    switch (event.type) {
      case "checkout.session.completed":
        next.customerId = (obj.customer as string) ?? next.customerId;
        next.subscriptionId = (obj.subscription as string) ?? next.subscriptionId;
        next.status = "active";
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        next.customerId = (obj.customer as string) ?? next.customerId;
        next.subscriptionId = (obj.id as string) ?? next.subscriptionId;
        next.status = mapStripeStatus((obj.status as string) ?? "active");
        next.cancelAtPeriodEnd = Boolean(obj.cancel_at_period_end);
        const end = obj.current_period_end as number | undefined;
        if (typeof end === "number") next.currentPeriodEnd = new Date(end * 1000).toISOString();
        next.plan = planFromStripeItems(obj) ?? next.plan;
        break;
      }
      case "customer.subscription.deleted":
        next.status = "canceled";
        next.plan = "launch";
        break;
      default:
        return null;
    }
    return this.commit(tenantId, next);
  }
}

function mapStripeStatus(s: string): SubscriptionStatus {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "active";
  }
}

/** Best-effort: map the subscription's first price id back to a plan via env price ids. */
function planFromStripeItems(obj: Record<string, unknown>): PlanId | null {
  const items = (obj.items as { data?: { price?: { id?: string } }[] } | undefined)?.data ?? [];
  const priceId = items[0]?.price?.id;
  if (!priceId) return null;
  for (const plan of PLANS) {
    if (process.env[plan.stripePriceEnv] === priceId) return plan.id;
  }
  return null;
}
