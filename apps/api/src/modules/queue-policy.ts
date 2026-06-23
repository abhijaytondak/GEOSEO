import type { AppMode } from "../common/mode";

export function queuePolicy(input: { mode: AppMode; allowInMemory: boolean }): {
  durableRequired: boolean;
  simulationAllowed: boolean;
} {
  const simulationAllowed = input.mode === "demo" || input.allowInMemory;
  return { durableRequired: !simulationAllowed, simulationAllowed };
}

