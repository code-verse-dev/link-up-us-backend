import express from 'express';
import cors from 'cors';
import * as auth from './routes/auth';
import * as users from './routes/users';
import * as templates from './routes/templates';
import * as training from './routes/training';
import * as leads from './routes/leads';
import * as referrals from './routes/referrals';
import * as verify from './routes/verify';
import * as plans from './routes/plans';
import * as billing from './routes/billing';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

const API = '/api';

app.get(`${API}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post(`${API}/auth/login`, auth.login);
app.post(`${API}/auth/register`, auth.register);

app.get(`${API}/users/me`, users.getMe);
app.patch(`${API}/users/me`, users.updateMe);

app.get(`${API}/templates`, templates.list);
app.get(`${API}/training`, training.list);

app.get(`${API}/leads`, leads.list);
app.post(`${API}/leads`, leads.create);

app.get(`${API}/referrals`, referrals.list);

app.get(`${API}/verify/member`, verify.verifyMember);
app.post(`${API}/verify/member`, verify.verifyMember);

app.get(`${API}/plans`, plans.list);
app.get(`${API}/plans/validate-referral`, plans.validateReferralCode);
app.post(`${API}/plans/validate-referral`, plans.validateReferralCode);

app.get(`${API}/billing/subscription`, billing.getSubscription);
app.get(`${API}/billing/invoices`, billing.listInvoices);

export default app;
