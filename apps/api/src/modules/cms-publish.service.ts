import { Inject, Injectable, Logger } from "@nestjs/common";
import type { GeneratedPage } from "@geoseo/types";
import { DocStore } from "../db/db";
import { fetchWithTimeout } from "../common/http";
import { assertSafeUrl } from "../common/ssrf";
import { SettingsStore } from "./settings.service";

/** Record of a page pushed to an external CMS (additive side-store cx_cms_publish). */
export interface CmsPublishResult {
  pageId: string;
  provider: "wordpress" | "webflow" | "shopify";
  externalId: string;
  externalUrl: string;
  status: string;
  publishedAt: string;
}

type CmsState = { byPage: Record<string, CmsPublishResult> };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Inline emphasis: **bold** → <strong> (after escaping, so tags can't be injected). */
function inlineHtml(s: string): string {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

type Block = { type: "p" | "ul" | "ol"; items: string[] };

/** Parse section/FAQ copy into blocks — mirrors the web RichText parser so the
 *  blank-line paragraphs and "- " / "1." list markers the drafter emits survive
 *  the CMS/export path instead of collapsing into one flat paragraph. */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  const flush = () => {
    if (cur) blocks.push(cur);
    cur = null;
  };
  for (const raw of (text ?? "").replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const ul = line.match(/^[-*•]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ul) {
      if (!cur || cur.type !== "ul") {
        flush();
        cur = { type: "ul", items: [] };
      }
      cur.items.push(ul[1]);
    } else if (ol) {
      if (!cur || cur.type !== "ol") {
        flush();
        cur = { type: "ol", items: [] };
      }
      cur.items.push(ol[1]);
    } else {
      if (!cur || cur.type !== "p") {
        flush();
        cur = { type: "p", items: [] };
      }
      cur.items.push(line);
    }
  }
  flush();
  return blocks;
}

/** Copy → semantic HTML (<p>/<ul>/<ol>/<strong>), preserving the list structure. */
function blocksToHtml(text: string): string {
  return parseBlocks(text)
    .map((b) => {
      if (b.type === "ul") return `<ul>${b.items.map((i) => `<li>${inlineHtml(i)}</li>`).join("")}</ul>`;
      if (b.type === "ol") return `<ol>${b.items.map((i) => `<li>${inlineHtml(i)}</li>`).join("")}</ol>`;
      return `<p>${inlineHtml(b.items.join(" "))}</p>`;
    })
    .join("\n");
}

/**
 * Render a generated page to clean semantic HTML (hero image → hero copy →
 * sections → FAQ). Preserves bullet/numbered lists and bold so the design
 * structure survives a CMS push instead of flattening to plain paragraphs.
 * Shared by every CMS adapter AND the page export endpoint.
 */
export function renderHtml(page: GeneratedPage): string {
  const parts: string[] = [];
  if (page.heroImageUrl) {
    parts.push(`<figure><img src="${esc(page.heroImageUrl)}" alt="${esc(page.heroImageAlt ?? page.title)}" /></figure>`);
  }
  if (page.heroCopy) parts.push(blocksToHtml(page.heroCopy));
  for (const s of page.sections) parts.push(`<h2>${esc(s.heading)}</h2>`, blocksToHtml(s.body));
  if (page.faqs.length) {
    parts.push("<h2>Frequently asked questions</h2>");
    for (const f of page.faqs) parts.push(`<h3>${esc(f.q)}</h3>`, blocksToHtml(f.a));
  }
  return parts.filter(Boolean).join("\n");
}

/** Render a generated page to Markdown — for hand-coded / static / Jamstack sites
 *  and Framer CMS imports. The drafter already writes Markdown-ish copy ("- ",
 *  "1.", **bold**), so section bodies pass through as-is under generated headings. */
export function renderMarkdown(page: GeneratedPage): string {
  const out: string[] = [`# ${page.title}`, ""];
  if (page.metaDescription) out.push(`_${page.metaDescription}_`, "");
  if (page.heroImageUrl) out.push(`![${page.heroImageAlt ?? page.title}](${page.heroImageUrl})`, "");
  if (page.heroCopy) out.push(page.heroCopy.trim(), "");
  for (const s of page.sections) out.push(`## ${s.heading}`, "", (s.body ?? "").trim(), "");
  if (page.faqs.length) {
    out.push("## Frequently asked questions", "");
    for (const f of page.faqs) out.push(`### ${f.q}`, "", (f.a ?? "").trim(), "");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** Render a full, self-contained HTML document — what a hand-coded / static site
 *  can drop in directly or extract the <main> from. Lightweight, easy to restyle. */
export function renderStandaloneHtml(page: GeneratedPage): string {
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  };
  return [
    "<!doctype html>",
    `<html lang="en"><head>`,
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<title>${esc(page.metaTitle || page.title)}</title>`,
    page.metaDescription ? `<meta name="description" content="${esc(page.metaDescription)}" />` : "",
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    `<style>body{font:16px/1.6 system-ui,sans-serif;max-width:48rem;margin:0 auto;padding:2rem 1.25rem;color:#16181d}h1{line-height:1.15}img{max-width:100%;height:auto}</style>`,
    `</head><body>`,
    `<main><h1>${esc(page.title)}</h1>`,
    renderHtml(page),
    `</main></body></html>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * CMS publishing seam (PRD §8.3). **Wired, key-gated:** when WordPress creds
 * (`WORDPRESS_BASE_URL` + `WORDPRESS_USERNAME` + `WORDPRESS_APP_PASSWORD`) are set,
 * `publish()` pushes the page to the WordPress REST API and records the live URL;
 * otherwise it returns null and the caller keeps the managed `/feeds` destination.
 * Never throws — failures fall back to managed publishing.
 */
@Injectable()
export class CmsPublishStore {
  private readonly log = new Logger(CmsPublishStore.name);
  private cache = new Map<string, CmsState>();
  private db = new DocStore<CmsState>("cx_cms_publish");

  constructor(@Inject(SettingsStore) private readonly settingsStore: SettingsStore) {}

  private async state(tenantId: string): Promise<CmsState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { byPage: {} };
    this.cache.set(tenantId, loaded);
    return loaded;
  }
  private persist(tenantId: string, s: CmsState) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  /**
   * Resolve WordPress credentials: per-workspace stored creds take precedence over
   * env vars so users can configure from the UI without touching the server config.
   */
  private wpConfig(): { base: string; username: string; appPassword: string } | null {
    const stored = this.settingsStore?.get().integrations.find((i) => i.id === "wordpress")?.credentials;
    if (stored?.siteUrl && stored?.username && stored?.appPassword) {
      return { base: stored.siteUrl.replace(/\/+$/, ""), username: stored.username, appPassword: stored.appPassword };
    }
    if (process.env.WORDPRESS_BASE_URL && process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_APP_PASSWORD) {
      return {
        base: process.env.WORDPRESS_BASE_URL.replace(/\/+$/, ""),
        username: process.env.WORDPRESS_USERNAME,
        appPassword: process.env.WORDPRESS_APP_PASSWORD,
      };
    }
    return null;
  }

  /** Active CMS provider — explicit `CMS_PROVIDER` override, else auto-detected from creds. */
  get provider(): "wordpress" | "webflow" | "shopify" | "none" {
    const forced = process.env.CMS_PROVIDER?.toLowerCase();
    const wp = Boolean(this.wpConfig());
    const wf = Boolean(
      process.env.WEBFLOW_API_TOKEN && process.env.WEBFLOW_COLLECTION_ID && process.env.WEBFLOW_SITE_HOST,
    );
    const sh = Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN);
    if (forced === "wordpress") return wp ? "wordpress" : "none";
    if (forced === "webflow") return wf ? "webflow" : "none";
    if (forced === "shopify") return sh ? "shopify" : "none";
    if (wp) return "wordpress";
    if (wf) return "webflow";
    if (sh) return "shopify";
    return "none";
  }

  /**
   * Test a WordPress connection with the supplied credentials. Does a GET to
   * /wp-json/wp/v2/users/me which requires auth and returns the current user's
   * display name on success. SSRF-safe: the site URL is validated before connecting.
   */
  async testWordPress(siteUrl: string, username: string, appPassword: string): Promise<{ ok: boolean; user?: string; error?: string }> {
    let safeBase: string;
    try {
      safeBase = (await assertSafeUrl(siteUrl)).replace(/\/+$/, "");
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Invalid URL" };
    }
    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    try {
      const res = await fetchWithTimeout(
        `${safeBase}/wp-json/wp/v2/users/me`,
        { headers: { authorization: `Basic ${auth}`, accept: "application/json" } },
        10_000,
      );
      if (res.status === 401) return { ok: false, error: "Invalid username or application password" };
      if (res.status === 403) return { ok: false, error: "User does not have permission to use the REST API" };
      if (!res.ok) return { ok: false, error: `WordPress returned ${res.status}` };
      const json = (await res.json()) as { name?: string };
      return { ok: true, user: json.name };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
    }
  }

  get configured(): boolean {
    return this.provider !== "none";
  }

  async get(tenantId: string, pageId: string): Promise<CmsPublishResult | null> {
    return (await this.state(tenantId)).byPage[pageId] ?? null;
  }

  async list(tenantId: string): Promise<CmsPublishResult[]> {
    return Object.values((await this.state(tenantId)).byPage);
  }

  /** Push a page to the active CMS. Returns null when unconfigured or on any failure. */
  async publish(tenantId: string, page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
    switch (this.provider) {
      case "wordpress":
        return this.publishWordPress(tenantId, page, now);
      case "webflow":
        return this.publishWebflow(tenantId, page, now);
      case "shopify":
        return this.publishShopify(tenantId, page, now);
      default:
        return null;
    }
  }

  private async publishWordPress(tenantId: string, page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
    const config = this.wpConfig();
    if (!config) return null;
    const { base, username, appPassword } = config;
    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const existing = (await this.state(tenantId)).byPage[page.id];
    // Update in place if we've published this page before, else create.
    const url = existing
      ? `${base}/wp-json/wp/v2/posts/${encodeURIComponent(existing.externalId)}`
      : `${base}/wp-json/wp/v2/posts`;
    try {
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
        body: JSON.stringify({
          title: page.metaTitle || page.title,
          slug: page.slug.replace(/^\//, ""),
          status: "publish",
          content: renderHtml(page),
          excerpt: page.metaDescription,
        }),
      });
      if (!res.ok) {
        this.log.warn(`WordPress ${res.status} — keeping managed /feeds destination`);
        return null;
      }
      const json = (await res.json()) as { id?: number | string; link?: string; status?: string };
      if (json.id === undefined || !json.link) return null;
      const result: CmsPublishResult = {
        pageId: page.id,
        provider: "wordpress",
        externalId: String(json.id),
        externalUrl: json.link,
        status: json.status ?? "publish",
        publishedAt: now,
      };
      const s = await this.state(tenantId);
      s.byPage[page.id] = result;
      this.persist(tenantId, s);
      return result;
    } catch (err) {
      this.log.warn(`WordPress publish failed (${err instanceof Error ? err.message : "unknown"}) — managed fallback`);
      return null;
    }
  }

  private async publishWebflow(tenantId: string, page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
    const token = process.env.WEBFLOW_API_TOKEN!;
    const collectionId = process.env.WEBFLOW_COLLECTION_ID!;
    const base = (process.env.WEBFLOW_BASE_URL ?? "https://api.webflow.com").replace(/\/+$/, "");
    const host = process.env.WEBFLOW_SITE_HOST!.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const collPath = (process.env.WEBFLOW_COLLECTION_PATH ?? "").replace(/^\/+|\/+$/g, "");
    const contentField = process.env.WEBFLOW_CONTENT_FIELD ?? "post-body";
    const slug = page.slug.replace(/^\//, "");

    // Webflow CMS items are field-driven; `name` + `slug` are universal, the rich-text
    // field slug varies per collection (set WEBFLOW_CONTENT_FIELD to match yours).
    const fieldData: Record<string, unknown> = {
      name: page.metaTitle || page.title,
      slug,
      [contentField]: renderHtml(page),
    };
    if (process.env.WEBFLOW_SUMMARY_FIELD) fieldData[process.env.WEBFLOW_SUMMARY_FIELD] = page.metaDescription;

    try {
      const res = await fetchWithTimeout(`${base}/v2/collections/${encodeURIComponent(collectionId)}/items/live`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ isArchived: false, isDraft: false, fieldData }),
      });
      if (!res.ok) {
        this.log.warn(`Webflow ${res.status} — keeping managed /feeds destination`);
        return null;
      }
      const json = (await res.json()) as { id?: string; fieldData?: { slug?: string } };
      if (!json.id) return null;
      const finalSlug = json.fieldData?.slug ?? slug;
      const result: CmsPublishResult = {
        pageId: page.id,
        provider: "webflow",
        externalId: String(json.id),
        externalUrl: `https://${host}${collPath ? `/${collPath}` : ""}/${finalSlug}`,
        status: "published",
        publishedAt: now,
      };
      const s = await this.state(tenantId);
      s.byPage[page.id] = result;
      this.persist(tenantId, s);
      return result;
    } catch (err) {
      this.log.warn(`Webflow publish failed (${err instanceof Error ? err.message : "unknown"}) — managed fallback`);
      return null;
    }
  }

  private async publishShopify(tenantId: string, page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const token = process.env.SHOPIFY_ACCESS_TOKEN!;
    const version = process.env.SHOPIFY_API_VERSION ?? "2024-10";
    const publicHost = (process.env.SHOPIFY_PUBLIC_HOST ?? storeDomain).replace(/^https?:\/\//, "").replace(/\/+$/, "");
    // Admin host defaults to the store's https domain; SHOPIFY_ADMIN_BASE_URL overrides (proxy/self-host/test).
    const adminBase = (process.env.SHOPIFY_ADMIN_BASE_URL ?? `https://${storeDomain}`).replace(/\/+$/, "");
    const handle = page.slug.replace(/^\//, "");

    try {
      // Online Store "Pages" via the Admin REST API.
      const res = await fetchWithTimeout(`${adminBase}/admin/api/${version}/pages.json`, {
        method: "POST",
        headers: { "x-shopify-access-token": token, "content-type": "application/json" },
        body: JSON.stringify({
          page: { title: page.metaTitle || page.title, handle, body_html: renderHtml(page), published: true },
        }),
      });
      if (!res.ok) {
        this.log.warn(`Shopify ${res.status} — keeping managed /feeds destination`);
        return null;
      }
      const json = (await res.json()) as { page?: { id?: number | string; handle?: string } };
      const created = json.page;
      if (!created?.id) return null;
      const finalHandle = created.handle ?? handle;
      const result: CmsPublishResult = {
        pageId: page.id,
        provider: "shopify",
        externalId: String(created.id),
        externalUrl: `https://${publicHost}/pages/${finalHandle}`,
        status: "published",
        publishedAt: now,
      };
      const s = await this.state(tenantId);
      s.byPage[page.id] = result;
      this.persist(tenantId, s);
      return result;
    } catch (err) {
      this.log.warn(`Shopify publish failed (${err instanceof Error ? err.message : "unknown"}) — managed fallback`);
      return null;
    }
  }
}
