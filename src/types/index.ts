/**
 * Shared types aligned with frontend (link-up-us-frontend/src/types.ts)
 */
export enum Region {
  PHOENIX = 'Phoenix Metro',
  TUCSON = 'Tucson',
  FLAGSTAFF = 'Flagstaff',
  PRESCOTT = 'Prescott',
  WICKENBURG = 'Wickenburg',
}

export interface User {
  id: string;
  memberId: string;
  email: string;
  name: string;
  businessName: string;
  industry: string;
  region: Region;
  status: 'active' | 'inactive';
  referralCode: string;
  joinedAt: string;
  databaseSize?: number;
  residualEarnings?: number;
  phone?: string;
  address?: string;
  website?: string;
  partnerBannerUrl?: string;
}

export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  interval: 'month';
  description: string;
}

export interface Subscription {
  userId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: string;
  referralDiscountApplied?: boolean;
}

export interface MemberVerificationResult {
  valid: boolean;
  memberId?: string;
  businessName?: string;
  message: string;
  eligibleForDiscount?: boolean;
}

export interface ReferralCodeValidation {
  valid: boolean;
  referrerMemberId?: string;
  firstMonthPriceCents?: number;
  message: string;
}

export interface RestaurantOffer {
  id: string;
  userId: string;
  title: string;
  description: string;
  offerType: 'free_item' | 'percent_off' | 'free_dessert' | 'other';
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
  htmlFile: string;
}

export interface TrainingVideo {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  offerId?: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referrerMemberId: string;
  businessName: string;
  region: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  discountAmount: string;
  earningsPerMonth: string;
}

/** Auth request/response */
export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  region: Region;
  businessName: string;
  industry: string;
  referralCode?: string;
  contactName: string;
  databaseSize?: number;
}
