import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { GeneratedPage } from "@geoseo/types";
import { DocStore } from "../db/db";

/** Record of a page pushed to an external CMS (additive side-store cx_cms_publish). */
export interface CmsPublishResult {
  pageId: string;
  provider: "wordpress" | "webflow";
  externalId: string;
  externalUrl: string;
  status: string;
  publishedAt: string;
}

type CmsState = { byPage: Record<string, CmsPublishResult> };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Render a generated page to clean WordPress post HTML (hero → sections → FAQ). */
function renderHtml(page: GeneratedPage): string {
  const parts = [`<p>${esc(page.heroCopy)}</p>`];
  for (const s of page.sections) parts.push(`<h2>${esc(s.heading)}</h2>`, `<p>${esc(s.body)}</p>`);
  if (page.faqs.length) {
    parts.push("<h2>Frequently asked questions</h2>");
    for (const f of page.faqs) parts.push(`<h3>${esc(f.q)}</h3>`, `<p>${esc(f.a)}</p>`);
  }
  return parts.join("\n");
}

/**
 * CMS publishing seam (PRD §8.3). **Wired, key-gated:** when WordPress creds
 * (`WORDPRESS_BASE_URL` + `WORDPRESS_USERNAME` + `WORDPRESS_APP_PASSWORD`) are set,
 * `publish()` pushes the page to the WordPress REST API and records the live URL;
 * otherwise it returns null and the caller keeps the managed `/feeds` destination.
 * Never throws — failures fall back to managed publishing.
 */
@Injectable()
export class CmsPublishStore implements OnModuleInit {
  private readonly log = new Logger(CmsPublishStore.name);
  private byPage: Record<string, CmsPublishResult> = {};
  private db = new DocStore<CmsState>("cx_cms_publish");

  async onModuleInit() {
    await this.db.init({ byPage: this.byPage }, (loaded) => {
      this.byPage = loaded.byPage ?? {};
    });
  }

  /** Active CMS provider — explicit `CMS_PROVIDER` override, else auto-detected from creds. */
  get provider(): "wordpress" | "webflow" | "none" {
    const forced = process.env.CMS_PROVIDER?.toLowerCase();
    const wp = Boolean(
      process.env.WORDPRESS_BASE_URL && process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_APP_PASSWORD,
    );
    const wf = Boolean(
      process.env.WEBFLOW_API_TOKEN && process.env.WEBFLOW_COLLECTION_ID && process.env.WEBFLOW_SITE_HOST,
    );
    if (forced === "wordpress") return wp ? "wordpress" : "none";
    if (forced === "webflow") return wf ? "webflow" : "none";
    if (wp) return "wordpress";
    if (wf) return "webflow";
    return "none";
  }

  get configured(): boolean {
    return this.provider !== "none";
  }

  get(pageId: string): CmsPublishResult | null {
    return this.byPage[pageId] ?? null;
  }

  list(): CmsPublishResult[] {
    return Object.values(this.byPage);
  }

  /** Push a page to the active CMS. Returns null when unconfigured or on any failure. */
  async publish(page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
    switch (this.provider) {
      case "wordpress":
        return this.publishWordPress(page, now);
      case "webflow":
        return this.publishWebflow(page, now);
      default:
        return null;
    }
  }

  private async publishWordPress(page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
    const base = process.env.WORDPRESS_BASE_URL!.replace(/\/+$/, "");
    const auth = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`).toString("base64");
    const existing = this.byPage[page.id];
    // Update in place if we've published this page before, else create.
    const url = existing
      ? `${base}/wp-json/wp/v2/posts/${encodeURIComponent(existing.externalId)}`
      : `${base}/wp-json/wp/v2/posts`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
        body: JSON.stringify({
          title: page.metaTitle || page.title,
          slug: page.slug.replace(/^\//, ""),
          status: "publish",
          content: renderHtml(page),
          excerpt: page.metaDescription,
        }),
      });
      clearTimeout(timer);
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
      this.byPage[page.id] = result;
      this.db.save({ byPage: this.byPage });
      return result;
    } catch (err) {
      this.log.warn(`WordPress publish failed (${err instanceof Error ? err.message : "unknown"}) — managed fallback`);
      return null;
    }
  }

  private async publishWebflow(page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
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
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(`${base}/v2/collections/${encodeURIComponent(collectionId)}/items/live`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ isArchived: false, isDraft: false, fieldData }),
      });
      clearTimeout(timer);
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
      this.byPage[page.id] = result;
      this.db.save({ byPage: this.byPage });
      return result;
    } catch (err) {
      this.log.warn(`Webflow publish failed (${err instanceof Error ? err.message : "unknown"}) — managed fallback`);
      return null;
    }
  }
}
