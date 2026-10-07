import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity.js';
import { Solution } from './entities/solution.entity.js';
import { User } from './entities/user.entity.js';
import { SolutionMediaService } from './solution-media.service.js';
import { SolutionsApiController } from './solutions-api.controller.js';
import { SolutionsController } from './solutions.controller.js';
import { SolutionsService } from './solutions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Solution, User, Like])],
  controllers: [SolutionsController, SolutionsApiController],
  providers: [SolutionsService, SolutionMediaService],
  exports: [SolutionsService, SolutionMediaService],
})
export class SolutionsModule {}
