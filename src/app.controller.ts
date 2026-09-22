import { Controller, Get, Redirect } from '@nestjs/common';

// Корень сайта — просто удобный редирект на ленту растворов.
// Сама предметная область живёт целиком под /solutions (см. SolutionsController).
@Controller()
export class AppController {
  @Get()
  @Redirect('/solutions', 302)
  root() {}
}
