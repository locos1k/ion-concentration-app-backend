// src/solutions/solutions.service.ts
import { Injectable } from '@nestjs/common';
import { Solution, SolutionView } from './solution.model.js';

// Базовый адрес хранилища медиа — публичный бакет MinIO (S3 API на :9000).
// Полный URL картинки/видео = MEDIA_BASE_URL + '/' + ключ файла (поля image/video).
// Переопределяется переменной окружения MEDIA_BASE_URL (см. docker-compose.yml).
const MEDIA_BASE_URL =
  process.env.MEDIA_BASE_URL ?? 'http://localhost:9000/solution-assets';

// Длина видимой части описания на «ленте» до кнопки «больше»
const DESCRIPTION_HEAD = 90;

@Injectable()
export class SolutionsService {
  // Единственная модель-коллекция на всё приложение (без БД, как требует ЛР1).
  // Медиа хранятся двумя отдельными полями-ключами на латинице (image / video).
  private solutions: Solution[] = [
    {
      id: 1,
      substanceName: 'Соляная кислота',
      chemicalFormula: 'HCl',
      electrolyteType: 'кислота',
      molarConcentration: 0.1,
      description:
        'Сильная одноосновная кислота. В разбавленных водных растворах диссоциирует практически полностью: HCl -> H+ + Cl-. Раствор бесцветный, сильно пахнет хлороводородом.',
      volumeMl: 250,
      image: 'HCl.PNG',
      video: 'hcl.MP4',
      likedBy: Array.from({ length: 18 }, (_, i) => `user${i}`),
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
      volumeMl: 200,
      image: 'NaOH.PNG',
      video: 'naoh.MP4',
      likedBy: Array.from({ length: 4 }, (_, i) => `user${i}`),
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
      volumeMl: 300,
      image: 'NaCl.PNG',
      video: 'nacl.mov',
      likedBy: Array.from({ length: 13 }, (_, i) => `user${i}`),
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
      volumeMl: 150,
      image: 'H2SO4.PNG',
      video: 'h2so4.MP4',
      likedBy: Array.from({ length: 27 }, (_, i) => `user${i}`),
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
      volumeMl: 100,
      image: 'NH3.PNG',
      video: 'nh3.MP4',
      likedBy: [],
      status: 'draft', // ← единственный черновик, он же на странице «Добавление»
    },
    {
      id: 6,
      substanceName: 'Уксусная кислота',
      chemicalFormula: 'CH3COOH',
      electrolyteType: 'кислота',
      molarConcentration: 0.1,
      description:
        'Слабая одноосновная кислота, диссоциирует обратимо и незначительно: CH3COOH <-> CH3COO- + H+.',
      volumeMl: 120,
      image: 'CH3COOH.PNG',
      video: 'ch3cooh.MP4',
      likedBy: Array.from({ length: 9 }, (_, i) => `user${i}`),
      status: 'deleted', // ← удалённые в интерфейсе не показываются
    },
  ];

  // ---- Запрос 1: лента (по id, либо следующий за ним, если ?next=true) ----
  findFeedItem(id: number, next: boolean): SolutionView | undefined {
    const published = this.solutions.filter((s) => s.status === 'published');
    if (published.length === 0) return undefined;

    const index = published.findIndex((s) => s.id === id);
    if (index === -1) return this.toView(published[0]); // не нашли — отдаём первый

    if (next) {
      // Циклический переход: после последнего элемента — снова первый
      return this.toView(published[(index + 1) % published.length]);
    }
    return this.toView(published[index]);
  }

  // ---- Запрос 2: черновик для страницы «Добавление» ----
  getDraft(): SolutionView | undefined {
    const draft = this.solutions.find((s) => s.status === 'draft');
    return draft ? this.toView(draft) : undefined;
  }

  // ---- Запрос 3: список всех опубликованных + фильтр по молярной концентрации ----
  getAllPublished(filter?: string): SolutionView[] {
    let published = this.solutions.filter((s) => s.status === 'published');

    const value = Number(filter);
    if (filter && filter.trim() && !Number.isNaN(value)) {
      published = published.filter((s) => s.molarConcentration === value);
    }
    return published.map((s) => this.toView(s));
  }

  // Услуга -> view-модель для шаблона
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

  // Делит описание на видимую часть и «хвост» для блока «больше/меньше»
  private splitDescription(text: string): [string, string] {
    if (text.length <= DESCRIPTION_HEAD) return [text, ''];
    let cut = text.lastIndexOf(' ', DESCRIPTION_HEAD);
    if (cut < DESCRIPTION_HEAD * 0.6) cut = DESCRIPTION_HEAD;
    return [text.slice(0, cut), text.slice(cut)];
  }
}
