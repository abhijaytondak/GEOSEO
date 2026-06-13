import type { BrandProfile } from "@geoseo/types";

/** Mirrors the API's weighted completeness so the editor meter updates live. */
export function brandCompleteness(p: BrandProfile): number {
  const checks: Array<[boolean, number]> = [
    [!!p.company, 10],
    [!!p.url, 8],
    [!!p.industry, 8],
    [!!p.valueProp && p.valueProp.length > 20, 16],
    [!!p.audience && p.audience.length > 20, 16],
    [p.topics.length >= 3, 12],
    [(p.differentiators?.length ?? 0) >= 2, 12],
    [(p.competitors?.length ?? 0) >= 1, 8],
    [(p.keywords?.length ?? 0) >= 3, 8],
    [!!p.contactName && !!p.contactEmail, 2],
  ];
  return checks.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0);
}
