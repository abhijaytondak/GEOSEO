import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, type AppRole } from "./roles.decorator";
import { authRequired } from "./mode";
import type { TenantRequest } from "./tenant";

const RANK: Record<AppRole, number> = { viewer: 0, analyst: 1, marketer: 2, admin: 3, owner: 4 };

/** Normalize a Clerk org role (e.g. "org:admin", "admin", "member") to an AppRole. */
function normalizeRole(raw?: string): AppRole {
  if (!raw) return "viewer";
  const r = raw.replace(/^org:/, "").toLowerCase();
  if (r === "owner") return "owner";
  if (r === "admin") return "admin";
  if (r === "marketer") return "marketer";
  if (r === "analyst") return "analyst";
  return "viewer"; // least privilege for unknown/"member"
}

/**
 * RBAC enforcement (PRD §7.3). Runs after BearerGuard so `req.auth.role` is set.
 * **Opt-in:** only enforces on routes annotated with `@Roles(...)`; everything else
 * passes. In demo mode (auth off) it never blocks.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required || required.length === 0) return true; // opt-in
    if (!authRequired()) return true; // demo: don't block

    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    const role = normalizeRole(req.auth?.role);
    const minRequired = Math.min(...required.map((r) => RANK[r]));
    if (RANK[role] >= minRequired) return true;
    throw new ForbiddenException(`This action requires one of: ${required.join(", ")}`);
  }
}
