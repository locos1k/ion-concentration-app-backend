import { SolutionStatus } from './entities/solution.entity.js';

export interface SolutionView {
  id: number;
  substanceName: string;
  chemicalFormula: string;
  electrolyteType: string;
  molarConcentration: number;
  description: string;
  ph: number;
  image: string;
  video: string;
  likedBy: number[];
  status: SolutionStatus;
  imageUrl: string;
  videoUrl: string;
  likesCount: number;
  descriptionShort: string;
  descriptionRest: string;
}
