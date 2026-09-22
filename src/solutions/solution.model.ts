export type SolutionStatus = 'draft' | 'published' | 'deleted';

export interface Solution {
  id: number;
  substanceName: string; // "Соляная кислота"
  chemicalFormula: string; // "HCl"
  electrolyteType: string; // кислота / основание / соль
  molarConcentration: number; // моль/л — числовое поле, по нему фильтруем
  description: string; // текстовое описание (диссоциация и т.п.)
  ph: number; // водородный показатель раствора (0–14)
  image: string; // ключ файла-изображения в MinIO на латинице, напр. "hcl.svg"
  video: string; // ключ файла-видео в MinIO на латинице, напр. "hcl.mp4"
  likedBy: number[]; // готовый список числовых id пользователей
  status: SolutionStatus;
}

export interface SolutionView extends Solution {
  imageUrl: string;
  videoUrl: string;
  likesCount: number;
  descriptionShort: string;
  descriptionRest: string;
}
