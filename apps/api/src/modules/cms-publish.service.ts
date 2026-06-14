import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { GeneratedPage } from "@geoseo/types";
import { DocStore } from "../db/db";

/** Record of a page pushed to an external CMS (additive side-store cx_cms_publish). */
export interface CmsPublishResult {
  pageId: string;
  provider: "wordpress";
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

  get configured(): boolean {
    return Boolean(
      process.env.WORDPRESS_BASE_URL && process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_APP_PASSWORD,
    );
  }

  get provider(): "wordpress" | "none" {
    return this.configured ? "wordpress" : "none";
  }

  get(pageId: string): CmsPublishResult | null {
    return this.byPage[pageId] ?? null;
  }

  list(): CmsPublishResult[] {
    return Object.values(this.byPage);
  }

  /** Push a page to WordPress. Returns null when unconfigured or on any failure. */
  async publish(page: GeneratedPage, now: string): Promise<CmsPublishResult | null> {
    if (!this.configured) return null;
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
}
