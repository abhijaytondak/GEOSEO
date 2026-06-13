import { Controller, Get, Inject, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import { AuditStore } from "./audit.service";

// Mounted at /audit/log — the bare /audit is already taken by the page-engine
// MonitoringController (a separate, page-scoped trail).
@ApiTags("audit")
@Controller("audit")
export class AuditController {
  constructor(@Inject(AuditStore) private readonly audit: AuditStore) {}

  @Get("log")
  @ApiQuery({ name: "limit", required: false })
  list(@Query("limit") limit?: string) {
    const n = limit ? Math.max(1, Math.min(500, Number.parseInt(limit, 10) || 100)) : 100;
    return { audit: this.audit.list(n) };
  }
}
