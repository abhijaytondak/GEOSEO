import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TOLERANCE_SECONDS = 300;

/** Verify Stripe's `t=...,v1=...` signature over the unmodified request body. */
export function verifyStripeWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
): boolean {
  if (!rawBody.length || !signatureHeader || !secret) return false;

  const fields = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestampRaw = fields.find(([key]) => key === "t")?.[1];
  const timestamp = Number(timestampRaw);
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest();

  return fields
    .filter(([key]) => key === "v1")
    .some(([, hex]) => {
      if (!/^[a-f0-9]{64}$/i.test(hex ?? "")) return false;
      const supplied = Buffer.from(hex, "hex");
      return supplied.length === expected.length && timingSafeEqual(supplied, expected);
    });
}

