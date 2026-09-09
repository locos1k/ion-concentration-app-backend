import { Module } from '@nestjs/common';
import { SolutionsModule } from './solutions/solutions.module.js';

@Module({
  imports: [SolutionsModule],
})
export class AppModule {}
