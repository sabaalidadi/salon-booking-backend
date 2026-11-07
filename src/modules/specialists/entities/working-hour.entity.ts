// src/specialists/entities/working-hour.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { SpecialistProfile } from './specialist-profile.entity.js';

export enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

@Entity('specialist_working_hours')
export class SpecialistWorkingHour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SpecialistProfile, (profile) => profile.workingHours, {
    onDelete: 'CASCADE',
  })
  specialist: Relation<SpecialistProfile>;

  @Column()
  specialistId: string;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  // ساعت شروع به فرمت رشته‌ای مثل "09:00"
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  // ساعت پایان به فرمت رشته‌ای مثل "17:00"
  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @Column({ type: 'boolean', default: true })
  isWorking: boolean; // آیا در این روز کار می‌کند یا تعطیل است؟

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
