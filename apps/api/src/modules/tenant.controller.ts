import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/public.decorator";
import { DEFAULT_TENANT_ID, type TenantRequest } from "../common/tenant";

@ApiTags("tenant")
@Controller("tenant")
export class TenantController {
  /** Echoes the tenant the request resolved to (multi-tenant groundwork — verifies
   *  TenantGuard + x-workspace-id resolution). */
  @Public()
  @Get("context")
  context(@Req() req: TenantRequest) {
    const tenantId = req.tenantId ?? DEFAULT_TENANT_ID;
    return { tenantId, isDefault: tenantId === DEFAULT_TENANT_ID };
  }
}
