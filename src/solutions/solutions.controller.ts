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
import { FILTER_RANGE, resolveFilterRange, SolutionsService } from './solutions.service.js';

@Controller('solutions')
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get('draft')
  @Render('add')
  async getDraftPage() {
    return { draft: await this.solutionsService.getDraft() };
  }

  // Шаг 1 добавления: только название, фото/видео на этом шаге не сохраняются.
  @Post('draft')
  @Redirect('/solutions/draft', 302)
  async createDraft(@Body('substanceName') substanceName?: string) {
    if (substanceName?.trim()) {
      await this.solutionsService.createDraft(substanceName.trim());
    }
  }

  // Шаг 2: заполняем оставшиеся поля и публикуем черновик.
  @Post('draft/publish')
  @Redirect('/solutions/list', 302)
  async publishDraft(
    @Body('chemicalFormula') chemicalFormula?: string,
    @Body('electrolyteType') electrolyteType?: string,
    @Body('molarConcentration') molarConcentration?: string,
    @Body('ph') ph?: string,
    @Body('description') description?: string,
  ) {
    await this.solutionsService.publishDraft({
      chemicalFormula: chemicalFormula ?? '',
      electrolyteType: electrolyteType ?? '',
      molarConcentration: Number(molarConcentration) || 0,
      ph: Number(ph) || 0,
      description: description ?? '',
    });
  }

  // Двойной слайдер: ?min=..&max=.. — молярная концентрация в диапазоне
  @Get('list')
  @Render('grid')
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

  // Логическое удаление — только смена статуса, сырым SQL (см. сервис).
  @Post(':id/delete')
  @Redirect('/solutions/list', 302)
  async deleteSolution(@Param('id', ParseIntPipe) id: number) {
    await this.solutionsService.deleteSolution(id);
  }

  @Get(['/', ':id'])
  @Render('feed')
  async getFeed(@Param('id') id?: string, @Query('next') next?: string) {
    const solution = await this.solutionsService.findFeedItem(Number(id), next === 'true');
    return { solution };
  }
}
