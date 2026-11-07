import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import {
  toPublicUser,
  UsersService,
} from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshSession } from './entities/refresh-session.entity.js';

type RefreshPayload = {
  sub: string;
  sid: string;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshSession)
    private readonly sessions: Repository<RefreshSession>,
  ) {}

  async register(dto: RegisterDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException('رمز عبور نباید بیشتر از ۷۲ بایت باشد');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.usersService.createCustomer({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }

    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (
      !user ||
      !user.isActive ||
      !(await compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefresh(refreshToken);
    const user = await this.usersService.findActiveById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Refresh Token نامعتبر است');
    }

    const result = await this.sessions.update(
      {
        id: payload.sid,
        userId: payload.sub,
        tokenHash: this.tokenHash(refreshToken),
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      { revokedAt: new Date() },
    );

    if (result.affected !== 1) {
      throw new UnauthorizedException(
        'Refresh Token قبلاً استفاده یا لغو شده است',
      );
    }

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefresh(refreshToken);
    const result = await this.sessions.update(
      {
        id: payload.sid,
        userId: payload.sub,
        tokenHash: this.tokenHash(refreshToken),
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      { revokedAt: new Date() },
    );

    if (result.affected !== 1) {
      throw new UnauthorizedException('Refresh Token نامعتبر است');
    }
  }

  private async issueTokens(user: User) {
    const sessionId = randomUUID();

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, type: 'access' },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sid: sessionId, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    await this.sessions.save(
      this.sessions.create({
        id: sessionId,
        userId: user.id,
        tokenHash: this.tokenHash(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
      }),
    );

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefresh(token: string): Promise<RefreshPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (
        payload.type !== 'refresh' ||
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string'
      ) {
        throw new Error('Invalid payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh Token نامعتبر است');
    }
  }

  private tokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
