import { Response } from 'express';
import { store } from '../store';

/**
 * GET /api/templates
 * List email templates.
 */
export function list(_req: unknown, res: Response): void {
  res.json(store.emailTemplates);
}
