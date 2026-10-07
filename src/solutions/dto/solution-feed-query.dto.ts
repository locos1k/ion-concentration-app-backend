import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class SolutionFeedQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean({ message: 'next должен быть true или false' })
  next?: boolean;
}
