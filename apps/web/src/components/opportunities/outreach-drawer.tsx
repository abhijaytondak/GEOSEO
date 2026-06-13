"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Sparkles, RefreshCw, Eye, Pencil, Mail, Save } from "lucide-react";
import { api } from "@/lib/api-client";
import type { BacklinkProspect, BrandProfile, OutreachTemplate } from "@geoseo/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusPill } from "./status-pill";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

interface Props {
  prospect: BacklinkProspect | null;
  brand: BrandProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Draft = { subject: string; body: string };

export function OutreachDrawer({ prospect, brand, open, onOpenChange }: Props) {
  const { notify } = useAppFeedback();
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [active, setActive] = useState<string>("");
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Loading is derived — no synchronous setState in the effect.
  const loading = !!prospect && open && loadedFor !== prospect.id;

  useEffect(() => {
    if (!prospect || !open) return;
    let cancelled = false;
    api.getOutreachTemplates(prospect.id).then((t) => {
      if (cancelled) return;
      setTemplates(t);
      setDrafts(
        Object.fromEntries(t.map((v) => [v.id, { subject: v.subject, body: v.body }])),
      );
      setActive(t[0]?.id ?? "");
      setPreview(false);
      setLoadedFor(prospect.id);
    });
    return () => {
      cancelled = true;
    };
  }, [prospect, open]);

  function copy(kind: "subject" | "body", text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1400);
  }

  async function saveDraft() {
    if (!active || !current) return;
    setSaving(true);
    try {
      await api.updateOutreachTemplate(active, current);
      notify({ kind: "success", title: "Draft saved", message: "Your edited outreach template was saved." });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  const current = drafts[active];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-xl"
      >
        {prospect && (
          <>
            <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand">
                <Sparkles className="size-3.5" />
                AI-drafted outreach
              </div>
              <SheetTitle className="mt-1 flex items-center gap-2 text-lg">
                {prospect.domain}
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                  DA {prospect.domainAuthority}
                </span>
                <StatusPill status={prospect.status} />
              </SheetTitle>
              <SheetDescription>
                Variables filled from Brand Memory ·{" "}
                <span className="font-medium text-foreground">{brand.company}</span>
              </SheetDescription>
            </SheetHeader>

            {loading || !current ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Drafting variants…
              </div>
            ) : (
              <Tabs
                value={active}
                onValueChange={setActive}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-center justify-between gap-3 px-6 pt-4">
                  <TabsList>
                    {templates.map((t) => (
                      <TabsTrigger key={t.id} value={t.id}>
                        {t.variantName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreview((p) => !p)}
                  >
                    {preview ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
                    {preview ? "Edit" : "Preview"}
                  </Button>
                </div>

                {templates.map((t) => (
                  <TabsContent
                    key={t.id}
                    value={t.id}
                    className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
                  >
                    {/* subject */}
                    <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Subject
                    </label>
                    {preview ? (
                      <p className="mt-1.5 text-[14px] font-semibold text-foreground">
                        {drafts[t.id]?.subject}
                      </p>
                    ) : (
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          value={drafts[t.id]?.subject ?? ""}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [t.id]: { ...d[t.id], subject: e.target.value },
                            }))
                          }
                          className="h-9 flex-1 rounded-lg border border-border bg-surface-sunken px-3 text-sm outline-none focus:border-ring focus:bg-card"
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => copy("subject", drafts[t.id]?.subject ?? "")}
                          aria-label="Copy subject"
                        >
                          {copied === "subject" ? (
                            <Check className="size-3.5 text-positive" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    )}

                    {/* body */}
                    <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Message
                    </label>
                    {preview ? (
                      <div className="mt-1.5 whitespace-pre-wrap rounded-xl border border-border bg-surface-sunken p-4 text-[13.5px] leading-relaxed text-foreground">
                        {drafts[t.id]?.body}
                      </div>
                    ) : (
                      <textarea
                        value={drafts[t.id]?.body ?? ""}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [t.id]: { ...d[t.id], body: e.target.value },
                          }))
                        }
                        rows={14}
                        className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface-sunken p-4 text-[13.5px] leading-relaxed outline-none focus:border-ring focus:bg-card"
                      />
                    )}
                  </TabsContent>
                ))}

                {/* footer actions */}
                <div className="flex items-center gap-2 border-t border-border px-6 py-4">
                  <div className="mr-auto text-[12px] text-muted-foreground">
                    To:{" "}
                    <span className="font-medium text-foreground">
                      {prospect.contactEmail}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="h-9"
                    onClick={() => copy("body", current.body)}
                  >
                    {copied === "body" ? (
                      <Check className="size-4 text-positive" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    Copy message
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9"
                    disabled={saving}
                    onClick={saveDraft}
                  >
                    {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save draft
                  </Button>
                  <a
                    className={cn(buttonVariants({ size: "lg" }), "h-9 rounded-full px-4")}
                    href={`mailto:${prospect.contactEmail}?subject=${encodeURIComponent(
                      current.subject,
                    )}&body=${encodeURIComponent(current.body)}`}
                  >
                    <Mail className="size-4" />
                    Open in email
                  </a>
                </div>
              </Tabs>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
