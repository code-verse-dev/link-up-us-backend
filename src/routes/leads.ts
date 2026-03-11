import { Request, Response } from 'express';
import { Lead } from '../types';
import { store } from '../store';

/**
 * GET /api/leads
 * List leads (optionally filtered by userId).
 */
export function list(req: Request, res: Response): void {
  res.json(store.leads);
}

/**
 * POST /api/leads
 * Create a lead. Body: { name, email, phone } (date set server-side).
 */
export function create(req: Request, res: Response): void {
  const { name, email, phone } = req.body || {};
  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }
  const lead: Lead = {
    id: `lead_${Date.now()}`,
    name,
    email,
    phone: phone || '',
    date: new Date().toISOString(),
  };
  store.leads.push(lead);
  res.status(201).json(lead);
}
