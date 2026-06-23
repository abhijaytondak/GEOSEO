import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyStripeWebhookSignature } from "./billing-webhook";

const secret = "whsec_test_secret";
const body = Buffer.from(JSON.stringify({ id: "evt_1", type: "checkout.session.completed" }));

function signature(timestamp: number, payload = body): string {
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${payload.toString("utf8")}`)
    .digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

test("accepts a valid Stripe signature over the exact raw body", () => {
  const now = 1_750_000_000;
  assert.equal(verifyStripeWebhookSignature(body, signature(now), secret, now), true);
});

test("rejects a signature when the raw body changed", () => {
  const now = 1_750_000_000;
  const changed = Buffer.from(JSON.stringify({ id: "evt_2", type: "checkout.session.completed" }));
  assert.equal(verifyStripeWebhookSignature(changed, signature(now), secret, now), false);
});

test("rejects signatures outside the five minute replay window", () => {
  const signedAt = 1_750_000_000;
  assert.equal(verifyStripeWebhookSignature(body, signature(signedAt), secret, signedAt + 301), false);
});

