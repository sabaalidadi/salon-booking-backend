// src/modules/specialists/specialists.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  LessThan,
  MoreThan,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js';
import { SalonService } from '../services/entities/salon-service.entity.js';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity.js';
import { SpecialistProfile } from './entities/specialist-profile.entity.js';
import {
  SpecialistWorkingHour,
  DayOfWeek,
} from './entities/working-hour.entity.js';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto.js';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto.js';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto.js';
import { GetAvailabilityDto } from './dto/get-availability.dto.js';
import { StorageService } from '../../common/storage/storage.service.js';

@Injectable()
export class SpecialistsService {
  // فاصله‌ی بین دو زمان شروع پیشنهادی (دقیقه)
  private static readonly SLOT_STEP_MINUTES = 15;

  constructor(
    @InjectRepository(SpecialistProfile)
    private readonly profiles: Repository<SpecialistProfile>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(SalonService)
    private readonly services: Repository<SalonService>,
    @InjectRepository(SpecialistWorkingHour)
    private readonly workingHourRepo: Repository<SpecialistWorkingHour>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly storage: StorageService,
  ) {}

  private view(profile: SpecialistProfile) {
    return {
      id: profile.id,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      avatarUrl: profile.avatarUrl,
      specialist: {
        id: profile.user.id,
        fullName: profile.user.fullName,
      },
      services: profile.services.map((service) => ({
        id: service.id,
        name: service.title,
      })),
    };
  }

  private async mineEntity(userId: string) {
    const profile = await this.profiles.findOne({
      where: { user: { id: userId } },
      relations: { user: true, services: true },
    });
    if (!profile) throw new NotFoundException('Specialist profile not found');
    return profile;
  }

  async create(userId: string, dto: CreateSpecialistProfileDto) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user || !user.isActive || user.role !== UserRole.SPECIALIST) {
      throw new NotFoundException('Active specialist user not found');
    }

    const existing = await this.profiles.findOne({
      where: { user: { id: userId } },
    });
    if (existing) throw new ConflictException('Profile already exists');

    try {
      await this.profiles.save(
        this.profiles.create({ user, ...dto, services: [] }),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Profile already exists');
      }
      throw error;
    }

    return this.view(await this.mineEntity(userId));
  }

  async mine(userId: string) {
    return this.view(await this.mineEntity(userId));
  }

  async update(userId: string, dto: UpdateSpecialistProfileDto) {
    const profile = await this.mineEntity(userId);
    Object.assign(profile, dto);
    await this.profiles.save(profile);
    return this.view(await this.mineEntity(userId));
  }

    // تنظیم یا جایگزینی عکس پروفایل
  async setAvatar(userId: string, file: Express.Multer.File | undefined) {
    // اول پروفایل را بیاور؛ اگر نداشت، فایلی روی دیسک ذخیره نمی‌شود
    const profile = await this.mineEntity(userId);

    const newUrl = await this.storage.saveImage(file, 'avatars');
    const oldUrl = profile.avatarUrl;

    profile.avatarUrl = newUrl;
    try {
      await this.profiles.save(profile);
    } catch (error) {
      await this.storage.delete(newUrl); // ذخیره در دیتابیس شکست خورد: فایل یتیم نماند
      throw error;
    }

    await this.storage.delete(oldUrl); // عکس قبلی را پاک کن
    return this.view(profile);
  }

  // حذف عکس پروفایل
  async removeAvatar(userId: string) {
    const profile = await this.mineEntity(userId);
    const oldUrl = profile.avatarUrl;

    profile.avatarUrl = null;
    await this.profiles.save(profile);

    await this.storage.delete(oldUrl);
    return this.view(profile);
  }

  async findOne(id: string) {
    const profile = await this.profiles.findOne({
      where: {
        id,
        user: { role: UserRole.SPECIALIST, isActive: true },
      },
      relations: { user: true, services: true },
    });
    if (!profile) throw new NotFoundException('Specialist not found');
    return this.view(profile);
  }

  async setServices(id: string, serviceIds: string[]) {
    const profile = await this.profiles.findOne({
      where: {
        id,
        user: { role: UserRole.SPECIALIST, isActive: true },
      },
      relations: { user: true, services: true },
    });
    if (!profile) throw new NotFoundException('Specialist not found');

    const selected = serviceIds.length
      ? await this.services.findBy({ id: In(serviceIds) })
      : [];

    if (selected.length !== serviceIds.length) {
      throw new BadRequestException('One or more serviceIds do not exist');
    }

    profile.services = selected;
    await this.profiles.save(profile);
    return this.view(await this.mineEntity(profile.user.id));
  }

  async findAllForAdmin() {
    const profiles = await this.profiles.find({
      relations: { user: true, services: true },
    });
    return profiles.map((profile) => ({
      id: profile.id,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      specialist: {
        id: profile.user.id,
        fullName: profile.user.fullName,
        email: profile.user.email,
        role: profile.user.role,
        isActive: profile.user.isActive,
      },
      services: profile.services.map((service) => ({
        id: service.id,
        name: service.title,
        price: service.priceAmount,
      })),
    }));
  }

  async findAll() {
    const profiles = await this.profiles.find({
      where: { user: { role: UserRole.SPECIALIST, isActive: true } },
      relations: { user: true, services: true },
    });

    return profiles.map((profile) => ({
      id: profile.id,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      specialist: {
        id: profile.user.id,
        fullName: profile.user.fullName,
      },
      services: profile.services.map((service) => ({
        id: service.id,
        name: service.title,
        price: service.priceAmount,
        duration: service.durationMinutes,
      })),
    }));
  }

  async setWorkingHours(userId: string, dto: SetWorkingHoursDto) {
    const specialist = await this.profiles.findOne({
      where: { user: { id: userId } },
    });
    if (!specialist) {
      throw new NotFoundException('پروفایل متخصص یافت نشد.');
    }

    await this.workingHourRepo.delete({ specialistId: specialist.id });

    const workingHours = dto.schedule.map((item) =>
      this.workingHourRepo.create({
        specialistId: specialist.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isWorking: item.isWorking,
      }),
    );

    return await this.workingHourRepo.save(workingHours);
  }

  async getWorkingHours(specialistId: string) {
    return await this.workingHourRepo.find({
      where: { specialistId },
    });
  }

  // اسلات‌های خالی یک متخصص در یک روز، برای یک سرویس مشخص
  async getAvailability(specialistId: string, dto: GetAvailabilityDto) {
    // ۱. متخصص (فعال) را همراه با سرویس‌هایش پیدا کن
    const profile = await this.profiles.findOne({
      where: {
        id: specialistId,
        user: { role: UserRole.SPECIALIST, isActive: true },
      },
      relations: { services: true },
    });
    if (!profile) throw new NotFoundException('Specialist not found');

    // ۲. مطمئن شو این متخصص همین سرویس را ارائه می‌دهد و سرویس فعال است
    const service = profile.services.find(
      (s) => s.id === dto.serviceId && s.isActive,
    );
    if (!service) {
      throw new BadRequestException(
        'این متخصص این سرویس را ارائه نمی‌دهد یا سرویس غیرفعال است.',
      );
    }

    // ۳. تاریخ "2026-11-10" را به ابتدا و انتهای همان روز تبدیل کن
    const [year, month, day] = dto.date.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    // ۴. ساعت کاری متخصص در آن روز هفته
    const daysMap: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const workingHour = await this.workingHourRepo.findOne({
      where: { specialistId, dayOfWeek: daysMap[dayStart.getDay()] },
    });

    const base = {
      date: dto.date,
      specialistId,
      serviceId: service.id,
      durationMinutes: service.durationMinutes,
    };

    // روز تعطیل یا بدون ساعت کاری => هیچ اسلاتی نداریم
    if (!workingHour || !workingHour.isWorking) {
      return { ...base, slots: [] };
    }

    // ۵. نوبت‌های لغو‌نشده‌ی آن روز
    const booked = await this.appointmentRepo.find({
      where: {
        specialistId,
        status: Not(AppointmentStatus.CANCELLED),
        startTime: LessThan(dayEnd),
        endTime: MoreThan(dayStart),
      },
    });

    // ۶. ساخت اسلات‌ها
    const [startH, startM] = workingHour.startTime.split(':').map(Number);
    const [endH, endM] = workingHour.endTime.split(':').map(Number);
    const workStart = startH * 60 + startM;
    const workEnd = endH * 60 + endM;
    const duration = service.durationMinutes;
    const now = new Date();

    const slots: { startTime: string; endTime: string; label: string }[] = [];

    for (
      let cursor = workStart;
      cursor + duration <= workEnd;
      cursor += SpecialistsService.SLOT_STEP_MINUTES
    ) {
      const slotStart = new Date(
        year,
        month - 1,
        day,
        Math.floor(cursor / 60),
        cursor % 60,
      );
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // زمان گذشته را نشان نده
      if (slotStart <= now) continue;

      // اگر با هر نوبت موجود تداخل دارد، رد کن
      const overlaps = booked.some(
        (a) => slotStart < a.endTime && slotEnd > a.startTime,
      );
      if (overlaps) continue;

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        label: `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`,
      });
    }

    return { ...base, slots };
  }
}
