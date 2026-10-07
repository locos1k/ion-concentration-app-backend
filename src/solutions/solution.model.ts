import { SolutionStatus } from './entities/solution.entity.js';

export interface SolutionView {
  id: number;
  substanceName: string;
  molarConcentration: number | null;
  description: string;
  ph: number | null;
  image: string;
  video: string;
  likedBy: number[];
  status: SolutionStatus;
  creatorId: number;
  imageUrl: string;
  videoUrl: string;
  likesCount: number;
  descriptionShort: string;
  descriptionRest: string;
}
