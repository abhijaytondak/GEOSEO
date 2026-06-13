import { Inject, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { JobRun, JobStatus, JobType } from "@geoseo/types";
import { DocStore } from "../db/db";
import { JobQueue } from "./queue.service";

const DURATIONS: Record<JobType, number> = {
  audit: 4200,
  discover: 3600,
  "acquire-backlinks": 4600,
  export: 2400,
  "content-rescan": 3600,
  "content-refresh": 4200,
  "internal-links": 2600,
  "settings-sync": 2200,
};

const COPY: Record<JobType, { title: string; description: string; result: string }> = {
  audit: {
    title: "Authority audit",
    description: "Checking technical SEO, backlinks, ranking volatility, and AI visibility.",
    result: "Audit complete: 6 opportunities and 3 refresh actions found.",
  },
  discover: {
    title: "Prospect discovery",
    description: "Scanning high-authority domains and competitor backlink gaps.",
    result: "Discovery complete: new prospect added to the queue.",
  },
  "acquire-backlinks": {
    title: "Backlink acquisition run",
    description: "Preparing outreach queue and ranking prospects by impact.",
    result: "Acquisition queue ready with 12 priority prospects.",
  },
  export: {
    title: "Export",
    description: "Preparing a CSV-style export from the current view.",
    result: "Export package generated for download.",
  },
  "content-rescan": {
    title: "Content rescan",
    description: "Rechecking freshness, rank movement, and internal-link gaps.",
    result: "Rescan complete: content health scores updated.",
  },
  "content-refresh": {
    title: "Content refresh",
    description: "Queuing AI refresh recommendations for selected pages.",
    result: "Refresh actions queued for the selected pages.",
  },
  "internal-links": {
    title: "Internal-link update",
    description: "Applying approved internal-link suggestions.",
    result: "Internal-link suggestions marked as applied.",
  },
  "settings-sync": {
    title: "Settings sync",
    description: "Saving workspace configuration and integration state.",
    result: "Workspace settings synced.",
  },
};

@Injectable()
export class JobsStore implements OnModuleInit {
  private seq = 0;
  private jobs: JobRun[] = [];
  private db = new DocStore<{ jobs: JobRun[]; seq: number }>("cx_jobs");

  constructor(@Inject(JobQueue) private readonly queue: JobQueue) {}

  async onModuleInit() {
    await this.db.init({ jobs: this.jobs, seq: this.seq }, (loaded) => {
      this.jobs = loaded.jobs;
      this.seq = loaded.seq;
    });
    // Hand the queue the processor; activates BullMQ only if REDIS_URL is set.
    await this.queue.start((jobRunId) => this.process(jobRunId));
  }

  private persist() {
    this.db.save({ jobs: this.jobs, seq: this.seq });
  }

  create(type: JobType, description?: string): JobRun {
    this.seq += 1;
    const copy = COPY[type];
    const queued = this.queue.active;
    const job: JobRun = {
      id: `job-${this.seq}`,
      type,
      title: copy.title,
      description: description ?? copy.description,
      status: queued ? "queued" : "running",
      progress: queued ? 0 : 12,
      createdAt: new Date().toISOString(),
    };
    this.jobs.unshift(job);
    this.persist();
    if (queued) void this.queue.enqueue(job.id, type);
    return this.hydrate(job);
  }

  /** BullMQ worker processor: advance a queued job to running → completed.
   *  The "work" is simulated (the underlying tasks are synchronous/mock), but
   *  the job now genuinely flows through Redis. Honors mid-flight cancel. */
  private async process(jobRunId: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === jobRunId);
    if (!job || job.status === "cancelled") return;
    job.status = "running";
    job.progress = 50;
    this.persist();
    await new Promise((r) => setTimeout(r, Math.min(DURATIONS[job.type], 2500)));
    const fresh = this.jobs.find((j) => j.id === jobRunId);
    if (!fresh || fresh.status === "cancelled") return;
    fresh.status = "completed";
    fresh.progress = 100;
    fresh.completedAt = new Date().toISOString();
    fresh.result = COPY[fresh.type].result;
    this.persist();
  }

  list(): JobRun[] {
    return this.jobs.map((job) => this.hydrate(job));
  }

  get(id: string): JobRun {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return this.hydrate(job);
  }

  /** Re-run a terminal job. With the queue active it re-enqueues; otherwise it
   *  resets progress + clock so the in-memory hydrate replays it. */
  retry(id: string): JobRun {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    const queued = this.queue.active;
    Object.assign(job, {
      status: queued ? "queued" : ("running" as JobStatus),
      progress: queued ? 0 : 12,
      createdAt: new Date().toISOString(),
      completedAt: undefined,
      result: undefined,
    });
    this.persist();
    if (queued) void this.queue.enqueue(job.id, job.type);
    return this.hydrate(job);
  }

  /** Cancel a job that hasn't finished. Terminal state — hydrate leaves it alone. */
  cancel(id: string): JobRun {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    if (job.status === "running" || job.status === "queued") {
      Object.assign(job, {
        status: "cancelled" as JobStatus,
        completedAt: new Date().toISOString(),
        result: "Cancelled before completion.",
      });
      this.db.save({ jobs: this.jobs, seq: this.seq });
    }
    return job;
  }

  private hydrate(job: JobRun): JobRun {
    if (job.status === "failed" || job.status === "completed" || job.status === "cancelled")
      return job;
    // When BullMQ is active the worker drives real status — don't fake progress.
    if (this.queue.active) return job;

    const elapsed = Date.now() - new Date(job.createdAt).getTime();
    const duration = DURATIONS[job.type];
    const progress = Math.min(100, Math.max(job.progress, Math.round((elapsed / duration) * 100)));
    const status: JobStatus = progress >= 100 ? "completed" : "running";
    const next: JobRun = {
      ...job,
      progress,
      status,
      completedAt: status === "completed" ? (job.completedAt ?? new Date().toISOString()) : undefined,
      result: status === "completed" ? COPY[job.type].result : undefined,
    };
    Object.assign(job, next);
    return next;
  }
}
