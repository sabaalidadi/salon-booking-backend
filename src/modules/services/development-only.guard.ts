import {
  CanActivate,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevelopmentOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (this.config.get<string>('NODE_ENV') !== 'development') {
      throw new ForbiddenException('مدیریت خدمات فعلاً غیرفعال است');
    }

    return true;
  }
}
