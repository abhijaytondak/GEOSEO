"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  Loader2,
  X,
  AlertTriangle,
  Activity,
  RotateCw,
  Ban,
  Download,
  Clock,
} from "lucide-react";
import type { JobRun, JobStatus, JobType } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; kind: ToastKind; title: string; message?: string };

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" renders a destructive confirm button. */
  tone?: "default" | "danger";
}

interface FeedbackContextValue {
  notify: (toast: Omit<Toast, "id">) => void;
  /** Imperative confirmation — resolves true if the user confirms. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  startJob: (type: JobType, description?: string) => Promise<JobRun>;
  trackJob: (job: JobRun) => void;
  jobs: JobRun[];
  openJobs: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toastStyle: Record<ToastKind, string> = {
  success: "border-positive/25 bg-positive/10 text-positive",
  error: "border-negative/25 bg-negative/10 text-negative",
  info: "border-info/25 bg-info/10 text-info",
};

const TERMINAL: JobStatus[] = ["completed", "failed", "cancelled"];

const statusBadge: Record<JobStatus, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-muted text-muted-foreground" },
  running: { label: "Running", className: "bg-info/12 text-info" },
  completed: { label: "Completed", className: "bg-positive/12 text-positive" },
  failed: { label: "Failed", className: "bg-negative/12 text-negative" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [jobs, setJobs] = useState<JobRun[]>([]);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { id: number }) | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((items) => [...items, { id, ...toast }].slice(-4));
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, toast.kind === "error" ? 5200 : 3600);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({ ...options, id: Date.now() });
    });
  }, []);

  const resolveConfirm = useCallback((value: boolean) => {
    confirmResolver.current?.(value);
    confirmResolver.current = null;
    setConfirmState(null);
  }, []);

  const startJob = useCallback(
    async (type: JobType, description?: string) => {
      const job = await api.startJob(type, description);
      setJobs((items) => [job, ...items.filter((item) => item.id !== job.id)].slice(0, 8));
      setJobsOpen(true);
      notify({ kind: "info", title: job.title, message: "Started in the background." });
      return job;
    },
    [notify],
  );

  const trackJob = useCallback(
    (job: JobRun) => {
      setJobs((items) => [job, ...items.filter((item) => item.id !== job.id)].slice(0, 8));
      setJobsOpen(true);
      notify({ kind: "info", title: job.title, message: "Started in the background." });
    },
    [notify],
  );

  const retryJob = useCallback(
    async (id: string) => {
      try {
        const job = await api.retryJob(id);
        setJobs((items) => items.map((item) => (item.id === id ? job : item)));
        notify({ kind: "info", title: "Job restarted", message: job.title });
      } catch (err) {
        notify({ kind: "error", title: "Retry failed", message: err instanceof Error ? err.message : "Try again." });
      }
    },
    [notify],
  );

  const cancelJob = useCallback(
    async (id: string) => {
      try {
        const job = await api.cancelJob(id);
        setJobs((items) => items.map((item) => (item.id === id ? job : item)));
        notify({ kind: "info", title: "Job cancelled", message: job.title });
      } catch (err) {
        notify({ kind: "error", title: "Cancel failed", message: err instanceof Error ? err.message : "Try again." });
      }
    },
    [notify],
  );

  useEffect(() => {
    if (jobs.length === 0 || jobs.every((job) => TERMINAL.includes(job.status))) {
      return;
    }
    const timer = window.setInterval(async () => {
      const active = jobs.filter((job) => job.status === "running" || job.status === "queued");
      const updates = await Promise.all(active.map((job) => api.getJob(job.id).catch(() => job)));
      setJobs((items) =>
        items.map((job) => updates.find((update) => update.id === job.id) ?? job),
      );
      updates
        .filter((job) => job.status === "completed" && job.result)
        .forEach((job) => {
          notify({ kind: "success", title: job.title, message: job.result });
        });
      updates
        .filter((job) => job.status === "failed")
        .forEach((job) => {
          notify({ kind: "error", title: `${job.title} failed`, message: job.error ?? "See job center." });
        });
    }, 900);
    return () => window.clearInterval(timer);
  }, [jobs, notify]);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      notify,
      confirm,
      startJob,
      trackJob,
      jobs,
      openJobs: () => setJobsOpen(true),
    }),
    [jobs, notify, confirm, startJob, trackJob],
  );

  const activeJobs = jobs.filter((job) => !TERMINAL.includes(job.status)).length;

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-xl border bg-card p-3 shadow-float backdrop-blur transition-all",
              toastStyle[toast.kind],
            )}
          >
            <div className="flex items-start gap-2">
              {toast.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : toast.kind === "error" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Activity className="mt-0.5 size-4 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-foreground">{toast.title}</div>
                {toast.message && (
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{toast.message}</div>
                )}
              </div>
              <button
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* jobs launcher */}
      {jobs.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 left-4 z-40 h-9 rounded-full bg-card/95 shadow-card backdrop-blur"
          onClick={() => setJobsOpen(true)}
        >
          {activeJobs > 0 ? (
            <Loader2 className="size-4 animate-spin text-brand" />
          ) : (
            <Activity className="size-4 text-brand" />
          )}
          Jobs
          {activeJobs > 0 && (
            <span className="ml-1 rounded-full bg-brand/15 px-1.5 text-[11px] font-semibold tabular-nums text-brand">
              {activeJobs}
            </span>
          )}
        </Button>
      )}

      {/* job center */}
      {jobsOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/20 p-4 backdrop-blur-sm" onClick={() => setJobsOpen(false)}>
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col rounded-2xl border border-border bg-card shadow-float"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Background jobs</h2>
                <p className="text-[12px] text-muted-foreground">Retry, cancel, or open results.</p>
              </div>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setJobsOpen(false)}
                aria-label="Close jobs"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {jobs.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No jobs yet.</div>
              )}
              {jobs.map((job) => {
                const badge = statusBadge[job.status];
                const active = !TERMINAL.includes(job.status);
                return (
                  <div key={job.id} className="rounded-xl border border-border bg-surface-sunken p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-foreground">{job.title}</div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground">{job.description}</div>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.className)}>
                        {badge.label}
                      </span>
                    </div>

                    {active && (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-500"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}

                    {job.status === "completed" && job.result && (
                      <div className="mt-2 text-[12px] text-muted-foreground">{job.result}</div>
                    )}
                    {job.status === "failed" && (
                      <div className="mt-2 flex items-start gap-1.5 text-[12px] text-negative">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        <span>{job.error ?? "The job failed. Retry to run it again."}</span>
                      </div>
                    )}

                    {/* row actions */}
                    <div className="mt-3 flex items-center gap-2">
                      {job.artifactUrl && (
                        <a
                          href={job.artifactUrl}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Download className="size-3.5" />
                          Download
                        </a>
                      )}
                      {(job.status === "failed" || job.status === "cancelled") && (
                        <Button size="sm" variant="outline" className="h-8" onClick={() => retryJob(job.id)}>
                          <RotateCw className="size-3.5" />
                          Retry
                        </Button>
                      )}
                      {active && (
                        <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => cancelJob(job.id)}>
                          <Ban className="size-3.5" />
                          Cancel
                        </Button>
                      )}
                      {job.status === "queued" && (
                        <span className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
                          <Clock className="size-3" /> waiting for a worker
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* confirmation dialog */}
      <Dialog open={!!confirmState} onOpenChange={(open) => { if (!open) resolveConfirm(false); }}>
        {confirmState && (
          <DialogContent showCloseButton={false} className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{confirmState.title}</DialogTitle>
              {confirmState.message && <DialogDescription>{confirmState.message}</DialogDescription>}
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => resolveConfirm(false)}>
                {confirmState.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={confirmState.tone === "danger" ? "destructive" : "default"}
                onClick={() => resolveConfirm(true)}
              >
                {confirmState.confirmLabel ?? "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useAppFeedback must be used inside AppFeedbackProvider");
  return ctx;
}
