import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../solutions/entities/user.entity.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { hashPassword } from './password.js';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(dto: RegisterUserDto): Promise<User> {
    const user = this.userRepo.create({
      username: dto.username,
      password: await hashPassword(dto.password),
    });

    try {
      return await this.userRepo.save(user);
    } catch (error) {
      const code = (error as { driverError?: { code?: string } }).driverError?.code;
      if (error instanceof QueryFailedError && code === UNIQUE_VIOLATION) {
        throw new ConflictException(`Логин «${dto.username}» уже занят`);
      }
      throw error;
    }
  }
}
