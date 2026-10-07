import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { getCurrentUser } from '../users/current-user.js';
import { CreateSolutionDto } from './dto/create-solution.dto.js';
import { LikeSolutionDto } from './dto/like-solution.dto.js';
import { PublishSolutionDto } from './dto/publish-solution.dto.js';
import { SolutionFeedQueryDto } from './dto/solution-feed-query.dto.js';
import { SolutionFiltersDto } from './dto/solution-filters.dto.js';
import { SolutionResponseDto, toSolutionResponse } from './dto/solution-response.dto.js';
import { SolutionView } from './solution.model.js';
import { SolutionsService } from './solutions.service.js';

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

interface SolutionUploadFiles {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
}

@Controller('api/solutions')
export class SolutionsApiController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get()
  async getList(@Query() filters: SolutionFiltersDto): Promise<SolutionResponseDto[]> {
    const views = await this.solutionsService.findPublished(filters.min, filters.max);
    return views.map((view) => this.serialize(view));
  }

  @Get('draft')
  async getDraft(): Promise<SolutionResponseDto> {
    const draft = await this.solutionsService.getDraft();
    if (!draft) throw new NotFoundException('Черновик не найден');
    return this.serialize(draft);
  }

  @Get(['feed', 'feed/:id'])
  async getFeed(
    @Param('id', new ParseIntPipe({ optional: true })) id: number | undefined,
    @Query() query: SolutionFeedQueryDto,
  ): Promise<SolutionResponseDto> {
    const view = await this.solutionsService.findFeedItem(id ?? NaN, query.next ?? false);
    return this.serializeOrNotFound(view);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      { limits: { fileSize: MAX_MEDIA_SIZE } },
    ),
  )
  async create(
    @Body() dto: CreateSolutionDto,
    @UploadedFiles() files?: SolutionUploadFiles,
  ): Promise<SolutionResponseDto> {
    const image = files?.image?.[0];
    const video = files?.video?.[0];
    if (!image || !video) {
      throw new BadRequestException('Нужны оба файла: image (изображение) и video (видео)');
    }
    const view = await this.solutionsService.createDraftWithMedia(dto.substanceName, image, video);
    return this.serialize(view);
  }

  @Put(':id/publish')
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishSolutionDto,
  ): Promise<SolutionResponseDto> {
    return this.serialize(await this.solutionsService.publish(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.solutionsService.remove(id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeSolutionDto,
  ): Promise<SolutionResponseDto> {
    return this.serialize(await this.solutionsService.setLike(id, dto.value));
  }

  private serialize(view: SolutionView): SolutionResponseDto {
    return toSolutionResponse(view, getCurrentUser().id);
  }

  private serializeOrNotFound(view: SolutionView | undefined): SolutionResponseDto {
    if (!view) throw new NotFoundException('Раствор не найден');
    return this.serialize(view);
  }
}
