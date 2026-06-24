export interface AuditLeadInput {
  email: string;
  company: string;
  websiteUrl: string;
  sourceUrl: string;
  visitorId: string;
}

interface AuditLeadDependencies {
  captureLead(input: {
    email: string;
    company: string;
    message: string;
    sourceUrl: string;
  }): Promise<{ id: string }>;
  linkLeadVisitor(leadId: string, visitorId: string): Promise<unknown>;
  trackAuditStarted(domain: string): void;
}

export async function submitAuditLead(
  input: AuditLeadInput,
  dependencies: AuditLeadDependencies,
): Promise<{ ok: true } | { ok: false }> {
  try {
    const lead = await dependencies.captureLead({
      email: input.email,
      company: input.company,
      message: `Free AI-visibility audit requested for ${input.websiteUrl}`,
      sourceUrl: input.sourceUrl,
    });
    void dependencies.linkLeadVisitor(lead.id, input.visitorId).catch(() => undefined);
    dependencies.trackAuditStarted(input.company);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
