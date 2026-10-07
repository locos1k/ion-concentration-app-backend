import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    return toUserResponse(await this.usersService.register(dto));
  }
}
