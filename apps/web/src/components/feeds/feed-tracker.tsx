"use client";

import { useEffect } from "react";
import { pageEngineApi } from "@/lib/page-engine-client";
import { getVisitorId, getSessionId } from "@/lib/visitor";

/**
 * Fires a `page_view` visitor event for a published /feeds page so the lead-journey
 * timeline reflects real visits (previously nothing ever produced journey data).
 * Fire-and-forget; failures are ignored.
 */
export function FeedTracker({ slug, pageId, title }: { slug: string; pageId?: string; title?: string }) {
  useEffect(() => {
    pageEngineApi
      .recordVisitorEvent({
        anonymousVisitorId: getVisitorId(),
        sessionId: getSessionId(),
        type: "page_view",
        url: typeof window !== "undefined" ? window.location.href : `/feeds${slug}`,
        pageId,
        title,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      })
      .catch(() => {});
  }, [slug, pageId, title]);
  return null;
}
