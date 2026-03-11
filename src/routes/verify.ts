import { Request, Response } from 'express';
import { MemberVerificationResult } from '../types';
import { store } from '../store';

/**
 * GET /api/verify/member?memberId=LU101
 * OR POST /api/verify/member body: { memberId: "LU101" }
 *
 * Business Flow §4: 15% Member Discount Verification
 * - Validates member exists and status = Active
 * - Returns: "Verified Link-up Member – Eligible for 15% Discount" or "Membership inactive or invalid."
 */
export function verifyMember(req: Request, res: Response): void {
  const memberId = (req.query.memberId as string) || (req.body?.memberId as string);
  if (!memberId || typeof memberId !== 'string') {
    const result: MemberVerificationResult = {
      valid: false,
      message: 'Member ID is required.',
    };
    res.status(400).json(result);
    return;
  }

  const normalized = memberId.trim().toUpperCase();
  const user = store.users.find((u) => u.memberId.toUpperCase() === normalized);

  if (!user) {
    const result: MemberVerificationResult = {
      valid: false,
      message: 'Membership inactive or invalid.',
    };
    res.json(result);
    return;
  }

  if (user.status !== 'active') {
    const result: MemberVerificationResult = {
      valid: false,
      memberId: user.memberId,
      businessName: user.businessName,
      message: 'Membership inactive or invalid.',
      eligibleForDiscount: false,
    };
    res.json(result);
    return;
  }

  const result: MemberVerificationResult = {
    valid: true,
    memberId: user.memberId,
    businessName: user.businessName,
    message: 'Verified Link-up Member – Eligible for 15% Discount',
    eligibleForDiscount: true,
  };
  res.json(result);
}
