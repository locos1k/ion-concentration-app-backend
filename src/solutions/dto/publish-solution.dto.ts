import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class PublishSolutionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Описание должно быть строкой' })
  @IsNotEmpty({ message: 'Описание обязательно' })
  @MaxLength(500, { message: 'Описание не длиннее 500 символов' })
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Молярная концентрация — число до 3 знаков после запятой' })
  @Min(0, { message: 'Молярная концентрация не может быть отрицательной' })
  @Max(99.999, { message: 'Молярная концентрация не больше 99.999 моль/л' })
  molarConcentration: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'pH — число до 2 знаков после запятой' })
  @Min(0, { message: 'pH не меньше 0' })
  @Max(14, { message: 'pH не больше 14' })
  ph: number;
}
