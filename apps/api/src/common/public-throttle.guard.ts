import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { RateLimiter } from "./rate-limit";

/**
 * Rate-limits unauthenticated public endpoints by client IP (PRD §18). Applies to
 * any POST under `/public/` (lead capture + visitor events); everything else passes
 * through. Registered as a second APP_GUARD alongside BearerGuard.
 */
@Injectable()
export class PublicThrottleGuard implements CanActivate {
  private readonly limiter = new RateLimiter(60, 10_000); // 60 req / 10s per IP

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      url?: string;
      originalUrl?: string;
      method?: string;
      ip?: string;
      socket?: { remoteAddress?: string };
    }>();
    const url = req.originalUrl ?? req.url ?? "";
    const method = (req.method ?? "GET").toUpperCase();
    if (method === "POST" && url.includes("/public/")) {
      this.limiter.check(req.ip ?? req.socket?.remoteAddress ?? "unknown"); // throws 429
    }
    return true;
  }
}
