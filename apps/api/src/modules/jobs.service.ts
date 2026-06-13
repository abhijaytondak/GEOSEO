import { Injectable, NotFoundException } from "@nestjs/common";
import type { JobRun, JobStatus, JobType } from "@geoseo/types";

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
export class JobsStore {
  private seq = 0;
  private jobs: JobRun[] = [];

  create(type: JobType, description?: string): JobRun {
    this.seq += 1;
    const copy = COPY[type];
    const job: JobRun = {
      id: `job-${this.seq}`,
      type,
      title: copy.title,
      description: description ?? copy.description,
      status: "running",
      progress: 12,
      createdAt: new Date().toISOString(),
    };
    this.jobs.unshift(job);
    return this.hydrate(job);
  }

  list(): JobRun[] {
    return this.jobs.map((job) => this.hydrate(job));
  }

  get(id: string): JobRun {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return this.hydrate(job);
  }

  private hydrate(job: JobRun): JobRun {
    if (job.status === "failed" || job.status === "completed") return job;

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
