import { Response } from 'express';
import { store } from '../store';

/**
 * GET /api/training
 * List training videos.
 */
export function list(_req: unknown, res: Response): void {
  res.json(store.trainingVideos);
}
