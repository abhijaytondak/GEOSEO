import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/** Wraps every successful response in the standard `{ success, data, errors }`
 *  envelope from API-SPEC.md, and logs each request so traffic is observable. */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  private readonly logger = new Logger("API");

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    this.logger.log(`${req.method} ${req.originalUrl}`);
    return next.handle().pipe(map((data) => ({ success: true, data, errors: [] })));
  }
}
