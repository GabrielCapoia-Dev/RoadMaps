import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';
import type { ErrorResponseDto } from '../dto/error-response.dto.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const path = request.originalUrl.split('?')[0] ?? request.path;
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = STATUS_CODES[statusCode] ?? 'Error';
    let message: string | string[] = error;

    if (statusCode < 500 && exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if ('message' in body) {
        const candidate: unknown = body.message;
        if (typeof candidate === 'string') {
          message = candidate;
        } else if (
          Array.isArray(candidate) &&
          candidate.every((value: unknown) => typeof value === 'string')
        ) {
          message = candidate;
        }
      }
    }

    if (statusCode >= 500) {
      // Internal details remain in server logs and never enter the HTTP body.
      this.logger.error(
        `${request.method} ${path}: ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseDto = {
      statusCode,
      error,
      message,
      path,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(body);
  }
}
