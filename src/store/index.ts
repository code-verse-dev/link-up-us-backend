import { User, EmailTemplate, TrainingVideo, Lead, Referral, Region, Plan, Subscription } from '../types';

/**
 * In-memory store for development. Replace with a database (e.g. PostgreSQL, MongoDB) for production.
 */
const users: User[] = [
  {
    id: 'user_123',
    memberId: 'LU101',
    email: 'demo@linkup.us',
    name: 'John Doe',
    businessName: 'Apex Coffee Roasters',
    industry: 'Food & Beverage',
    region: Region.PHOENIX,
    status: 'active',
    referralCode: 'NONE',
    joinedAt: new Date().toISOString(),
    databaseSize: 400,
    residualEarnings: 45,
  },
];

const emailTemplates: EmailTemplate[] = [
  { id: '1', title: 'October Newsletter', description: 'Monthly partner newsletter', previewUrl: '/preview/oct', htmlFile: 'october.html' },
  { id: '2', title: 'Welcome Bundle', description: 'New member onboarding', previewUrl: '/preview/welcome', htmlFile: 'welcome.html' },
  { id: '3', title: 'Partner of the Month', description: 'Spotlight a partner business', previewUrl: '/preview/partner-month', htmlFile: 'partner-of-month.html' },
  { id: '4', title: 'Promotion Email', description: 'Promotional offer template', previewUrl: '/preview/promo', htmlFile: 'promo.html' },
  { id: '5', title: 'Regional Update', description: 'Region news and new members', previewUrl: '/preview/regional', htmlFile: 'regional.html' },
  { id: '6', title: 'Referral Reminder', description: 'Share your referral link and QR', previewUrl: '/preview/referral', htmlFile: 'referral.html' },
];

const trainingVideos: TrainingVideo[] = [
  { id: '1', title: 'Cross-Marketing 101', duration: '12:30', thumbnail: 'https://picsum.photos/320/180?seed=1', videoUrl: '/videos/cross-marketing.mp4' },
  { id: '2', title: 'Referral Best Practices', duration: '8:45', thumbnail: 'https://picsum.photos/320/180?seed=2', videoUrl: '/videos/referrals.mp4' },
  { id: '3', title: 'Using Your Referral Banner', duration: '6:20', thumbnail: 'https://picsum.photos/320/180?seed=3', videoUrl: '/videos/referral-banner.mp4' },
  { id: '4', title: 'Newsletter Marketing for Partners', duration: '10:15', thumbnail: 'https://picsum.photos/320/180?seed=4', videoUrl: '/videos/newsletter.mp4' },
  { id: '5', title: 'How Referrals Grow Your Business', duration: '9:00', thumbnail: 'https://picsum.photos/320/180?seed=5', videoUrl: '/videos/grow-business.mp4' },
  { id: '6', title: 'QR Code & Placard Best Placement', duration: '7:30', thumbnail: 'https://picsum.photos/320/180?seed=6', videoUrl: '/videos/qr-placement.mp4' },
];

const leads: Lead[] = [];
const referrals: Referral[] = [
  { id: 'r1', referrerUserId: 'user_123', referrerMemberId: 'LU101', businessName: 'Mountain Peak Coffee', region: 'Flagstaff', joinDate: 'Aug 12, 2024', status: 'Active', discountAmount: '$4.99', earningsPerMonth: '$5.00/mo' },
  { id: 'r2', referrerUserId: 'user_123', referrerMemberId: 'LU101', businessName: 'Desert Sky Logistics', region: 'Phoenix Metro', joinDate: 'Aug 10, 2024', status: 'Active', discountAmount: '$4.99', earningsPerMonth: '$5.00/mo' },
];

const plans: Plan[] = [
  { id: 'standard', name: 'Standard Plan', priceCents: 1999, interval: 'month', description: '$19.99/month – Full member access, referral tools, templates, training.' },
];

const subscriptions: Subscription[] = [];

/** Next member number for generating LU101, LU102, ... */
let nextMemberNumber = 102;

export const store = {
  users,
  plans,
  subscriptions,
  emailTemplates,
  trainingVideos,
  leads,
  referrals,
  getNextMemberId(): string {
    const id = `LU${nextMemberNumber++}`;
    return id;
  },
};
