"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";
import { apiError, readApiEnvelope } from "@/lib/api-envelope";

type ImageKind = "hero" | "infographic" | "illustration" | "og";
interface GenImage {
  id: string;
  subject: string;
  kind: ImageKind;
  url: string;
  source: "openai" | "placeholder";
  createdAt: string;
}
const KINDS: ImageKind[] = ["hero", "infographic", "illustration", "og"];

export function BrandAssets() {
  const { notify } = useAppFeedback();
  const [images, setImages] = useState<GenImage[]>([]);
  const [siteImages, setSiteImages] = useState<string[]>([]);
  const [provider, setProvider] = useState<"openai" | "placeholder">("placeholder");
  const [subject, setSubject] = useState("");
  const [kind, setKind] = useState<ImageKind>("hero");
  const [gen, setGen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/images", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => readApiEnvelope<{ images: GenImage[]; provider?: "openai" | "placeholder" }>(r, "/images"))
      .then((jr) => {
        if (cancelled) return;
        const d = jr?.data;
        if (d) {
          setImages(d.images ?? []);
          setProvider(d.provider ?? "placeholder");
        }
      })
      .catch(() => {});
    // Real brand images scraped from the site (populated by Library → Extract from your site).
    fetch("/api/v1/brand-library", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => readApiEnvelope<{ library: { images?: string[] } }>(r, "/brand-library"))
      .then((jr) => {
        if (!cancelled) setSiteImages(jr?.data?.library?.images ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function generate() {
    const s = subject.trim();
    if (!s) return;
    setGen(true);
    try {
      const r = await fetch("/api/v1/images/generate", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ subject: s, kind }),
      });
      const jr = await readApiEnvelope<{ image: GenImage }>(r, "/images/generate");
      if (!r.ok || !jr.success) throw apiError(jr, r, "/images/generate");
      setImages((xs) => [jr.data!.image, ...xs]);
      setSubject("");
      notify({
        kind: "success",
        title: jr.data.image.source === "openai" ? "Image generated" : "Placeholder created",
        message: jr.data.image.source === "openai" ? undefined : "Set IMAGE_GEN_API_KEY for real generation.",
      });
    } catch (err) {
      notify({ kind: "error", title: "Generation failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setGen(false);
    }
  }

  // Hide theme-aware placeholders — they're previews, not real brand assets (dummy data removed per request).
  const realImages = images.filter((i) => i.source !== "placeholder");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-[13px] font-semibold text-foreground">Branded images &amp; infographics</h3>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Real images pulled from your site (run “Extract from your site” in the Library tab), plus on-brand AI generation.{" "}
          {provider === "openai" ? "Live AI generation is on." : "AI generation makes theme-aware placeholders until IMAGE_GEN_API_KEY is set."}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="What should the image show? (e.g. cohort retention chart)"
            className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ImageKind)}
            className="h-10 rounded-lg border border-border bg-background px-2 text-sm capitalize outline-none focus:border-ring"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <Button onClick={generate} disabled={gen || !subject.trim()} className="h-10">
            {gen ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate
          </Button>
        </div>
      </div>

      {siteImages.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-[13px] font-semibold text-foreground">From your site</h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Real brand images pulled from your website — used across generated pages instead of placeholders.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {siteImages.map((src) => (
              <div key={src} className="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary CDN URLs from the customer's site, not static assets */}
                <img src={src} alt="Brand image from your site" className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {realImages.length === 0 && siteImages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-[13px] text-muted-foreground">
          <ImagePlus className="mx-auto mb-2 size-6 opacity-50" />
          No assets yet — pull real images via Library → Extract from your site, or generate one above.
        </div>
      ) : realImages.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realImages.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary data:/CDN URLs, not static assets */}
              <img src={img.url} alt={img.subject} className="aspect-[1200/630] w-full object-cover" />
              <div className="p-3">
                <div className="truncate text-[12.5px] font-medium text-foreground">{img.subject}</div>
                <div className="mt-0.5 text-[11px] capitalize text-muted-foreground">
                  {img.kind} · {img.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
