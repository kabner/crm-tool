import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, any>;
  requestId: string;
  timestamp: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let details: Record<string, any> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as Record<string, any>;
      message = resp.message || exception.message;
      if (Array.isArray(resp.message)) {
        details = { validationErrors: resp.message };
        message = 'Validation failed';
      }
    } else {
      message = exception.message;
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      error: HttpStatus[statusCode] || 'Unknown Error',
      message,
      ...(details && { details }),
      requestId: (request.headers['x-request-id'] as string) || randomUUID(),
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}
