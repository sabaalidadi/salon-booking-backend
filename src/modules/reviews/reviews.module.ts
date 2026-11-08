// src/modules/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { SpecialistProfile } from '../specialists/entities/specialist-profile.entity.js';
import { Review } from './entities/review.entity.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  imports: [
    // entityهایی که سرویس این ماژول به repository آن‌ها نیاز دارد
    TypeOrmModule.forFeature([Review, Appointment, SpecialistProfile]),
    // برای JwtAuthGuard و RolesGuard
    AuthModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}