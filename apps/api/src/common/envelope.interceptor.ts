import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/** Wraps every successful response in the standard `{ success, data, errors }`
 *  envelope from API-SPEC.md, and logs each request so traffic is observable.
 *  EXCEPTION: routes that set a non-JSON Content-Type via `@Header(...)` — llms.txt
 *  (text/plain), sitemap.xml (application/xml), the performance report (text/html) — are
 *  returned RAW, not JSON-wrapped, so the body matches its declared content type
 *  (perf audit 2026-06-26: these were shipping a JSON envelope under a text/* content type). */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  private readonly logger = new Logger("API");

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse<Response>();
    this.logger.log(`${req.method} ${req.originalUrl}`);
    return next.handle().pipe(
      map((data) => {
        const contentType = String(res.getHeader("content-type") ?? "");
        // The route declared a non-JSON content type → don't wrap; emit the raw value.
        if (contentType && !contentType.includes("application/json")) return data;
        return { success: true, data, errors: [] };
      }),
    );
  }
}
