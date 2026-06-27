import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { resolveTenantId, type TenantRequest } from "./tenant";
import { captureException } from "./observability";

let counter = 0;
const reqId = (): string => `req-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/**
 * Structured request logging (PRD §15.1). Emits one JSON line per request with
 * request id, tenant, user, route, status, and latency — the fields support needs
 * to trace "what happened on this workspace". Errors are forwarded to the Sentry
 * seam (no-op unless configured). Registered as a global interceptor (additive).
 *
 * Tracing (perf audit P2): adopts the inbound `x-request-id` the BFF forwards (falling
 * back to a generated id) so one request is traceable browser → BFF → API logs under a
 * single id; echoes it on the response and emits a `Server-Timing` header with latency.
 */
@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  private readonly log = new Logger("request");

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== "http") return next.handle();
    const req = ctx.switchToHttp().getRequest<TenantRequest & Request>();
    const res = ctx.switchToHttp().getResponse<Response>();
    // Continue the BFF's trace id when present (end-to-end tracing), else mint one.
    const inbound = req.headers["x-request-id"];
    const id = (typeof inbound === "string" && inbound) || reqId();
    if (!res.headersSent) res.setHeader("x-request-id", id);
    const startedAt = Date.now();
    const tenantId = (() => {
      try {
        return resolveTenantId(req);
      } catch {
        return "unknown";
      }
    })();

    const finish = (status: number, error?: unknown) => {
      const latencyMs = Date.now() - startedAt;
      if (!res.headersSent) res.setHeader("Server-Timing", `app;dur=${latencyMs}`);
      const line = {
        id,
        method: req.method,
        route: (req.route?.path as string) ?? req.path,
        status,
        tenantId,
        userId: req.auth?.userId,
        latencyMs,
      };
      if (error) {
        this.log.error(JSON.stringify({ ...line, error: error instanceof Error ? error.message : String(error) }));
        captureException(error, line);
      } else {
        this.log.log(JSON.stringify(line));
      }
    };

    return next.handle().pipe(
      tap({
        next: () => finish(res.statusCode ?? 200),
        error: (err) => finish((err?.status as number) ?? 500, err),
      }),
    );
  }
}
