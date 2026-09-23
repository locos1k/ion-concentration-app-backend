import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThan, Repository } from 'typeorm';
import { Solution } from './entities/solution.entity.js';
import { SolutionView } from './solution.model.js';

const MEDIA_BASE_URL =
  process.env.MEDIA_BASE_URL ?? 'http://localhost:9000/solution-assets';

// Фото/видео по умолчанию — для новых черновиков (в ЛР2 файлы при создании
// не сохраняются) и для случаев с недоступным файлом. Хранятся локально на
// SSR-сервере (public/img), а не в MinIO.
const DEFAULT_IMAGE_URL = '/img/default-solution.PNG';
const DEFAULT_VIDEO_URL = '/img/default-solution.mp4';

// Пока нет реального пользователя (авторизация — ЛР4), все черновики
// принадлежат одному фиксированному "создателю". Станет функцией-singleton в ЛР3.
const DEFAULT_CREATOR_ID = 1;

// Видимая часть описания на «ленте» до кнопки «Ещё» — подобрана так,
// чтобы влезало ровно 2 строки в колонку шириной 341px (шрифт 14px monospace).
const DESCRIPTION_HEAD = 65;

// Границы и шаг двойного слайдера фильтра на «Плитке» (моль/л).
export const FILTER_RANGE = { min: 0, max: 0.25, step: 0.01 } as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Разбирает сырые query-параметры слайдера в валидную пару границ: подставляет
// дефолты при отсутствии/мусоре и зажимает в FILTER_RANGE. Местами НЕ меняет —
// если бегунки перепутаны (min > max), это не ошибка, просто по такому
// диапазону ничего не найдётся (getAllPublished отдаст пустой список).
export function resolveFilterRange(minRaw?: string, maxRaw?: string): { min: number; max: number } {
  const parse = (raw: string | undefined, fallback: number) => {
    const value = Number(raw);
    return raw !== undefined && raw.trim() !== '' && !Number.isNaN(value) ? value : fallback;
  };

  const min = clamp(parse(minRaw, FILTER_RANGE.min), FILTER_RANGE.min, FILTER_RANGE.max);
  const max = clamp(parse(maxRaw, FILTER_RANGE.max), FILTER_RANGE.min, FILTER_RANGE.max);
  return { min, max };
}

@Injectable()
export class SolutionsService {
  constructor(
    @InjectRepository(Solution)
    private readonly solutionRepo: Repository<Solution>,
  ) {}

  // Лента: каждая ветка — ровно один SELECT ... LIMIT 1, без выборки массива
  // с фильтрацией в коде (так требует методичка).
  async findFeedItem(id: number, next: boolean): Promise<SolutionView | undefined> {
    let entity: Solution | null;

    if (Number.isNaN(id)) {
      entity = await this.solutionRepo.findOne({
        where: { status: 'published' },
        order: { id: 'ASC' },
        relations: { likes: true },
      });
    } else if (next) {
      entity = await this.solutionRepo.findOne({
        where: { status: 'published', id: MoreThan(id) },
        order: { id: 'ASC' },
        relations: { likes: true },
      });
      if (!entity) {
        entity = await this.solutionRepo.findOne({
          where: { status: 'published' },
          order: { id: 'ASC' },
          relations: { likes: true },
        });
      }
    } else {
      entity = await this.solutionRepo.findOne({
        where: { id, status: 'published' },
        relations: { likes: true },
      });
    }

    return entity ? this.toView(entity) : undefined;
  }

  async getDraft(): Promise<SolutionView | undefined> {
    const entity = await this.solutionRepo.findOne({
      where: { status: 'draft' },
      relations: { likes: true },
    });
    return entity ? this.toView(entity) : undefined;
  }

  // Двойной слайдер: показываем растворы с концентрацией в диапазоне [min; max].
  async getAllPublished(min?: string, max?: string): Promise<SolutionView[]> {
    const { min: minVal, max: maxVal } = resolveFilterRange(min, max);

    const entities = await this.solutionRepo.find({
      where: { status: 'published', molarConcentration: Between(minVal, maxVal) },
      order: { id: 'ASC' },
      relations: { likes: true },
    });

    return entities.map((s) => this.toView(s));
  }

  // Создание черновика — через ORM. По заданию фото/видео на этом шаге не
  // сохраняются, только название; остальные поля заполняются на публикации.
  // Черновик у "создателя" может быть только один — если уже есть, просто
  // возвращаемся к нему, новую строку не создаём.
  async createDraft(substanceName: string): Promise<void> {
    const existing = await this.solutionRepo.findOne({
      where: { status: 'draft', creatorId: DEFAULT_CREATOR_ID },
    });
    if (existing) return;

    const draft = this.solutionRepo.create({
      substanceName,
      chemicalFormula: '',
      electrolyteType: '',
      molarConcentration: 0,
      ph: 0,
      description: '',
      image: '',
      video: '',
      status: 'draft',
      publishedAt: null,
      creatorId: DEFAULT_CREATOR_ID,
    });
    await this.solutionRepo.save(draft);
  }

  // Публикация черновика — через ORM. Меняем статус на published и
  // проставляем дату формирования.
  async publishDraft(fields: {
    chemicalFormula: string;
    electrolyteType: string;
    molarConcentration: number;
    ph: number;
    description: string;
  }): Promise<void> {
    const draft = await this.solutionRepo.findOne({
      where: { status: 'draft', creatorId: DEFAULT_CREATOR_ID },
    });
    if (!draft) return;

    await this.solutionRepo.update(draft.id, {
      ...fields,
      status: 'published',
      publishedAt: new Date(),
    });
  }

  // Логическое удаление — НЕ через ORM, а сырым SQL UPDATE (так требует
  // задание ЛР2: получение/создание/публикация через ORM, удаление — курсором).
  async deleteSolution(id: number): Promise<void> {
    await this.solutionRepo.query('UPDATE solutions SET status = $1 WHERE solution_id = $2', [
      'deleted',
      id,
    ]);
  }

  private toView(s: Solution): SolutionView {
    const [head, rest] = this.splitDescription(s.description);
    return {
      id: s.id,
      substanceName: s.substanceName,
      chemicalFormula: s.chemicalFormula,
      electrolyteType: s.electrolyteType,
      molarConcentration: s.molarConcentration,
      description: s.description,
      ph: s.ph,
      image: s.image,
      video: s.video,
      likedBy: s.likes.map((like) => like.userId),
      status: s.status,
      imageUrl: s.image ? `${MEDIA_BASE_URL}/${s.image}` : DEFAULT_IMAGE_URL,
      videoUrl: s.video ? `${MEDIA_BASE_URL}/${s.video}` : DEFAULT_VIDEO_URL,
      likesCount: s.likes.length,
      descriptionShort: head,
      descriptionRest: rest,
    };
  }

  private splitDescription(text: string): [string, string] {
    if (text.length <= DESCRIPTION_HEAD) return [text, ''];
    let cut = text.lastIndexOf(' ', DESCRIPTION_HEAD);
    if (cut < DESCRIPTION_HEAD * 0.6) cut = DESCRIPTION_HEAD;
    return [text.slice(0, cut), text.slice(cut)];
  }
}
