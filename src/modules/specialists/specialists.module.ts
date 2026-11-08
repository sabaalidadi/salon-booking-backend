// src/specialists/specialists.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { StorageModule } from '../../common/storage/storage.module.js';
import { User } from '../users/entities/user.entity.js';
import { SalonService } from '../services/entities/salon-service.entity.js';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { SpecialistProfile } from './entities/specialist-profile.entity.js';
import { SpecialistWorkingHour } from './entities/working-hour.entity.js';
import { SpecialistsController } from './specialists.controller.js';
import { SpecialistsService } from './specialists.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpecialistProfile,
      SpecialistWorkingHour,
      User,
      SalonService,
      Appointment,
    ]),
    AuthModule,
    StorageModule,
  ],
  controllers: [SpecialistsController],
  providers: [SpecialistsService],
})
export class SpecialistsModule {}