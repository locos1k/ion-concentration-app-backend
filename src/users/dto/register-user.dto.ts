import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Логин должен быть строкой' })
  @IsNotEmpty({ message: 'Логин обязателен' })
  @MinLength(3, { message: 'Логин не короче 3 символов' })
  @MaxLength(50, { message: 'Логин не длиннее 50 символов' })
  username: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль не короче 6 символов' })
  @MaxLength(72, { message: 'Пароль не длиннее 72 символов' })
  password: string;
}
