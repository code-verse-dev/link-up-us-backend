import { Request, Response } from 'express';
import { ReferralCodeValidation } from '../types';
import { store } from '../store';

/** First month price when referral code is valid (cents). */
const REFERRAL_FIRST_MONTH_CENTS = 499; // $4.99

/**
 * GET /api/plans
 * List membership plans (e.g. Standard $19.99/month).
 */
export function list(_req: Request, res: Response): void {
  res.json(store.plans);
}

/**
 * GET /api/plans/validate-referral?code=LU101
 * OR POST /api/plans/validate-referral body: { code: "LU101" }
 *
 * Business Flow §1 Step 7: If valid referral code, first month = $4.99.
 */
export function validateReferralCode(req: Request, res: Response): void {
  const code = (req.query.code as string) || (req.body?.code as string);
  if (!code || typeof code !== 'string') {
    const result: ReferralCodeValidation = {
      valid: false,
      message: 'Referral code is required.',
    };
    res.status(400).json(result);
    return;
  }

  const normalized = code.trim().toUpperCase();
  const referrer = store.users.find(
    (u) => u.memberId.toUpperCase() === normalized && u.status === 'active'
  );

  if (!referrer) {
    const result: ReferralCodeValidation = {
      valid: false,
      message: 'Invalid or inactive referral code.',
    };
    res.json(result);
    return;
  }

  const result: ReferralCodeValidation = {
    valid: true,
    referrerMemberId: referrer.memberId,
    firstMonthPriceCents: REFERRAL_FIRST_MONTH_CENTS,
    message: 'Valid referral code. First month price: $4.99',
  };
  res.json(result);
}
