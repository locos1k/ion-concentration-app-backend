// src/solutions/solutions.module.ts
import { Module } from '@nestjs/common';
import { SolutionsController } from './solutions.controller.js';
import { SolutionsService } from './solutions.service.js';

@Module({
  controllers: [SolutionsController],
  providers: [SolutionsService],
})
export class SolutionsModule {}
