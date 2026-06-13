import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

/** Renders all errors in the `{ success:false, data:null, errors:[…] }` envelope
 *  with the correct HTTP status code. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "Internal server error";
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      message =
        typeof body === "string"
          ? body
          : ((body as { message?: string | string[] }).message as string) ?? exception.message;
    }

    res.status(status).json({
      success: false,
      data: null,
      errors: [{ code: status, message: Array.isArray(message) ? message.join(", ") : message }],
    });
  }
}
