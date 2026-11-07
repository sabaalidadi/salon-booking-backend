// src/specialists/entities/specialist-profile.entity.ts
import {
  Column, Entity, JoinColumn, JoinTable, ManyToMany,
  OneToMany,
  OneToOne, PrimaryGeneratedColumn, type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { SalonService } from '../../services/entities/salon-service.entity.js';
import { SpecialistWorkingHour } from './working-hour.entity.js';

@Entity('specialist_profiles')
export class SpecialistProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 1000 })
  bio: string;

  @Column({ type: 'int', default: 0 })
  yearsExperience: number;

  // در SpecialistProfile (تکمیل روابط):
@OneToMany(() => SpecialistWorkingHour, (wh) => wh.specialist, { cascade: true })
workingHours: Relation<SpecialistWorkingHour[]>;


  @ManyToMany(() => SalonService)
  @JoinTable({
    name: 'specialist_profile_services',
    joinColumn: { name: 'specialistProfileId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services: SalonService[];


}
