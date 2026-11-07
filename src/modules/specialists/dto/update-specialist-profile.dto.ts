// src/specialists/dto/update-specialist-profile.dto.ts
import {
  IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength,
} from 'class-validator';

export class UpdateSpecialistProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience?: number;
}
