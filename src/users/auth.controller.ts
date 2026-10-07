import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { getCurrentUser } from './current-user.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto.js';

@Controller('api/auth')
export class AuthController {
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() _dto: LoginUserDto): { message: string; user: UserResponseDto } {
    return {
      message: 'Заглушка: настоящая аутентификация будет в ЛР4',
      user: toUserResponse({ ...getCurrentUser(), password: '' }),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): { message: string } {
    return { message: 'Заглушка: деавторизация будет в ЛР4' };
  }
}
