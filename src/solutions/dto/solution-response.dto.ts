import { SolutionStatus } from '../entities/solution.entity.js';
import { SolutionView } from '../solution.model.js';

export class SolutionResponseDto {
  id: number;
  substanceName: string;
  description: string;
  molarConcentration: number | null;
  ph: number | null;
  imageUrl: string;
  videoUrl: string;
  likesCount: number;
  isLiked: boolean;
  isCreator: 0 | 1;
  status: SolutionStatus;
}

export function toSolutionResponse(view: SolutionView, currentUserId: number): SolutionResponseDto {
  return {
    id: view.id,
    substanceName: view.substanceName,
    description: view.description,
    molarConcentration: view.molarConcentration,
    ph: view.ph,
    imageUrl: view.imageUrl,
    videoUrl: view.videoUrl,
    likesCount: view.likesCount,
    isLiked: view.likedBy.includes(currentUserId),
    isCreator: view.creatorId === currentUserId ? 1 : 0,
    status: view.status,
  };
}
