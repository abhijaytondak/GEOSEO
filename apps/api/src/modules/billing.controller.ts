import { Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BillingStore, type PlanId } from "./billing.service";
import { Public } from "../common/public.decorator";
import { Roles } from "../common/roles.decorator";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const PLAN_IDS = ["launch", "grow", "scale"] as const satisfies readonly PlanId[];

const CheckoutSchema = {
  plan: v.enumOf(PLAN_IDS),
  successUrl: v.optional(v.string({ max: 2048 })),
  cancelUrl: v.optional(v.string({ max: 2048 })),
  email: v.optional(v.email()),
};
const PortalSchema = { returnUrl: v.optional(v.string({ max: 2048 })) };

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").replace(/\/+$/, "");

/**
 * Billing endpoints (PRD §12). All workspace-scoped via the resolved tenant.
 * The webhook is public but guarded by a shared secret (STRIPE_WEBHOOK_SECRET).
 */
@ApiTags("billing")
@Controller("billing")
export class BillingController {
  constructor(@Inject(BillingStore) private readonly billing: BillingStore) {}

  @Get("status")
  async status(@Req() req: TenantRequest) {
    return this.billing.status(resolveTenantId(req));
  }

  @Roles("admin")
  @Post("checkout")
  async checkout(
    @Req() req: TenantRequest,
    @Body(validateBody(CheckoutSchema)) body: { plan: PlanId; successUrl?: string; cancelUrl?: string; email?: string },
  ) {
    return this.billing.checkout(resolveTenantId(req), body.plan, {
      successUrl: body.successUrl ?? `${APP_URL}/billing?status=success`,
      cancelUrl: body.cancelUrl ?? `${APP_URL}/billing?status=cancelled`,
      email: body.email,
    });
  }

  @Roles("admin")
  @Post("portal")
  async portal(@Req() req: TenantRequest, @Body(validateBody(PortalSchema)) body: { returnUrl?: string }) {
    return this.billing.portal(resolveTenantId(req), body.returnUrl ?? `${APP_URL}/billing`);
  }

  /**
   * Stripe webhook. Public, but requires the `STRIPE_WEBHOOK_SECRET` shared secret in
   * the `x-webhook-secret` header (when configured) so it can't be spoofed. Returns
   * `{ received: true }` regardless of relevance so Stripe doesn't retry valid events.
   */
  @Public()
  @Post("webhook")
  async webhook(
    @Req() req: TenantRequest,
    @Body() event: { type?: string; data?: { object?: Record<string, unknown> } },
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret) {
      const header = req.headers?.["x-webhook-secret"];
      const got = Array.isArray(header) ? header[0] : header;
      if (got !== secret) return { received: false, reason: "bad secret" };
    }
    if (!event?.type) return { received: false };
    const updated = await this.billing.applyWebhook({ type: event.type, data: event.data });
    return { received: true, updated: Boolean(updated) };
  }
}
