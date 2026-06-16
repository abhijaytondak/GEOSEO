import { CanActivate, ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createHash, timingSafeEqual } from "node:crypto";
import { verifyToken } from "@clerk/backend";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { authRequired } from "./mode";
import type { TenantRequest } from "./tenant";

/** Fixed-length digest so secret comparison is constant-time regardless of length. */
const sha256 = (s: string) => createHash("sha256").update(s).digest();

/**
 * Bearer-token guard. Enforcement is **mode-driven + fail-closed** (P0.1): auth is
 * required whenever `authRequired()` says so — production/staging always enforce,
 * demo is permissive, and `API_AUTH_REQUIRED` can force either way.
 *
 * When enforced it accepts EITHER:
 *  1. The server-to-server `DEV_API_TOKEN` (the web BFF injects it for proxied calls), or
 *  2. A **Clerk session JWT** verified with `CLERK_SECRET_KEY` — on success the verified
 *     claims populate `req.auth` ({ userId, orgId, role }), which `resolveTenantId`
 *     consumes so the tenant comes from the verified org claim, NOT a client header.
 */
@Injectable()
export class BearerGuard implements CanActivate {
  private readonly log = new Logger(BearerGuard.name);

  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    if (!authRequired()) return true; // mode-driven: demo open, prod/staging enforce

    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    if (!token) throw new UnauthorizedException("Missing bearer token");

    // 1. Server-to-server bridge (BFF → API). Constant-time compare.
    const devToken = process.env.DEV_API_TOKEN;
    if (devToken && token.length === devToken.length && timingSafeEqual(sha256(token), sha256(devToken))) {
      return true;
    }

    // 2. Clerk session JWT.
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (secretKey) {
      try {
        const claims = await verifyToken(token, {
          secretKey,
          authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(",").map((s) => s.trim()),
        });
        req.auth = {
          userId: typeof claims.sub === "string" ? claims.sub : undefined,
          orgId: (claims.org_id as string | undefined) ?? (claims.o as { id?: string } | undefined)?.id,
          role: (claims.org_role as string | undefined) ?? (claims.o as { rol?: string } | undefined)?.rol,
        };
        return true;
      } catch (err) {
        this.log.debug(`Clerk token verification failed: ${err instanceof Error ? err.message : "unknown"}`);
        throw new UnauthorizedException("Invalid or expired session token");
      }
    }

    // Neither path available: fail closed.
    if (!devToken) {
      throw new UnauthorizedException("Server auth misconfigured: set CLERK_SECRET_KEY or DEV_API_TOKEN");
    }
    throw new UnauthorizedException("Invalid bearer token");
  }
}
