import { Request, Response } from 'express';
import { store } from '../store';

/**
 * GET /api/users/me
 * Returns current user by id (from header or query for demo). In production use JWT/session.
 */
export function getMe(req: Request, res: Response): void {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header or userId query' });
    return;
  }
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
}

/**
 * PATCH /api/users/me
 * Update current user profile (partial).
 */
export function updateMe(req: Request, res: Response): void {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header or userId query' });
    return;
  }
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const allowed = ['name', 'businessName', 'email', 'industry', 'region', 'phone', 'address', 'website', 'partnerBannerUrl'];
  const updates = req.body || {};
  const target = store.users[idx];
  if (updates.name !== undefined) target.name = updates.name;
  if (updates.businessName !== undefined) target.businessName = updates.businessName;
  if (updates.email !== undefined) target.email = updates.email;
  if (updates.industry !== undefined) target.industry = updates.industry;
  if (updates.region !== undefined) target.region = updates.region;
  if (updates.phone !== undefined) target.phone = updates.phone;
  if (updates.address !== undefined) target.address = updates.address;
  if (updates.website !== undefined) target.website = updates.website;
  if (updates.partnerBannerUrl !== undefined) target.partnerBannerUrl = updates.partnerBannerUrl;
  res.json(target);
}
