import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThan, Repository } from 'typeorm';
import { Solution } from './entities/solution.entity.js';
import { SolutionView } from './solution.model.js';

const MEDIA_BASE_URL =
  process.env.MEDIA_BASE_URL ?? 'http://localhost:9000/solution-assets';

export const DEFAULT_IMAGE_URL = '/img/default-solution.PNG';
export const DEFAULT_VIDEO_URL = '/img/default-solution.mp4';

const DEFAULT_CREATOR_ID = 1;

const DESCRIPTION_HEAD = 65;

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
      where: { status: 'draft' },
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
      where: { status: 'draft', creatorId: DEFAULT_CREATOR_ID },
    });
    if (existing) return;

    const draft = this.solutionRepo.create({
      substanceName,
      image: '',
      video: '',
      status: 'draft',
      creatorId: DEFAULT_CREATOR_ID,
    });
    await this.solutionRepo.save(draft);
  }

  async publishDraft(fields: {
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

  async deleteSolution(id: number): Promise<void> {
    await this.solutionRepo.query('UPDATE solutions SET status = $1 WHERE solution_id = $2', [
      'deleted',
      id,
    ]);
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
