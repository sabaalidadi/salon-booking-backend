import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity.js';



export type PublicUser = Pick<
  User,
  'id' | 'fullName' | 'email' | 'role' | 'isActive'
>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async createCustomer(data: {
    fullName: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    try {
      return await this.users.save(
        this.users.create({
          ...data,
          role: UserRole.CUSTOMER,
          isActive: true,
        }),
      );
    } catch (error: unknown) {
      // محدودیت unique دیتابیس، ثبت‌نام هم‌زمان را نیز پوشش می‌دهد.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('این ایمیل قبلاً ثبت شده است');
      }
      throw error;
    }
  }

  findActiveById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id, isActive: true });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async updateProfile(id: string, fullName: string): Promise<PublicUser> {
    const user = await this.findActiveById(id);
    if (!user) throw new NotFoundException('کاربر پیدا نشد');

    user.fullName = fullName;
    return toPublicUser(await this.users.save(user));
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.users.find({ order: { createdAt: 'DESC' } });
    return users.map(toPublicUser);
  }

  async changeRole(
    id: string,
    role: UserRole,
    actingUserId: string,
  ): Promise<PublicUser> {
    if (id === actingUserId) {
      throw new ForbiddenException('نقش خودت را از این مسیر تغییر نده');
    }

    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('کاربر پیدا نشد');

    user.role = role;
    return toPublicUser(await this.users.save(user));
  }
}
