import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { JobStatus, JobType } from "@geoseo/types";
import { JobsStore } from "./jobs.service";
import { validateBody } from "../common/validation";
import { CreateJobSchema } from "../common/schemas";

const TYPES: JobType[] = [
  "audit",
  "discover",
  "acquire-backlinks",
  "export",
  "content-rescan",
  "content-refresh",
  "internal-links",
  "settings-sync",
];

const STATUSES: JobStatus[] = ["queued", "running", "completed", "failed", "cancelled"];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Parse a positive integer query param, clamped; falls back to `def`. */
function intParam(raw: string | undefined, def: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 0) return def;
  return Math.min(n, max);
}

@ApiTags("jobs")
@Controller("jobs")
export class JobsController {
  constructor(@Inject(JobsStore) private readonly jobs: JobsStore) {}

  /**
   * Paginated, newest-first job list. Defaults to the 50 most recent so the response stays
   * small (the unbounded list grew to ~114KB — perf audit P1). Shape stays `{ jobs }` for
   * backward compatibility; `total` + `nextCursor` are additive.
   *   ?limit=  (1–200, default 50)  ?status=queued|running|completed|failed|cancelled  ?cursor=<offset>
   */
  @Get()
  list(
    @Query("limit") limitRaw?: string,
    @Query("status") statusRaw?: string,
    @Query("cursor") cursorRaw?: string,
  ) {
    const all = this.jobs.list(); // hydrated, newest-first
    const status = STATUSES.includes(statusRaw as JobStatus) ? (statusRaw as JobStatus) : undefined;
    const filtered = status ? all.filter((j) => j.status === status) : all;
    const limit = intParam(limitRaw, DEFAULT_LIMIT, MAX_LIMIT) || DEFAULT_LIMIT;
    const start = intParam(cursorRaw, 0, Number.MAX_SAFE_INTEGER);
    const jobs = filtered.slice(start, start + limit);
    const nextOffset = start + limit;
    return {
      jobs,
      total: filtered.length,
      nextCursor: nextOffset < filtered.length ? String(nextOffset) : null,
    };
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.jobs.get(id);
  }

  @Post()
  create(@Body(validateBody(CreateJobSchema)) body: { type?: JobType; description?: string }) {
    const type = TYPES.includes(body?.type as JobType) ? (body.type as JobType) : "audit";
    return this.jobs.create(type, body?.description);
  }

  @Post(":id/retry")
  retry(@Param("id") id: string) {
    return this.jobs.retry(id);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.jobs.cancel(id);
  }
}
