// src/specialists/specialists.service.ts
import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js';
import { SalonService } from '../services/entities/salon-service.entity.js';
import { SpecialistProfile } from './entities/specialist-profile.entity.js';
import { SpecialistWorkingHour } from './entities/working-hour.entity.js';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto.js';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto.js';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto.js';

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(SpecialistProfile)
    private readonly profiles: Repository<SpecialistProfile>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(SalonService)
    private readonly services: Repository<SalonService>,
    @InjectRepository(SpecialistWorkingHour)
    private readonly workingHourRepo: Repository<SpecialistWorkingHour>,
  ) {}

  private view(profile: SpecialistProfile) {
    return {
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
      })
    );

    return await this.workingHourRepo.save(workingHours);
  }

  async getWorkingHours(specialistId: string) {
    return await this.workingHourRepo.find({
      where: { specialistId },
    });
  }
}
