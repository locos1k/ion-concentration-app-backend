// src/solutions/solution.model.ts

// Статус жизненного цикла — как в задании: черновик / опубликован / удалён
export type SolutionStatus = 'draft' | 'published' | 'deleted';

export interface Solution {
  id: number;
  substanceName: string; // "Соляная кислота"
  chemicalFormula: string; // "HCl"
  electrolyteType: string; // кислота / основание / соль
  molarConcentration: number; // моль/л — числовое поле, по нему фильтруем в ЛР1
  description: string; // текстовое описание (диссоциация и т.п.)
  volumeMl: number; // объём раствора, мл
  image: string; // ключ файла-изображения в MinIO на латинице, напр. "hcl.svg"
  video: string; // ключ файла-видео в MinIO на латинице, напр. "hcl.mp4"
  likedBy: string[]; // атомарно: просто список id пользователей, без вложенных объектов
  status: SolutionStatus;
}

// View-модель для шаблонов: к услуге добавлены вычисляемые поля
// (полные URL медиа, число лайков, короткое описание для «больше/меньше»).
export interface SolutionView extends Solution {
  imageUrl: string;
  videoUrl: string;
  likesCount: number;
  descriptionShort: string;
  descriptionRest: string;
}
