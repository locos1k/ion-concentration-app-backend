import { Injectable } from '@nestjs/common';
import { Solution, SolutionView } from './solution.model.js';

const MEDIA_BASE_URL =
  process.env.MEDIA_BASE_URL ?? 'http://localhost:9000/solution-assets';

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
  private solutions: Solution[] = [
    {
      id: 1,
      substanceName: 'Соляная кислота',
      chemicalFormula: 'HCl',
      electrolyteType: 'кислота',
      molarConcentration: 0.1,
      description:
        'Сильная одноосновная кислота. В разбавленных водных растворах диссоциирует практически полностью: HCl -> H+ + Cl-. Раствор бесцветный, сильно пахнет хлороводородом.',
      ph: 1,
      image: 'HCl.PNG',
      video: 'hcl.MP4',
      likedBy: [2, 5, 8, 9, 11, 14, 17, 19, 23, 26, 29, 31, 34, 37, 40, 42, 45, 48],
      status: 'published',
    },
    {
      id: 2,
      substanceName: 'Гидроксид натрия',
      chemicalFormula: 'NaOH',
      electrolyteType: 'основание',
      molarConcentration: 0.05,
      description:
        'Сильное однокислотное основание, в водном растворе диссоциирует нацело: NaOH -> Na+ + OH-. Растворение сопровождается сильным разогревом.',
      ph: 12.7,
      image: 'NaOH.PNG',
      video: 'naoh.MP4',
      likedBy: [3, 10, 21, 34],
      status: 'published',
    },
    {
      id: 3,
      substanceName: 'Хлорид натрия',
      chemicalFormula: 'NaCl',
      electrolyteType: 'соль',
      molarConcentration: 0.2,
      description:
        'Соль сильной кислоты и сильного основания, полностью диссоциирует: NaCl -> Na+ + Cl-. Среда раствора нейтральная, гидролиза нет.',
      ph: 7,
      image: 'NaCl.PNG',
      video: 'nacl.mov',
      likedBy: [1, 3, 5, 6, 7, 12, 15, 18, 22, 25, 29, 33, 36],
      status: 'published',
    },
    {
      id: 4,
      substanceName: 'Серная кислота',
      chemicalFormula: 'H2SO4',
      electrolyteType: 'кислота',
      molarConcentration: 0.01,
      description:
        'Сильная двухосновная кислота, диссоциирует ступенчато: по первой ступени практически полностью, по второй — частично.',
      ph: 1.7,
      image: 'H2SO4.PNG',
      video: 'h2so4.MP4',
      likedBy: [
        1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 25, 26, 28, 29,
        30, 31, 33,
      ],
      status: 'published',
    },
    {
      id: 5,
      substanceName: 'Аммиак',
      chemicalFormula: 'NH3',
      electrolyteType: 'основание',
      molarConcentration: 0.03,
      description:
        'Слабое основание, в растворе диссоциирует лишь частично: NH3 + H2O <-> NH4+ + OH-. Степень диссоциации мала.',
      ph: 11.1,
      image: 'NH3.PNG',
      video: 'nh3.MP4',
      likedBy: [],
      status: 'draft',
    },
    {
      id: 6,
      substanceName: 'Уксусная кислота',
      chemicalFormula: 'CH3COOH',
      electrolyteType: 'кислота',
      molarConcentration: 0.1,
      description:
        'Слабая одноосновная кислота, диссоциирует обратимо и незначительно: CH3COOH <-> CH3COO- + H+.',
      ph: 2.9,
      image: 'CH3COOH.PNG',
      video: 'ch3cooh.MP4',
      likedBy: [4, 7, 12, 15, 19, 22, 26, 30, 33],
      status: 'deleted',
    },
  ];

  findFeedItem(id: number, next: boolean): SolutionView | undefined {
    const published = this.solutions.filter((s) => s.status === 'published');
    if (published.length === 0) return undefined;

    const index = published.findIndex((s) => s.id === id);
    if (index === -1) return this.toView(published[0]);

    if (next) {
      return this.toView(published[(index + 1) % published.length]);
    }
    return this.toView(published[index]);
  }

  getDraft(): SolutionView | undefined {
    const draft = this.solutions.find((s) => s.status === 'draft');
    return draft ? this.toView(draft) : undefined;
  }

  // Двойной слайдер: показываем растворы с концентрацией в диапазоне [min; max].
  getAllPublished(min?: string, max?: string): SolutionView[] {
    const published = this.solutions.filter((s) => s.status === 'published');
    const { min: minVal, max: maxVal } = resolveFilterRange(min, max);

    return published
      .filter((s) => s.molarConcentration >= minVal && s.molarConcentration <= maxVal)
      .map((s) => this.toView(s));
  }

  private toView(s: Solution): SolutionView {
    const [head, rest] = this.splitDescription(s.description);
    return {
      ...s,
      imageUrl: `${MEDIA_BASE_URL}/${s.image}`,
      videoUrl: `${MEDIA_BASE_URL}/${s.video}`,
      likesCount: s.likedBy.length,
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
