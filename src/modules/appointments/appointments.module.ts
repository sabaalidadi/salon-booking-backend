// src/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { Appointment } from './entities/appointment.entity.js';
import { SalonService } from '../services/entities/salon-service.entity.js';
import { SpecialistProfile } from '../specialists/entities/specialist-profile.entity.js';
import { SpecialistWorkingHour } from '../specialists/entities/working-hour.entity.js'; // این ایمپورت اضافه شود
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      SalonService,
      SpecialistProfile,
      SpecialistWorkingHour, // این ریپازیتوری را اینجا اضافه کنید
    ]),
    AuthModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
