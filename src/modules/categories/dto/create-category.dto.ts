import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'عنوان نباید فقط شامل فاصله باشد' })
  @MaxLength(80)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
