export type ClerkProxyMode = "clerk" | "bypass" | "unavailable";

interface ClerkProxyPolicyInput {
  requireAuth: boolean;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  isPublic: boolean;
  isApi: boolean;
}

export function resolveClerkProxyMode(input: ClerkProxyPolicyInput): ClerkProxyMode {
  if (input.hasPublishableKey && input.hasSecretKey) return "clerk";
  if (!input.requireAuth || input.isPublic || input.isApi) return "bypass";
  return "unavailable";
}
