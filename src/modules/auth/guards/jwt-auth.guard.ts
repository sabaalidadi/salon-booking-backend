import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  PublicUser,
  toPublicUser,
  UsersService,
} from '../../users/users.service.js';
import { ACCESS_TOKEN_COOKIE } from '../constants/cookies.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: PublicUser }
    >();

    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Access Token لازم است');

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        type: string;
      }>(token);

      if (payload.type !== 'access' || typeof payload.sub !== 'string') {
        throw new Error('Invalid payload');
      }

      // نقش همیشه از دیتابیس خوانده می‌شود تا تغییر نقش فوراً اعمال شود
      const user = await this.usersService.findActiveById(payload.sub);
      if (!user) throw new Error('User not found');

      request.user = toPublicUser(user);
      return true;
    } catch {
      throw new UnauthorizedException('Access Token نامعتبر است');
    }
  }

  // اول از کوکی، در صورت نبود از هدر Authorization (برای Postman/موبایل)
  private extractToken(request: Request): string | null {
    const fromCookie = request.cookies?.[ACCESS_TOKEN_COOKIE] as
      | string
      | undefined;
    if (fromCookie) return fromCookie;

    const match = /^Bearer (.+)$/i.exec(request.headers.authorization ?? '');
    return match?.[1] ?? null;
  }
}
