import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import hbs from 'hbs';
import { AppModule } from './app.module.js';

// В ESM нет __dirname — восстанавливаем его из import.meta.url.
// Скомпилированный main.js лежит в dist/, поэтому '..' даёт корень проекта.
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

// Регистрируем частичные шаблоны из views/partials.
// Делаем это вручную и синхронно: hbs.registerPartials() заменяет дефис на
// подчёркивание в имени, из-за чего {{> solution-card}} не находится.
function registerPartials(dir: string) {
  for (const file of readdirSync(dir)) {
    if (extname(file) !== '.hbs') continue;
    const name = basename(file, '.hbs');
    hbs.registerPartial(name, readFileSync(join(dir, file), 'utf8'));
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Статика: /css/style.css и /img/*.svg берутся из папки public
  app.useStaticAssets(join(rootDir, 'public'));

  // Handlebars как шаблонизатор, шаблоны страниц — в views/
  app.setBaseViewsDir(join(rootDir, 'views'));
  app.setViewEngine('hbs');

  registerPartials(join(rootDir, 'views', 'partials'));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
