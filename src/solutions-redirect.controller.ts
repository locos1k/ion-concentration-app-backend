import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class SolutionsRedirectController {
  @Get()
  @Redirect('/solutions', 302)
  root() {}
}
