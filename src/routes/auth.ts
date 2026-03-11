import { Request, Response } from 'express';
import { User, LoginBody, RegisterBody, Region } from '../types';
import { store } from '../store';

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns user (no real password check in this demo).
 */
export function login(req: Request<object, unknown, LoginBody>, res: Response): void {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    res.json({ user });
    return;
  }
  // Demo: any other email returns a mock user (matches frontend mock behavior)
  const mockUser: User = {
    id: `user_${Date.now()}`,
    memberId: store.getNextMemberId(),
    email,
    name: email.split('@')[0],
    businessName: 'Demo Business',
    industry: 'Food & Beverage',
    region: Region.PHOENIX,
    status: 'active',
    referralCode: 'NONE',
    joinedAt: new Date().toISOString(),
    databaseSize: 400,
    residualEarnings: 45,
  };
  store.users.push(mockUser);
  res.json({ user: mockUser });
}

/**
 * POST /api/auth/register
 * Body: RegisterBody (region, businessName, contactName, email, password, industry, etc.)
 * Creates user and returns it.
 */
export function register(req: Request<object, unknown, RegisterBody>, res: Response): void {
  const body = req.body || {};
  const { email, password, region, businessName, industry, contactName, referralCode, databaseSize } = body;
  if (!email || !password || !region || !businessName || !contactName) {
    res.status(400).json({ error: 'email, password, region, businessName, and contactName are required' });
    return;
  }
  if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const user: User = {
    id: `user_${Date.now()}`,
    memberId: store.getNextMemberId(),
    email,
    name: contactName,
    businessName,
    industry: industry || 'General',
    region: region as Region,
    status: 'active',
    referralCode: referralCode || 'NONE',
    joinedAt: new Date().toISOString(),
    databaseSize: databaseSize ?? 0,
    residualEarnings: 0,
  };
  store.users.push(user);
  res.status(201).json({ user });
}
