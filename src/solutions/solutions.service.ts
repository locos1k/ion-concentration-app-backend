import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { PublishSolutionDto } from './dto/publish-solution.dto.js';
import { Like } from './entities/like.entity.js';
import { Solution, SolutionStatus } from './entities/solution.entity.js';
import { SolutionMediaService } from './solution-media.service.js';
import { SolutionView } from './solution.model.js';
import { getCurrentUser } from '../users/current-user.js';

const MEDIA_BASE_URL =
  process.env.MEDIA_BASE_URL ?? 'http://localhost:9000/solution-assets';

export const DEFAULT_IMAGE_URL = '/img/default-solution.PNG';
export const DEFAULT_VIDEO_URL = '/img/default-solution.mp4';

const DESCRIPTION_HEAD = 65;

const ALLOWED_TRANSITIONS: Record<SolutionStatus, SolutionStatus[]> = {
  draft: ['published', 'deleted'],
  published: ['deleted'],
  deleted: [],
};

function assertTransition(from: SolutionStatus, to: SolutionStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(`Нельзя изменить статус «${from}» на «${to}»`);
  }
}

export const FILTER_RANGE = { min: 0, max: 0.25, step: 0.01 } as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

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
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    private readonly media: SolutionMediaService,
  ) {}

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
      where: { status: 'draft', creatorId: getCurrentUser().id },
      relations: { likes: true },
    });
    return entity ? this.toView(entity) : undefined;
  }

  async getAllPublished(min?: string, max?: string): Promise<SolutionView[]> {
    const { min: minVal, max: maxVal } = resolveFilterRange(min, max);

    const entities = await this.solutionRepo.find({
      where: { status: 'published', molarConcentration: Between(minVal, maxVal) },
      order: { id: 'ASC' },
      relations: { likes: true },
    });

    return entities.map((s) => this.toView(s));
  }

  async createDraft(substanceName: string): Promise<void> {
    const existing = await this.solutionRepo.findOne({
      where: { status: 'draft', creatorId: getCurrentUser().id },
    });
    if (existing) return;

    const draft = this.solutionRepo.create({
      substanceName,
      image: '',
      video: '',
      status: 'draft',
      creatorId: getCurrentUser().id,
    });
    await this.solutionRepo.save(draft);
  }

  async publishDraft(fields: {
    molarConcentration: number;
    ph: number;
    description: string;
  }): Promise<void> {
    const draft = await this.solutionRepo.findOne({
      where: { status: 'draft', creatorId: getCurrentUser().id },
    });
    if (!draft) return;

    await this.solutionRepo.update(draft.id, {
      ...fields,
      status: 'published',
      publishedAt: new Date(),
    });
  }

  async deleteSolution(id: number): Promise<void> {
    await this.solutionRepo.query('UPDATE solutions SET status = $1 WHERE solution_id = $2', [
      'deleted',
      id,
    ]);
  }

  async findPublished(min?: number, max?: number): Promise<SolutionView[]> {
    const where: FindOptionsWhere<Solution> = { status: 'published' };
    if (min !== undefined && max !== undefined) where.molarConcentration = Between(min, max);
    else if (min !== undefined) where.molarConcentration = MoreThanOrEqual(min);
    else if (max !== undefined) where.molarConcentration = LessThanOrEqual(max);

    const entities = await this.solutionRepo.find({
      where,
      order: { id: 'ASC' },
      relations: { likes: true },
    });
    return entities.map((s) => this.toView(s));
  }

  async createDraftWithMedia(
    substanceName: string,
    image: Express.Multer.File,
    video: Express.Multer.File,
  ): Promise<SolutionView> {
    const creatorId = getCurrentUser().id;
    const existing = await this.solutionRepo.findOne({ where: { status: 'draft', creatorId } });
    if (existing) throw new ConflictException('У пользователя уже есть черновик');

    const uploaded: string[] = [];
    try {
      const imageKey = await this.media.upload(image, 'image');
      uploaded.push(imageKey);
      const videoKey = await this.media.upload(video, 'video');
      uploaded.push(videoKey);

      const saved = await this.solutionRepo.save(
        this.solutionRepo.create({
          substanceName,
          image: imageKey,
          video: videoKey,
          status: 'draft',
          creatorId,
        }),
      );
      return await this.loadView(saved.id);
    } catch (error) {
      await Promise.allSettled(uploaded.map((key) => this.media.remove(key)));
      throw error;
    }
  }

  async publish(id: number, fields: PublishSolutionDto): Promise<SolutionView> {
    const entity = await this.findOwned(id);
    assertTransition(entity.status, 'published');

    await this.solutionRepo.update(id, {
      description: fields.description,
      molarConcentration: fields.molarConcentration,
      ph: fields.ph,
      status: 'published',
      publishedAt: new Date(),
    });
    return this.loadView(id);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOwned(id);
    assertTransition(entity.status, 'deleted');
    await this.solutionRepo.update(id, { status: 'deleted' });
  }

  async setLike(id: number, value: 0 | 1): Promise<SolutionView> {
    const userId = getCurrentUser().id;
    const entity = await this.solutionRepo.findOne({
      where: { id, status: 'published' },
      relations: { likes: true },
    });
    if (!entity) throw new NotFoundException(`Раствор ${id} не найден`);

    const existing = entity.likes.find((like) => like.userId === userId);
    if (value === 1 && !existing) {
      await this.likeRepo.save(this.likeRepo.create({ userId, solutionId: id }));
    } else if (value === 0 && existing) {
      await this.likeRepo.delete(existing.id);
    }
    return this.loadView(id);
  }

  private async findOwned(id: number): Promise<Solution> {
    const entity = await this.solutionRepo.findOne({ where: { id } });
    if (!entity || entity.status === 'deleted') {
      throw new NotFoundException(`Раствор ${id} не найден`);
    }
    if (entity.creatorId !== getCurrentUser().id) {
      throw new ForbiddenException('Менять можно только свои растворы');
    }
    return entity;
  }

  private async loadView(id: number): Promise<SolutionView> {
    const entity = await this.solutionRepo.findOneOrFail({
      where: { id },
      relations: { likes: true },
    });
    return this.toView(entity);
  }

  private toView(s: Solution): SolutionView {
    const description = s.description ?? '';
    const [head, rest] = this.splitDescription(description);
    return {
      id: s.id,
      substanceName: s.substanceName,
      molarConcentration: s.molarConcentration,
      description,
      ph: s.ph,
      image: s.image,
      video: s.video,
      likedBy: s.likes.map((like) => like.userId),
      status: s.status,
      creatorId: s.creatorId,
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
