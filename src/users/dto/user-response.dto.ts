import { User } from '../../solutions/entities/user.entity.js';

export class UserResponseDto {
  id: number;
  username: string;
}

export function toUserResponse(user: User): UserResponseDto {
  return { id: user.id, username: user.username };
}
