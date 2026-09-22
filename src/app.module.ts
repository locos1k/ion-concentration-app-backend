import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { SolutionsModule } from './solutions/solutions.module.js';

@Module({
  imports: [SolutionsModule],
  controllers: [AppController],
})
export class AppModule {}
