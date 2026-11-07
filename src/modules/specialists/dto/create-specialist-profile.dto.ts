// src/specialists/dto/create-specialist-profile.dto.ts
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateSpecialistProfileDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  bio: string;

  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience: number;
}
