import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class SolutionFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'min должен быть числом' })
  @Min(0, { message: 'Значение не может быть отрицательным' })
  min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'max должен быть числом' })
  @Min(0, { message: 'Значение не может быть отрицательным' })
  max?: number;
}
