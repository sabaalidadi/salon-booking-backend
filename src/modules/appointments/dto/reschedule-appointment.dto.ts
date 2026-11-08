// src/modules/appointments/dto/reschedule-appointment.dto.ts
import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsDateString()
  @IsNotEmpty()
  startTime: string; // مثال: "2026-11-10T11:00:00.000Z"
}