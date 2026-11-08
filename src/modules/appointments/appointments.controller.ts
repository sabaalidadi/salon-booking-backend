// src/modules/appointments/appointments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { AppointmentStatus } from './entities/appointment.entity.js';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto.js';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}


  @Post()
  @Roles(UserRole.CUSTOMER)
  create(
    @CurrentUser() user: { id: string },
    @Body() createDto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(user.id, createDto);
  }

  // مشاهده نوبت‌های مشتریِ لاگین‌شده
  @Get('my')
  @Roles(UserRole.CUSTOMER)
  findMy(@CurrentUser() user: { id: string }) {
    return this.appointmentsService.findCustomerAppointments(user.id);
  }

  // مشاهده نوبت‌های متخصصِ لاگین‌شده
  @Get('specialist')
  @Roles(UserRole.SPECIALIST)
  findSpecialistAppointments(@CurrentUser() user: { id: string }) {
    return this.appointmentsService.findSpecialistAppointments(user.id);
  }

  // تغییر وضعیت نوبت (تایید/لغو توسط متخصص)
  @Patch(':id/status')
  @Roles(UserRole.SPECIALIST, UserRole.ADMIN)
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(id, status);
  }

  // لغو نوبت توسط مشتری (با محدودیت ۲۴ ساعت، منطقش در سرویس است)
  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.appointmentsService.cancel(id, user.id);
  }
  // تغییر زمان نوبت توسط مشتری (قوانینش در سرویس است)
  @Patch(':id/reschedule')
  @Roles(UserRole.CUSTOMER)
  reschedule(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(id, user.id, dto);
  }
  // جزئیات یک نوبت (مشتری صاحب نوبت، متخصص همان نوبت، یا ادمین)
  // ⚠️ حتماً آخر کلاس بماند، بعد از 'my' و 'specialist'
  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.SPECIALIST, UserRole.ADMIN)
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.appointmentsService.findOne(id, user);
  }
}