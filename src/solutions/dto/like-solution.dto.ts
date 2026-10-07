import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';

export class LikeSolutionDto {
  @Type(() => Number)
  @IsIn([0, 1], { message: 'value: 1 — поставить лайк, 0 — отменить' })
  value: 0 | 1;
}
