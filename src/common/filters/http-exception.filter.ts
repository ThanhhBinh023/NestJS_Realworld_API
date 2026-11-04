import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errors: Record<string, string[]> = {};

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'errors' in exceptionResponse
    ) {
      errors = (exceptionResponse as { errors: Record<string, string[]> })
        .errors;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as { message: unknown }).message;
      if (Array.isArray(msg)) {
        errors = { body: msg.map(String) };
      } else {
        errors = { message: [String(msg)] };
      }
    } else if (typeof exceptionResponse === 'string') {
      errors = { message: [exceptionResponse] };
    } else {
      errors = {
        message: [
          exception.message || HttpStatus[status] || 'An error occurred',
        ],
      };
    }

    response.status(status).json({ errors });
  }
}
