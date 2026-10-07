import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSolutionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Название вещества должно быть строкой' })
  @IsNotEmpty({ message: 'Название вещества обязательно' })
  @MaxLength(70, { message: 'Название вещества не длиннее 70 символов' })
  substanceName: string;
}
