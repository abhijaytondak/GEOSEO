import { Controller, ForbiddenException, Get, Inject, Param, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JobsStore } from "./jobs.service";
import { AuditStore } from "./audit.service";
import { WorkspaceStore } from "./workspace.service";
import { BillingStore } from "./billing.service";
import { resolveMode } from "../common/mode";
import { dbPing } from "../db/db";
import type { TenantRequest } from "../common/tenant";

/**
 * Internal admin / support diagnostics (PRD §15.2). Read-only. Lets support answer
 * "why did publish fail?" without DB access. Guarded by `ADMIN_API_TOKEN` (sent as
 * `x-admin-token`); when the token is unset it is only reachable in demo mode, never
 * in production — so it can't be left wide open. All access is auth-gated by the
 * BearerGuard on top of this.
 */
@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(
    @Inject(JobsStore) private readonly jobs: JobsStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
    @Inject(WorkspaceStore) private readonly workspaces: WorkspaceStore,
    @Inject(BillingStore) private readonly billing: BillingStore,
  ) {}

  private assertAdmin(req: TenantRequest): void {
    const token = process.env.ADMIN_API_TOKEN;
    if (token) {
      const header = req.headers?.["x-admin-token"];
      const got = Array.isArray(header) ? header[0] : header;
      if (got !== token) throw new ForbiddenException("Admin access requires a valid x-admin-token.");
      return;
    }
    // No admin token configured → only allow in demo mode (never silently open in prod).
    if (resolveMode() !== "demo") {
      throw new ForbiddenException("Admin console is disabled: set ADMIN_API_TOKEN to enable it in this environment.");
    }
  }

  @Get("overview")
  async overview(@Req() req: TenantRequest) {
    this.assertAdmin(req);
    const jobs = this.jobs.list();
    const ping = await dbPing();
    return {
      mode: resolveMode(),
      db: { configured: Boolean(process.env.DATABASE_URL), reachable: ping.reachable, error: ping.error },
      queue: { configured: Boolean(process.env.REDIS_URL) },
      workspaces: this.workspaces.list().length,
      jobs: {
        total: jobs.length,
        running: jobs.filter((j) => j.status === "running").length,
        failed: jobs.filter((j) => j.status === "failed").length,
        recent: jobs.slice(0, 20),
      },
      recentAudit: this.audit.list(25),
      generatedAt: new Date().toISOString(),
    };
  }

  @Get("jobs")
  jobsList(@Req() req: TenantRequest) {
    this.assertAdmin(req);
    return { jobs: this.jobs.list() };
  }

  @Get("jobs/:id")
  job(@Req() req: TenantRequest, @Param("id") id: string) {
    this.assertAdmin(req);
    return { job: this.jobs.get(id) };
  }

  @Get("workspaces")
  workspaceList(@Req() req: TenantRequest) {
    this.assertAdmin(req);
    return { workspaces: this.workspaces.list() };
  }

  @Get("workspaces/:id")
  async workspace(@Req() req: TenantRequest, @Param("id") id: string) {
    this.assertAdmin(req);
    return {
      workspace: this.workspaces.get(id),
      billing: await this.billing.status(id),
    };
  }

  @Get("audit")
  auditLog(@Req() req: TenantRequest) {
    this.assertAdmin(req);
    return { entries: this.audit.list(200) };
  }
}
