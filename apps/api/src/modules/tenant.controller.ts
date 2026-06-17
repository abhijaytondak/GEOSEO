import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DEFAULT_TENANT_ID, type TenantRequest } from "../common/tenant";

@ApiTags("tenant")
@Controller("tenant")
export class TenantController {
  /** Echoes the tenant the request resolved to. NOT public: in production it must run
   *  through the auth guards so it reflects the REAL authenticated tenant (verified org /
   *  trusted s2s), not an unauthenticated header (P0-5). */
  @Get("context")
  context(@Req() req: TenantRequest) {
    const tenantId = req.tenantId ?? DEFAULT_TENANT_ID;
    return { tenantId, isDefault: tenantId === DEFAULT_TENANT_ID };
  }
}
