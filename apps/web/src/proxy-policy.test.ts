import assert from "node:assert/strict";
import test from "node:test";
import { resolveClerkProxyMode } from "./proxy-policy";

test("bypasses Clerk for public marketing routes when keys are absent", () => {
  assert.equal(
    resolveClerkProxyMode({
      requireAuth: true,
      hasPublishableKey: false,
      hasSecretKey: false,
      isPublic: true,
      isApi: false,
    }),
    "bypass",
  );
});

test("fails closed for protected production routes when keys are absent", () => {
  assert.equal(
    resolveClerkProxyMode({
      requireAuth: true,
      hasPublishableKey: false,
      hasSecretKey: false,
      isPublic: false,
      isApi: false,
    }),
    "unavailable",
  );
});

test("uses Clerk when both keys are configured", () => {
  assert.equal(
    resolveClerkProxyMode({
      requireAuth: true,
      hasPublishableKey: true,
      hasSecretKey: true,
      isPublic: false,
      isApi: false,
    }),
    "clerk",
  );
});
