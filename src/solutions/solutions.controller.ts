import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import { FILTER_RANGE, resolveFilterRange, SolutionsService } from './solutions.service.js';

@Controller('solutions')
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get('draft')
  @Render('add')
  getDraftPage() {
    return { draft: this.solutionsService.getDraft() };
  }

  // Двойной слайдер: ?min=..&max=.. — молярная концентрация в диапазоне
  @Get('list')
  @Render('grid')
  getGrid(@Query('min') min?: string, @Query('max') max?: string) {
    // Нормализуем один раз: те же min/max уходят и в выборку, и в разметку
    // слайдера, поэтому после сабмита бегунки уже не смогут перескочить друг
    // друга (см. min/max-атрибуты в grid.hbs).
    const { min: filterMin, max: filterMax } = resolveFilterRange(min, max);
    return {
      solutions: this.solutionsService.getAllPublished(min, max),
      filterMin,
      filterMax,
      filterBoundMin: FILTER_RANGE.min,
      filterBoundMax: FILTER_RANGE.max,
      filterStep: FILTER_RANGE.step,
    };
  }

  @Get(['/', ':id'])
  @Render('feed')
  getFeed(@Param('id') id?: string, @Query('next') next?: string) {
    const solution = this.solutionsService.findFeedItem(Number(id), next === 'true');
    return { solution };
  }
}
