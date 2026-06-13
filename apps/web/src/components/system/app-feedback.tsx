"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Loader2, X, AlertTriangle, Activity } from "lucide-react";
import type { JobRun, JobType } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; kind: ToastKind; title: string; message?: string };

interface FeedbackContextValue {
  notify: (toast: Omit<Toast, "id">) => void;
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

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [jobs, setJobs] = useState<JobRun[]>([]);
  const [jobsOpen, setJobsOpen] = useState(false);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((items) => [...items, { id, ...toast }].slice(-4));
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, toast.kind === "error" ? 5200 : 3600);
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

  useEffect(() => {
    if (jobs.length === 0 || jobs.every((job) => job.status === "completed" || job.status === "failed")) {
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
    }, 900);
    return () => window.clearInterval(timer);
  }, [jobs, notify]);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      notify,
      startJob,
      trackJob,
      jobs,
      openJobs: () => setJobsOpen(true),
    }),
    [jobs, notify, startJob, trackJob],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
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

      {jobs.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 left-4 z-40 h-9 rounded-full bg-card/95 shadow-card backdrop-blur"
          onClick={() => setJobsOpen(true)}
        >
          <Activity className="size-4 text-brand" />
          Jobs
        </Button>
      )}

      {jobsOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/20 p-4 backdrop-blur-sm" onClick={() => setJobsOpen(false)}>
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col rounded-2xl border border-border bg-card shadow-float"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Background jobs</h2>
                <p className="text-[12px] text-muted-foreground">Simulated workflows for this prototype.</p>
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
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-border bg-surface-sunken p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-foreground">{job.title}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{job.description}</div>
                    </div>
                    {job.status === "completed" ? (
                      <CheckCircle2 className="size-4 shrink-0 text-positive" />
                    ) : (
                      <Loader2 className="size-4 shrink-0 animate-spin text-brand" />
                    )}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  {job.result && <div className="mt-2 text-[12px] text-muted-foreground">{job.result}</div>}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useAppFeedback must be used inside AppFeedbackProvider");
  return ctx;
}
