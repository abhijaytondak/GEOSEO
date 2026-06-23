import assert from "node:assert/strict";
import test from "node:test";
import { queuePolicy } from "./queue-policy";

test("production without an explicit fallback requires a durable queue", () => {
  assert.deepEqual(queuePolicy({ mode: "production", allowInMemory: false }), {
    durableRequired: true,
    simulationAllowed: false,
  });
});

test("demo mode permits the in-memory job simulation", () => {
  assert.deepEqual(queuePolicy({ mode: "demo", allowInMemory: false }), {
    durableRequired: false,
    simulationAllowed: true,
  });
});

test("production permits simulation only when explicitly opted in", () => {
  assert.deepEqual(queuePolicy({ mode: "production", allowInMemory: true }), {
    durableRequired: false,
    simulationAllowed: true,
  });
});
