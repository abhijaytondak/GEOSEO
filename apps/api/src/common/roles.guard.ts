import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, type AppRole } from "./roles.decorator";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { authRequired } from "./mode";
import type { TenantRequest } from "./tenant";

const RANK: Record<AppRole, number> = { viewer: 0, analyst: 1, marketer: 2, admin: 3, owner: 4 };

/** State-changing HTTP methods. Reads (GET/HEAD/OPTIONS) are already auth-gated by BearerGuard. */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
/** Deny-by-default write floor: any non-@Public mutation with no explicit @Roles needs ≥ this. */
const DEFAULT_WRITE_ROLE: AppRole = "marketer";

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
 * RBAC enforcement (PRD §7.3, audit 2026-06-24). Runs after BearerGuard so `req.auth.role`
 * is set. **Deny-by-default:** every non-@Public state-changing request (POST/PUT/PATCH/
 * DELETE) requires at least `DEFAULT_WRITE_ROLE` unless an explicit `@Roles(...)` overrides
 * it (lower or higher). Reads need only authentication (already enforced by BearerGuard).
 * `@Public` routes carry no user/role and are exempt. In demo mode (auth off) it never blocks,
 * so this is a no-op on the open beta and only enforces once auth is on.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (!authRequired()) return true; // demo: never block

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true; // public routes have no authenticated principal

    const explicit = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    const method = (req.method ?? "GET").toUpperCase();

    // Required minimum role: explicit @Roles wins; else deny-by-default for mutations.
    const required: AppRole[] | null =
      explicit?.length ? explicit : WRITE_METHODS.has(method) ? [DEFAULT_WRITE_ROLE] : null;
    if (!required) return true; // authenticated read

    const role = normalizeRole(req.auth?.role);
    const minRequired = Math.min(...required.map((r) => RANK[r]));
    if (RANK[role] >= minRequired) return true;
    throw new ForbiddenException(`This action requires one of: ${required.join(", ")}`);
  }
}
