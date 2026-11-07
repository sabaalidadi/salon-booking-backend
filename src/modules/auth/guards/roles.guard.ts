import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../../users/entities/user.entity.js';
import { PublicUser } from '../../users/users.service.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // این گارد را فقط روی مسیرهای دارای @Roles استفاده می‌کنیم.
    if (!roles?.length) return false;

    const request = context.switchToHttp().getRequest<
      Request & { user?: PublicUser }
    >();

    return !!request.user && roles.includes(request.user.role);
  }
}
