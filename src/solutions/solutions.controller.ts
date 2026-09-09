// src/solutions/solutions.controller.ts
import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import { SolutionsService } from './solutions.service.js';

@Controller()
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  // 1) GET /draft — страница «Добавление» с данными единственного черновика.
  //    Объявлена ДО ':id', иначе Nest примет "draft" за id.
  @Get('draft')
  @Render('add')
  getDraftPage() {
    return { draft: this.solutionsService.getDraft() };
  }

  // 2) GET /list?filter=0.1 — «Плитка»: список всех карточек + фильтр по
  //    молярной концентрации на сервере. Значение фильтра сохраняется в поле.
  @Get('list')
  @Render('grid')
  getGrid(@Query('filter') filter?: string) {
    return {
      solutions: this.solutionsService.getAllPublished(filter),
      filterValue: filter ?? '',
    };
  }

  // 3) GET /  и  GET /:id?next=true — «Лента».
  //    Без id — первый опубликованный раствор (сюда ведёт «домик» в навбаре).
  //    С id — конкретный раствор; с ?next=true — следующий за ним по кругу.
  @Get(['/', ':id'])
  @Render('feed')
  getFeed(@Param('id') id?: string, @Query('next') next?: string) {
    const solution = this.solutionsService.findFeedItem(Number(id), next === 'true');
    return { solution };
  }
}
