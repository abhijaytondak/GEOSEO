import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { authRequired } from "./mode";

/** Fixed-length digest so secret comparison is constant-time regardless of length. */
const sha256 = (s: string) => createHash("sha256").update(s).digest();

/**
 * Bearer-token guard. Enforcement is **mode-driven + fail-closed** (P0.1): auth is
 * required whenever `authRequired()` says so — i.e. production/staging always
 * enforce (you cannot silently leave them open), demo is permissive, and the
 * explicit `API_AUTH_REQUIRED` flag can force either way. When enforced, requires
 * `Authorization: Bearer <token>` matching `DEV_API_TOKEN`. In production this is
 * where Clerk JWT verification + tenant/scope resolution plug in.
 */
@Injectable()
export class BearerGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    if (!authRequired()) return true; // mode-driven: demo open, prod/staging enforce

    const expected = process.env.DEV_API_TOKEN;
    // Fail closed: if auth is required but no secret is configured, deny rather
    // than accept any token. (In production this branch is replaced by Clerk
    // JWT verification, which has its own keys.)
    if (!expected) {
      throw new UnauthorizedException(
        "Server auth misconfigured: DEV_API_TOKEN is not set",
      );
    }

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    // Constant-time compare over fixed-length SHA-256 digests — neither the token
    // value nor its length leaks through comparison timing.
    if (!token || !timingSafeEqual(sha256(token), sha256(expected))) {
      throw new UnauthorizedException("Missing or invalid bearer token");
    }
    return true;
  }
}
