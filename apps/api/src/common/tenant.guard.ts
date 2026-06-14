import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { resolveTenantId, type TenantRequest } from "./tenant";

/**
 * Attaches the resolved tenant id to every request (`req.tenantId`) so controllers
 * and services can scope data per workspace. It is a context-attacher, not an
 * authorizer — it always allows the request through. Register it BEFORE the auth
 * guards so `req.tenantId` is available to them.
 *
 * Multi-tenant groundwork (docs/MULTI-TENANCY.md): once Clerk JWT verification sets
 * `req.auth.orgId` in BearerGuard, `resolveTenantId` picks it up automatically.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    req.tenantId = resolveTenantId(req);
    return true;
  }
}
