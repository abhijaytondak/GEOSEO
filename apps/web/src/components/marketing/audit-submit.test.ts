import assert from "node:assert/strict";
import test from "node:test";
import { submitAuditLead } from "./audit-submit";

test("reports failure when the lead endpoint rejects", async () => {
  const result = await submitAuditLead(
    {
      email: "buyer@example.com",
      company: "example.com",
      websiteUrl: "https://example.com",
      sourceUrl: "https://geoseo-tau.vercel.app/",
      visitorId: "visitor-1",
    },
    {
      captureLead: async () => {
        throw new Error("endpoint unavailable");
      },
      linkLeadVisitor: async () => undefined,
      trackAuditStarted: () => undefined,
    },
  );

  assert.deepEqual(result, { ok: false });
});

test("captures, links, and tracks a successful audit request", async () => {
  const calls: string[] = [];
  const result = await submitAuditLead(
    {
      email: "buyer@example.com",
      company: "example.com",
      websiteUrl: "https://example.com",
      sourceUrl: "https://geoseo-tau.vercel.app/",
      visitorId: "visitor-1",
    },
    {
      captureLead: async (input) => {
        calls.push(`capture:${input.company}:${input.sourceUrl}`);
        return { id: "lead-1" };
      },
      linkLeadVisitor: async (leadId, visitorId) => {
        calls.push(`link:${leadId}:${visitorId}`);
      },
      trackAuditStarted: (domain) => calls.push(`track:${domain}`),
    },
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, [
    "capture:example.com:https://geoseo-tau.vercel.app/",
    "link:lead-1:visitor-1",
    "track:example.com",
  ]);
});
