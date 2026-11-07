// src/appointments/dto/create-appointment.dto.ts
import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID('4')
  @IsNotEmpty()
  specialistId: string;

  @IsUUID('4')
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string; // مثال: "2026-11-10T10:00:00.000Z"
}
