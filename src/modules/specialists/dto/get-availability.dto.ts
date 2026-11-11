// src/modules/specialists/dto/get-availability.dto.ts
import { IsDateString, IsUUID, Matches } from 'class-validator';

export class GetAvailabilityDto {
  // فقط تاریخ، بدون ساعت. مثال: 2026-11-10
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date باید به فرمت YYYY-MM-DD باشد',
  })
  @IsDateString({ strict: true }, { message: 'date یک تاریخ معتبر نیست' })
  date: string;

  // شناسه‌ی سرویسی که مشتری می‌خواهد رزرو کند
  @IsUUID('4', { message: 'serviceId باید یک UUID معتبر باشد' })
  serviceId: string;
}

