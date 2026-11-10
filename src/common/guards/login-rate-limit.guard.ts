import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private static attempts = new Map<string, AttemptRecord>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxAttempts = 5;

    let record = LoginRateLimitGuard.attempts.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      LoginRateLimitGuard.attempts.set(ip, record);
    }

    record.count++;
    if (record.count > maxAttempts) {
      throw new HttpException(
        'Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
