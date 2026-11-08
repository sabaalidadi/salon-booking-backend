// src/modules/reviews/entities/review.entity.ts
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { SpecialistProfile } from '../../specialists/entities/specialist-profile.entity.js';
import { Appointment } from '../../appointments/entities/appointment.entity.js';

@Entity('reviews')
@Check('"rating" >= 1 AND "rating" <= 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // هر نوبت حداکثر یک نظر دارد (OneToOne ستون را خودکار یکتا می‌کند)
  @OneToOne(() => Appointment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  // مشتری‌ای که نظر داده
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  customer: User;

  @Column()
  customerId: string;

  // متخصصی که نظر برای اوست (از روی نوبت کپی می‌شود تا محاسبه‌ی میانگین ساده باشد)
  @ManyToOne(() => SpecialistProfile, { nullable: false, onDelete: 'CASCADE' })
  specialist: SpecialistProfile;

  @Column()
  specialistId: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}