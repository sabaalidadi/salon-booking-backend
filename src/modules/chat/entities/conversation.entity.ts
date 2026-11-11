import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { SpecialistProfile } from '../../specialists/entities/specialist-profile.entity.js';

@Entity('conversations')
@Unique(['customerId', 'specialistId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => SpecialistProfile, { nullable: false, onDelete: 'CASCADE' })
  specialist: SpecialistProfile;

  @Column()
  specialistId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
