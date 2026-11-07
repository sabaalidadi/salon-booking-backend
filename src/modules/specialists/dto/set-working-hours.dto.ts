// src/modules/specialists/dto/set-working-hours.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

// اگر روزهای هفته را به صورت Enum تعریف کرده‌اید (مثلاً از Sunday تا Saturday)
export enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

class WorkingHourItemDto {
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek: DayOfWeek;

  // فرمت ساعت مثلاً "09:00"
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime: string;

  @IsBoolean()
  isWorking: boolean;
}

export class SetWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourItemDto)
  schedule: WorkingHourItemDto[];
}
