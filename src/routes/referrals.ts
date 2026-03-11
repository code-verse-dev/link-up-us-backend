import { Request, Response } from 'express';
import { store } from '../store';

/**
 * GET /api/referrals
 * List referrals for the current user (x-user-id or query userId).
 */
export function list(req: Request, res: Response): void {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const list = userId
    ? store.referrals.filter((r) => r.referrerUserId === userId)
    : store.referrals;
  res.json(list);
}
