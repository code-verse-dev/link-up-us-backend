# Link-up.us Platform – Business Flow → API Map

This document maps each business flow from the product spec to backend API endpoints and behavior.

---

## 1. Member Registration & Onboarding Flow

| Step | Spec | API / Backend |
|------|------|----------------|
| Region selection | User selects Phoenix Metro, Tucson, Flagstaff, etc. | `POST /api/auth/register` — body includes `region` (required). |
| Account creation | Email, password, contact info | Same: `email`, `password`, `contactName`, `businessName`, `industry`. |
| System generates Member ID | e.g. LU101, LU102 | Backend assigns sequential `memberId` via `store.getNextMemberId()` on register. |
| Plan selection | Standard $19.99/month | `GET /api/plans` returns plans; frontend shows Standard. |
| Referral code (optional) | If valid (e.g. LU101), first month $4.99 | `GET /api/plans/validate-referral?code=LU101` or `POST` with `{ code }` → `valid`, `firstMonthPriceCents: 499`. |
| Payment | Stripe (or similar) | **Placeholder:** Stripe not integrated; `GET /api/billing/subscription`, `GET /api/billing/invoices` ready for wiring. |
| Onboarding form | Business details, liaison, banner upload | After “payment success,” frontend can call `PATCH /api/users/me` with `businessName`, `industry`, `phone`, `address`, `website`, `partnerBannerUrl`. |
| Account activated | Access to Member Dashboard | Login returns `user`; dashboard uses `user.id` (e.g. in `x-user-id` header). |

---

## 2. Subscription & Billing Flow

| Step | Spec | API / Backend |
|------|------|----------------|
| Plan | $19.99 monthly | `GET /api/plans` — Standard plan `priceCents: 1999`. |
| Referral discount | First month $4.99 if code valid | `GET /api/plans/validate-referral?code=...` confirms; Stripe integration will apply discount. |
| Payment gateway | Stripe | **TODO:** Webhook + checkout session; store subscription in DB. |
| Recurring billing | Monthly charge | Handled by Stripe; backend can expose `GET /api/billing/subscription` (current user). |
| Billing dashboard | History, invoices, renewal | `GET /api/billing/invoices` — placeholder until Stripe; then list invoices for user. |

---

## 3. Member Dashboard Flow

| Section | Spec | API / Backend |
|---------|------|----------------|
| Account status | Active / Expired | `user.status` from `GET /api/users/me` (or login response). |
| Member info | Member ID, Referral Code | Same: `user.memberId` (used as referral code). |
| Region | Phoenix / Tucson / Flagstaff updates | `user.region`; region-specific content can be filtered by `region` in other APIs. |
| Notifications | Billing, templates, updates | **Future:** notifications API; for now frontend can use local or push. |
| Quick access | Templates, training, QR, referrals | `GET /api/templates`, `GET /api/training`, `GET /api/referrals` (with `x-user-id`). |

---

## 4. 15% Member Discount Verification Flow

| Step | Spec | API / Backend |
|------|------|----------------|
| Member requests verification | Member ID or QR scan | `GET /api/verify/member?memberId=LU101` or `POST /api/verify/member` with `{ memberId: "LU101" }`. |
| System checks DB | Member exists, status = Active | Backend looks up `store.users` by `memberId`, checks `status === 'active'`. |
| Result | Verified vs inactive/invalid | Response: `{ valid, memberId, businessName, message, eligibleForDiscount }`. Message: “Verified Link-up Member – Eligible for 15% Discount” or “Membership inactive or invalid.” |

---

## 5. Email Template Library Flow

| Step | Spec | API / Backend |
|------|------|----------------|
| Open Email Templates | — | `GET /api/templates`. |
| View library | Min 6 templates | Backend returns ≥6 (newsletter, partner of month, promo, etc.). |
| Select & download | HTML, email-compatible | Each template has `htmlFile`, `previewUrl`; actual file serving can be added. |

---

## 6. Video Training Library Flow

| Step | Spec | API / Backend |
|------|------|----------------|
| Open Training Videos | — | `GET /api/training`. |
| Library | Min 6 videos | Backend returns ≥6 (referral banner, newsletter, cross-promotion, etc.). |
| Secure playback | Active members only | Frontend gates by auth; optional: backend signed URLs or member check for video URL. |

---

## 7. QR Code Generator & Referral Placards

| Step | Spec | API / Backend |
|------|------|----------------|
| Referral link | link-up.us/signup?ref=LU101 | Frontend builds from `user.memberId`; backend does not generate URL (static pattern). |
| QR code | Linked to referral link | Frontend generates QR from same URL. |
| Placard | Business name, message, QR, branding | Frontend uses `user` (e.g. `GET /api/users/me`) for name/branding; QR from referral link. |
| Tracking | Scan → signup, referral tracked | When new user registers with `referralCode`, backend can record referral (e.g. in `store.referrals`). |

---

## 8. Member Profile & Settings Flow

| Step | Spec | API / Backend |
|------|------|----------------|
| Open profile/settings | — | `GET /api/users/me`. |
| Edit business, liaison, phone, email, website | — | `PATCH /api/users/me` with `name`, `businessName`, `email`, `industry`, `region`, `phone`, `address`, `website`. |
| Upload referral banner | — | `PATCH /api/users/me` with `partnerBannerUrl` (upload to storage then send URL). |
| Change password / notifications | — | **Future:** dedicated password and notification prefs endpoints. |

---

## 9. Referral Tracking Flow

| Step | Spec | API / Backend |
|------|------|----------------|
| Referral dashboard | — | `GET /api/referrals` (with `x-user-id` or `userId`). |
| Data | Total referrals, signup dates, discount applied | Response includes `referrerMemberId`, `businessName`, `region`, `joinDate`, `status`, `discountAmount`, `earningsPerMonth`. |
| QR/analytics | Optional scans, conversions | **Future:** analytics events and aggregation API. |

---

## 10. Restaurant Landing Page Module (Phase 2)

| Step | Spec | API / Backend |
|------|------|----------------|
| Create offer | Free Taco, 10% Off, etc. | **Future:** `POST /api/restaurant/offers` (types: `RestaurantOffer`). |
| Landing page | Restaurant info, offer, signup form | **Future:** endpoint to render or serve landing page config. |
| Lead collection | Name, email, phone | `POST /api/leads` with `name`, `email`, `phone`; optional `offerId`. |
| Lead delivery | To restaurant email/CRM | **Future:** webhook or email on lead create. |
| QR → landing page | — | Frontend generates QR to landing page URL. |
| Dashboard | Leads, offer performance | `GET /api/leads` (filter by `offerId` / user when implemented). |

---

## Summary: Endpoints by Flow

- **Auth & onboarding:** `POST /api/auth/register`, `POST /api/auth/login`, `PATCH /api/users/me`
- **Plans & referral discount:** `GET /api/plans`, `GET|POST /api/plans/validate-referral`
- **Billing (placeholder):** `GET /api/billing/subscription`, `GET /api/billing/invoices`
- **Verification (15% discount):** `GET|POST /api/verify/member`
- **Dashboard:** `GET /api/users/me`, `GET /api/templates`, `GET /api/training`, `GET /api/referrals`
- **Profile:** `GET /api/users/me`, `PATCH /api/users/me`
- **Leads (Phase 2):** `GET /api/leads`, `POST /api/leads`

Stripe integration (checkout, webhooks, invoices) and Phase 2 restaurant endpoints are documented as placeholders / future work.
