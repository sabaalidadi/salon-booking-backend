// src/appointments/appointments.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan, MoreThan } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { SalonService } from '../services/entities/salon-service.entity.js';
import { SpecialistProfile } from '../specialists/entities/specialist-profile.entity.js';
import { SpecialistWorkingHour, DayOfWeek } from '../specialists/entities/working-hour.entity.js';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(SalonService)
    private readonly serviceRepo: Repository<SalonService>,
    @InjectRepository(SpecialistProfile)
    private readonly specialistRepo: Repository<SpecialistProfile>,
    @InjectRepository(SpecialistWorkingHour)
    private readonly workingHourRepo: Repository<SpecialistWorkingHour>,
  ) {}

  async create(customerId: string, dto: CreateAppointmentDto) {
    const specialist = await this.specialistRepo.findOne({
      where: { id: dto.specialistId },
    });
    if (!specialist) {
      throw new NotFoundException('متخصص مورد نظر یافت نشد.');
    }

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException('سرویس مورد نظر یافت نشد.');
    }

    const start = new Date(dto.startTime);
    if (isNaN(start.getTime()) || start < new Date()) {
      throw new BadRequestException('تاریخ و ساعت شروع نامعتبر است.');
    }

    // محاسبه زمان پایان بر اساس مدت‌زمان سرویس (durationMinutes)
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // ۱. استخراج روز هفته از تاریخ شروع نوبت
    const daysMap: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const dayOfWeekEnum = daysMap[start.getDay()];

    // ۲. پیدا کردن ساعات کاری متخصص برای آن روز خاص
    const workingHour = await this.workingHourRepo.findOne({
      where: { specialistId: dto.specialistId, dayOfWeek: dayOfWeekEnum },
    });

    if (!workingHour || !workingHour.isWorking) {
      throw new BadRequestException('متخصص در این روز هفته تعطیل است یا ساعت کاری تعریف نکرده است.');
    }

    // ۳. بررسی مطابقت زمان نوبت با ساعات کاری
    const appointmentStartMinutes = start.getHours() * 60 + start.getMinutes();
    const appointmentEndMinutes = end.getHours() * 60 + end.getMinutes();

    const [workStartHour, workStartMin] = workingHour.startTime.split(':').map(Number);
    const [workEndHour, workEndMin] = workingHour.endTime.split(':').map(Number);

    const workStartMinutes = workStartHour * 60 + workStartMin;
    const workEndMinutes = workEndHour * 60 + workEndMin;

    if (appointmentStartMinutes < workStartMinutes || appointmentEndMinutes > workEndMinutes) {
      throw new BadRequestException(
        `زمان انتخابی خارج از ساعات کاری متخصص است. ساعات کاری این روز: ${workingHour.startTime} تا ${workingHour.endTime}`
      );
    }

    // ۴. بررسی تداخل زمانی با سایر نوبت‌ها (نوبت‌هایی که لغو نشده‌اند)
    const conflict = await this.appointmentRepo.findOne({
      where: {
        specialistId: dto.specialistId,
        status: Not(AppointmentStatus.CANCELLED),
        startTime: LessThan(end),
        endTime: MoreThan(start),
      },
    });

    if (conflict) {
      throw new BadRequestException('متخصص در این بازه زمانی نوبت دیگری دارد. لطفاً زمان دیگری انتخاب کنید.');
    }

    const appointment = this.appointmentRepo.create({
      customerId,
      specialistId: dto.specialistId,
      serviceId: dto.serviceId,
      startTime: start,
      endTime: end,
      status: AppointmentStatus.PENDING,
    });

    return await this.appointmentRepo.save(appointment);
  }

  async findCustomerAppointments(customerId: string) {
    return await this.appointmentRepo.find({
      where: { customerId },
      relations: {
        specialist: {
          user: true,
        },
        service: true,
      },
      order: { startTime: 'DESC' },
    });
  }

  async findSpecialistAppointments(specialistUserId: string) {
    const specialist = await this.specialistRepo.findOne({
      where: { user: { id: specialistUserId } },
    });
    if (!specialist) {
      throw new NotFoundException('پروفایل متخصص یافت نشد.');
    }

    return await this.appointmentRepo.find({
      where: { specialistId: specialist.id },
      relations: {
        customer: true,
        service: true,
      },
      order: { startTime: 'DESC' },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('نوبت مورد نظر یافت نشد.');
    }

    appointment.status = status;
    return await this.appointmentRepo.save(appointment);
  }
}
