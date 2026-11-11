import {
  IsBoolean,
  IsInt,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'عنوان نباید فقط شامل فاصله باشد' })
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  priceAmount!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
