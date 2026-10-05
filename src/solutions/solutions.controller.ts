import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';
import {
  DEFAULT_IMAGE_URL,
  DEFAULT_VIDEO_URL,
  FILTER_RANGE,
  resolveFilterRange,
  SolutionsService,
} from './solutions.service.js';

@Controller('solutions')
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get('draft')
  @Render('solution-add')
  async getDraftPage() {
    return {
      draft: await this.solutionsService.getDraft(),
      defaultImageUrl: DEFAULT_IMAGE_URL,
      defaultVideoUrl: DEFAULT_VIDEO_URL,
    };
  }

  @Post('draft')
  @Redirect('/solutions/draft', 302)
  async createDraft(@Body('substanceName') substanceName?: string) {
    if (substanceName?.trim()) {
      await this.solutionsService.createDraft(substanceName.trim());
    }
  }

  @Post('draft/publish')
  @Redirect('/solutions/list', 302)
  async publishDraft(
    @Body('molarConcentration') molarConcentration?: string,
    @Body('ph') ph?: string,
    @Body('description') description?: string,
  ) {
    await this.solutionsService.publishDraft({
      molarConcentration: Number(molarConcentration) || 0,
      ph: Number(ph) || 0,
      description: description ?? '',
    });
  }

  @Get('list')
  @Render('solution-grid')
  async getGrid(@Query('min') min?: string, @Query('max') max?: string) {
    const { min: filterMin, max: filterMax } = resolveFilterRange(min, max);
    return {
      solutions: await this.solutionsService.getAllPublished(min, max),
      filterMin,
      filterMax,
      filterBoundMin: FILTER_RANGE.min,
      filterBoundMax: FILTER_RANGE.max,
      filterStep: FILTER_RANGE.step,
    };
  }

  @Post(':id/delete')
  @Redirect('/solutions/list', 302)
  async deleteSolution(@Param('id', ParseIntPipe) id: number) {
    await this.solutionsService.deleteSolution(id);
  }

  @Get(['/', ':id'])
  @Render('solution-feed')
  async getFeed(@Param('id') id?: string, @Query('next') next?: string) {
    const solution = await this.solutionsService.findFeedItem(Number(id), next === 'true');
    return { solution };
  }
}
