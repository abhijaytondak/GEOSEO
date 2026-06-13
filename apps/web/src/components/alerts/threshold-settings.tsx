"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { api, type AlertThresholds } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppFeedback } from "@/components/system/app-feedback";

const fallback: AlertThresholds = {
  rankDrop: 5,
  trafficDrop: 8,
  brokenBacklinks: true,
  aiVisibilityDrop: 10,
};

export function ThresholdSettingsButton() {
  const { notify } = useAppFeedback();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AlertThresholds>(fallback);

  useEffect(() => {
    if (!open) return;
    api.getAlertThresholds().then(setForm).catch(() => setForm(fallback));
  }, [open]);

  async function save() {
    setSaving(true);
    try {
      const next = await api.updateAlertThresholds(form);
      setForm(next);
      setOpen(false);
      notify({ kind: "success", title: "Thresholds saved", message: "Alert sensitivity has been updated." });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" />
        Thresholds
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alert thresholds</DialogTitle>
            <DialogDescription>
              Tune the mock monitoring thresholds used by optimization alerts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {([
              ["rankDrop", "Rank drop positions"],
              ["trafficDrop", "Traffic drop percent"],
              ["aiVisibilityDrop", "AI visibility drop percent"],
            ] as const).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-[12px] font-semibold text-muted-foreground">{label}</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form[key]}
                  onChange={(event) => setForm((f) => ({ ...f, [key]: Number(event.target.value) }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-sm outline-none focus:border-ring"
                />
              </label>
            ))}
            <label className="flex items-center justify-between rounded-xl border border-border bg-surface-sunken p-3">
              <span className="text-[13px] font-medium text-foreground">Broken backlink alerts</span>
              <input
                type="checkbox"
                checked={form.brokenBacklinks}
                onChange={(event) => setForm((f) => ({ ...f, brokenBacklinks: event.target.checked }))}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save thresholds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
