// src/appointments/entities/appointment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { SpecialistProfile } from '../../specialists/entities/specialist-profile.entity.js';
import { SalonService } from '../../services/entities/salon-service.entity.js';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // مشتری که نوبت را گرفته
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  customer: User;

  @Column()
  customerId: string;

  // متخصصی که قرار است خدمات بدهد
  @ManyToOne(() => SpecialistProfile, { onDelete: 'CASCADE' })
  specialist: SpecialistProfile;

  @Column()
  specialistId: string;

  // خدمتی که رزرو شده
  @ManyToOne(() => SalonService, { onDelete: 'RESTRICT' })
  service: SalonService;

  @Column()
  serviceId: string;

  // زمان شروع نوبت
  @Column({ type: 'timestamp' })
  startTime: Date;

  // زمان پایان نوبت (محاسبه شده بر اساس duration سرویس)
  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
