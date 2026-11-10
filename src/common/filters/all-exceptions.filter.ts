import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    }

    const isDev = process.env.NODE_ENV === 'development';

    const errorResponse: any = {
      statusCode: status,
      message,
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR && isDev) {
      errorResponse.stack = stack;
      errorResponse.error = exception;
    }

    response.status(status).json(errorResponse);
  }
}
