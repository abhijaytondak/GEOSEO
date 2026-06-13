import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { BrandProfile } from "@geoseo/types";
import { BrandMemoryStore } from "./brand.service";

/** Weighted Brand-Memory completeness (0–100) — drives the UI meter. */
export function completeness(p: BrandProfile): number {
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

/** The compiled context string injected into every downstream agent prompt. */
export function compiledContext(p: BrandProfile): string {
  const lines = [
    `Company: ${p.company} (${p.url})`,
    `Industry: ${p.industry}`,
    `Value proposition: ${p.valueProp}`,
    p.audience ? `Target audience: ${p.audience}` : null,
    p.differentiators?.length ? `Differentiators: ${p.differentiators.join("; ")}` : null,
    p.competitors?.length ? `Competitors: ${p.competitors.join(", ")}` : null,
    `Core topics: ${p.topics.join(", ")}`,
    p.keywords?.length ? `Target keywords: ${p.keywords.join(", ")}` : null,
    `Tone of voice: ${p.tone}`,
    `Primary contact: ${p.contactName} <${p.contactEmail}>`,
  ].filter(Boolean);
  return lines.join("\n");
}

const TONES = ["friendly", "professional", "concise"] as const;
const asStr = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const optStrArr = (v: unknown): string[] | undefined =>
  v === undefined ? undefined : asStrArr(v);

/** Defensive runtime coercion — never trusts body types, so malformed input
 *  (e.g. `topics: "x"`) can't reach `.join()` paths and crash the request. */
function validate(p: Record<string, unknown>): BrandProfile {
  if (!p || typeof p !== "object") throw new BadRequestException("Body required");
  const company = asStr(p.company).trim();
  const url = asStr(p.url).trim();
  if (!company) throw new BadRequestException("company is required");
  if (!url) throw new BadRequestException("url is required");
  const tone = TONES.includes(p.tone as (typeof TONES)[number])
    ? (p.tone as BrandProfile["tone"])
    : "professional";
  return {
    company,
    domain: asStr(p.domain) || url.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    url,
    valueProp: asStr(p.valueProp),
    topics: asStrArr(p.topics),
    industry: asStr(p.industry),
    tone,
    contactName: asStr(p.contactName),
    contactEmail: asStr(p.contactEmail),
    audience: p.audience === undefined ? undefined : asStr(p.audience),
    differentiators: optStrArr(p.differentiators),
    competitors: optStrArr(p.competitors),
    keywords: optStrArr(p.keywords),
  };
}

@ApiTags("brand-memory")
@Controller("brand-profile")
export class BrandController {
  constructor(@Inject(BrandMemoryStore) private readonly store: BrandMemoryStore) {}

  @Get()
  async get() {
    const profile = await this.store.getBrandProfile();
    return { profile, completeness: completeness(profile), context: compiledContext(profile) };
  }

  @Put()
  async update(@Body() body: Record<string, unknown>) {
    const profile = validate(body);
    const note = typeof body.note === "string" ? body.note : undefined;
    const version = await this.store.update(profile, note);
    return { version, completeness: completeness(profile), context: compiledContext(profile) };
  }

  @Get("versions")
  async versions() {
    return { versions: await this.store.getVersions() };
  }

  @Post("revert/:id")
  async revert(@Param("id") id: string) {
    const version = await this.store.revert(id);
    return { version, completeness: completeness(version.profile) };
  }

  /** Mock site crawl → draft Brand Memory (PRD §7.1 / §8.1). Returns a draft
   *  for review; does not persist until the user saves via PUT. */
  @Post("extract-from-site")
  extract(@Body() body: { url?: string }) {
    const url = (body?.url ?? "").trim();
    if (!url) throw new BadRequestException("url is required");
    const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const name = (domain.split(".")[0] || "Company").replace(/\b\w/g, (c) => c.toUpperCase());
    const draft: BrandProfile = {
      company: name,
      domain,
      url: url.startsWith("http") ? url : `https://${domain}`,
      industry: "Detected from site",
      valueProp: `${name} — extracted draft value proposition. Review and refine before saving.`,
      topics: ["overview", "product", "pricing"],
      tone: "professional",
      contactName: "",
      contactEmail: `hello@${domain}`,
      audience: "Detected audience segment — refine in review.",
      differentiators: ["Differentiator extracted from homepage", "Second differentiator"],
      competitors: [],
      keywords: [],
    };
    return { draft, completeness: completeness(draft), context: compiledContext(draft), source: domain };
  }
}
