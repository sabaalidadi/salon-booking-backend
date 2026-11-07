// src/specialists/dto/set-specialist-services.dto.ts
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetSpecialistServicesDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  serviceIds: string[];
}
