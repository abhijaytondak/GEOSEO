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
import { safeFetchText } from "../common/ssrf";

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

  /** Real site crawl → draft Brand Memory (PRD §7.1 / §8.1). Fetches the
   *  homepage and parses <title>, meta description/og tags, and H1/H2 headings.
   *  Falls back to a domain-derived stub if the fetch fails. Returns a draft for
   *  review; does not persist until the user saves via PUT. */
  @Post("extract-from-site")
  async extract(@Body() body: { url?: string }) {
    const raw = (body?.url ?? "").trim();
    if (!raw) throw new BadRequestException("url is required");
    const normalized = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
    const domain = normalized.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const fallbackName = (domain.split(".")[0] || "Company").replace(/\b\w/g, (c) => c.toUpperCase());

    let title = "";
    let description = "";
    let siteName = "";
    const headings: string[] = [];
    let crawled = false;

    try {
      // SSRF-guarded fetch (PRD §19): rejects localhost/private/metadata hosts (→ 400),
      // manual redirect, size + time capped. Network failures fall back gracefully below.
      const { html } = await safeFetchText(raw, { maxBytes: 500_000, timeoutMs: 8000 });
      if (html) {
        const grab = (re: RegExp) => (html.match(re)?.[1] ?? "").trim();
        title = grab(/<title[^>]*>([^<]+)<\/title>/i);
        description =
          grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
          grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
        siteName = grab(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
        for (const m of html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)) {
          const text = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (text && text.length <= 60 && !headings.includes(text)) headings.push(text);
          if (headings.length >= 6) break;
        }
        crawled = true;
      }
    } catch (err) {
      // SSRF / invalid-URL rejections must surface; network/timeout falls back to the stub.
      if (err instanceof BadRequestException) throw err;
    }

    const company = siteName || title.split(/[|\-–·:]/)[0].trim() || fallbackName;
    const draft: BrandProfile = {
      company,
      domain,
      url: normalized,
      industry: "Detected from site — refine in review.",
      valueProp: description || `${company} — add your value proposition.`,
      topics: headings.length
        ? [...new Set(headings.map((h) => h.toLowerCase()))].slice(0, 6)
        : ["overview", "product", "pricing"],
      tone: "professional",
      contactName: "",
      contactEmail: `hello@${domain}`,
      audience: "Detected audience segment — refine in review.",
      differentiators: headings.slice(0, 3),
      competitors: [],
      keywords: [],
    };
    return {
      draft,
      completeness: completeness(draft),
      context: compiledContext(draft),
      source: domain,
      crawled,
    };
  }
}
