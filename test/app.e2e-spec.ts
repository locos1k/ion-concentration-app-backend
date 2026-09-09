import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import hbs from 'hbs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function registerPartials(dir: string) {
  for (const file of readdirSync(dir)) {
    if (extname(file) !== '.hbs') continue;
    hbs.registerPartial(basename(file, '.hbs'), readFileSync(join(dir, file), 'utf8'));
  }
}

describe('Solutions (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    const expressApp = app as unknown as NestExpressApplication;
    expressApp.setBaseViewsDir(join(rootDir, 'views'));
    expressApp.setViewEngine('hbs');
    registerPartials(join(rootDir, 'views', 'partials'));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / — лента, первый опубликованный раствор', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        if (!res.text.includes('Соляная кислота')) {
          throw new Error('на ленте нет первого раствора');
        }
      });
  });

  it('GET /1?next=true — следующий раствор после первого', () => {
    return request(app.getHttpServer())
      .get('/1?next=true')
      .expect(200)
      .expect((res) => {
        if (!res.text.includes('Гидроксид натрия')) {
          throw new Error('переход к следующему раствору не сработал');
        }
      });
  });

  it('GET /draft — страница добавления с черновиком', () => {
    return request(app.getHttpServer())
      .get('/draft')
      .expect(200)
      .expect((res) => {
        if (!res.text.includes('Добавление растворов')) {
          throw new Error('нет заголовка страницы добавления');
        }
      });
  });

  it('GET /list — каталог всех опубликованных растворов', () => {
    return request(app.getHttpServer())
      .get('/list')
      .expect(200)
      .expect((res) => {
        if (!res.text.includes('Каталог растворов')) {
          throw new Error('нет заголовка каталога');
        }
      });
  });

  it('GET /list?filter=0.2 — фильтр по молярной концентрации на сервере', () => {
    return request(app.getHttpServer())
      .get('/list?filter=0.2')
      .expect(200)
      .expect((res) => {
        if (!res.text.includes('Хлорид натрия') || res.text.includes('Серная кислота')) {
          throw new Error('фильтр по концентрации работает неверно');
        }
      });
  });
});
