import { Request, Response } from 'express';
import { store } from '../store';

/**
 * GET /api/billing/subscription
 * Returns current user's subscription (placeholder until Stripe integration).
 * Header: x-user-id or query userId.
 */
export function getSubscription(req: Request, res: Response): void {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header or userId query' });
    return;
  }
  const sub = store.subscriptions.find((s) => s.userId === userId);
  if (!sub) {
    res.json({
      subscribed: false,
      message: 'No active subscription. Subscribe via Stripe to activate.',
    });
    return;
  }
  res.json({
    subscribed: true,
    planId: sub.planId,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    referralDiscountApplied: sub.referralDiscountApplied,
  });
}

/**
 * GET /api/billing/invoices
 * Placeholder: payment history / invoices (Stripe integration).
 */
export function listInvoices(req: Request, res: Response): void {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header or userId query' });
    return;
  }
  res.json({
    invoices: [],
    message: 'Stripe integration pending. Invoices will appear here.',
  });
}
