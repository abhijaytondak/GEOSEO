import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { resolveTenantId, type TenantRequest } from "./tenant";

/**
 * Attaches the resolved tenant id to every request (`req.tenantId`) so controllers
 * and services can scope data per workspace. It is a context-attacher, not an
 * authorizer — it always allows the request through. Registered AFTER BearerGuard so
 * `req.auth` (verified Clerk org/user) is set when the tenant is derived (P0-5).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    req.tenantId = resolveTenantId(req);
    return true;
  }
}
