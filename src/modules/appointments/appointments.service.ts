// src/modules/appointments/appointments.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan, MoreThan } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from './entities/appointment.entity.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { SalonService } from '../services/entities/salon-service.entity.js';
import { SpecialistProfile } from '../specialists/entities/specialist-profile.entity.js';
import {
  SpecialistWorkingHour,
  DayOfWeek,
} from '../specialists/entities/working-hour.entity.js';
import { UserRole } from '../users/entities/user.entity.js';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto.js';

// حداقل فاصله‌ی مجاز بین لحظه‌ی لغو و شروع نوبت (ساعت)
const CANCELLATION_WINDOW_HOURS = 24;

// کاربری که از JwtAuthGuard می‌آید (فقط فیلدهایی که لازم داریم)
type AuthUser = { id: string; role: UserRole };

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
      throw new BadRequestException(
        'متخصص در این روز هفته تعطیل است یا ساعت کاری تعریف نکرده است.',
      );
    }

    // ۳. بررسی مطابقت زمان نوبت با ساعات کاری
    const appointmentStartMinutes = start.getHours() * 60 + start.getMinutes();
    const appointmentEndMinutes = end.getHours() * 60 + end.getMinutes();

    const [workStartHour, workStartMin] = workingHour.startTime
      .split(':')
      .map(Number);
    const [workEndHour, workEndMin] = workingHour.endTime
      .split(':')
      .map(Number);

    const workStartMinutes = workStartHour * 60 + workStartMin;
    const workEndMinutes = workEndHour * 60 + workEndMin;

    if (
      appointmentStartMinutes < workStartMinutes ||
      appointmentEndMinutes > workEndMinutes
    ) {
      throw new BadRequestException(
        `زمان انتخابی خارج از ساعات کاری متخصص است. ساعات کاری این روز: ${workingHour.startTime} تا ${workingHour.endTime}`,
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
      throw new BadRequestException(
        'متخصص در این بازه زمانی نوبت دیگری دارد. لطفاً زمان دیگری انتخاب کنید.',
      );
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

  // جزئیات یک نوبت
  async findOne(id: string, user: AuthUser) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: { customer: true, specialist: { user: true }, service: true },
    });

    const notFound = new NotFoundException('نوبت مورد نظر یافت نشد.');
    if (!appointment) throw notFound;

    const isOwner = appointment.customerId === user.id;
    const isItsSpecialist = appointment.specialist.user.id === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    // کسی که ربطی به این نوبت ندارد، همان پیام «پیدا نشد» را می‌بیند
    if (!isOwner && !isItsSpecialist && !isAdmin) throw notFound;

    return {
      id: appointment.id,
      status: appointment.status,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      createdAt: appointment.createdAt,
      customer: {
        id: appointment.customer.id,
        fullName: appointment.customer.fullName,
      },
      specialist: {
        id: appointment.specialist.id,
        fullName: appointment.specialist.user.fullName,
      },
      service: {
        id: appointment.service.id,
        title: appointment.service.title,
        durationMinutes: appointment.service.durationMinutes,
        priceAmount: appointment.service.priceAmount,
      },
      canCancel: this.getChangeBlockReason(appointment) === null,
    };
  }

  // لغو نوبت توسط مشتری
  async cancel(id: string, customerId: string) {
    // شرط customerId یعنی نوبتِ دیگران برای او «پیدا نشد» است
    const appointment = await this.appointmentRepo.findOne({
      where: { id, customerId },
    });
    if (!appointment) {
      throw new NotFoundException('نوبت مورد نظر یافت نشد.');
    }

    const reason = this.getChangeBlockReason(appointment);
    if (reason) throw new BadRequestException(reason);

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);

    return {
      message: 'نوبت با موفقیت لغو شد.',
      data: { id: appointment.id, status: appointment.status },
    };
  }

  // اگر نوبت قابل لغو نیست، دلیلش را برمی‌گرداند؛ اگر قابل لغو است null
  // اگر نوبت قابل لغو/تغییر نیست دلیلش را برمی‌گرداند؛ در غیر این صورت null
  private getChangeBlockReason(
    appointment: Appointment,
    action = 'لغو',
  ): string | null {
    const changeable =
      appointment.status === AppointmentStatus.PENDING ||
      appointment.status === AppointmentStatus.CONFIRMED;
    if (!changeable) {
      return `فقط نوبت‌های در انتظار یا تأییدشده قابل ${action} هستند.`;
    }

    const msUntilStart = appointment.startTime.getTime() - Date.now();
    if (msUntilStart < CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000) {
      return `${action} نوبت فقط تا ${CANCELLATION_WINDOW_HOURS} ساعت قبل از شروع آن ممکن است.`;
    }

    return null;
  }

  // تغییر زمان نوبت توسط مشتری
  async reschedule(
    id: string,
    customerId: string,
    dto: RescheduleAppointmentDto,
  ) {
    // شرط customerId یعنی نوبتِ دیگران برای او «پیدا نشد» است
    const appointment = await this.appointmentRepo.findOne({
      where: { id, customerId },
      relations: { service: true },
    });
    if (!appointment) {
      throw new NotFoundException('نوبت مورد نظر یافت نشد.');
    }

    const reason = this.getChangeBlockReason(appointment, 'تغییر زمان');
    if (reason) throw new BadRequestException(reason);

    if (!appointment.service) {
      throw new BadRequestException('سرویس این نوبت دیگر در دسترس نیست.');
    }

    const start = new Date(dto.startTime);
    if (isNaN(start.getTime()) || start < new Date()) {
      throw new BadRequestException('تاریخ و ساعت شروع نامعتبر است.');
    }

    const end = new Date(
      start.getTime() + appointment.service.durationMinutes * 60000,
    );

    // ساعت کاری + تداخل؛ خودِ این نوبت از چک تداخل کنار گذاشته می‌شود
    await this.assertSlotAvailable(
      appointment.specialistId,
      start,
      end,
      appointment.id,
    );

    appointment.startTime = start;
    appointment.endTime = end;
    // زمان جدید باید دوباره توسط متخصص تأیید شود
    appointment.status = AppointmentStatus.PENDING;
    await this.appointmentRepo.save(appointment);

    return {
      message: 'زمان نوبت با موفقیت تغییر کرد.',
      data: {
        id: appointment.id,
        status: appointment.status,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      },
    };
  }

  // چک می‌کند بازه‌ی [start, end] در ساعت کاری متخصص باشد و با نوبت دیگری تداخل نداشته باشد
  private async assertSlotAvailable(
    specialistId: string,
    start: Date,
    end: Date,
    excludeAppointmentId?: string,
  ) {
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
      where: { specialistId, dayOfWeek: daysMap[start.getDay()] },
    });
    if (!workingHour || !workingHour.isWorking) {
      throw new BadRequestException(
        'متخصص در این روز هفته تعطیل است یا ساعت کاری تعریف نکرده است.',
      );
    }

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const [wsH, wsM] = workingHour.startTime.split(':').map(Number);
    const [weH, weM] = workingHour.endTime.split(':').map(Number);

    if (startMinutes < wsH * 60 + wsM || endMinutes > weH * 60 + weM) {
      throw new BadRequestException(
        `زمان انتخابی خارج از ساعات کاری متخصص است. ساعات کاری این روز: ${workingHour.startTime} تا ${workingHour.endTime}`,
      );
    }

    const conflict = await this.appointmentRepo.findOne({
      where: {
        specialistId,
        status: Not(AppointmentStatus.CANCELLED),
        startTime: LessThan(end),
        endTime: MoreThan(start),
        // اگر شناسه‌ای داده شده، آن نوبت را از بررسی تداخل کنار بگذار
        ...(excludeAppointmentId ? { id: Not(excludeAppointmentId) } : {}),
      },
    });
    if (conflict) {
      throw new BadRequestException(
        'متخصص در این بازه زمانی نوبت دیگری دارد. لطفاً زمان دیگری انتخاب کنید.',
      );
    }
  }
}
