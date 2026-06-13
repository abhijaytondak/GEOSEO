import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { JobType } from "@geoseo/types";
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

@ApiTags("jobs")
@Controller("jobs")
export class JobsController {
  constructor(@Inject(JobsStore) private readonly jobs: JobsStore) {}

  @Get()
  list() {
    return { jobs: this.jobs.list() };
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
