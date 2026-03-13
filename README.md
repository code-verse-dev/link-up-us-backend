# Link Up Us – Backend API

Same structure as **luminal-port-backend**: Express, MongoDB, env-based config, optional SSL, Socket.io. All APIs are for the Link Up Us project.

## Stack

- **Node.js** (>= 18)
- **Express**
- **MongoDB** (mongoose)
- **JWT** (jsonwebtoken), **bcryptjs**
- **CORS**, **morgan**, **express-rate-limit**
- **Socket.io** (optional, disable with `SOCKET_ENABLED=false`)
- **SSL** (optional, for `NODE_ENV=customdev`)

## Entry point

**Only `server.js` is used.** `npm start` runs `nodemon server.js`. All API logic lives in `server.js`, `routes/`, and `controllers/`.

## Folder structure (like luminal-port-backend)

```
link-up-us-backend/
├── config/          # db.js, cors.js, socket.js
├── controllers/     # auth, users, templates, training, leads, referrals, verify, plans, billing
├── helpers/        # ApiResponse, generateToken, generateMemberId
├── middleware/     # userRoute (JWT or x-user-id)
├── models/         # User, Plan, Subscription, EmailTemplate, TrainingVideo, Lead, Referral
├── routes/         # mounted under /api
├── scripts/        # seed.js
├── server.js       # single entry point (same pattern as luminal)
├── ssl.js          # SSL certs for customdev (same paths as luminal)
├── .env            # default env
├── .env.development
├── .env.live
└── .env.customdev  # same DB pattern as luminal (Mongo Atlas optional)
```

## Env files (same as luminal)

- **.env.development** – `DB=mongodb://localhost:27017/link-up-us`, `PORT=3001`, `JWT_SECRET`
- **.env.live** – same, for production server
- **.env.customdev** – same as luminal’s: Atlas or custom DB URL, SSL used when present

Server loads `dotenv` with `path: .env.${NODE_ENV}` (e.g. `NODE_ENV=development` → `.env.development`).

## SSL (same as luminal)

- **ssl.js** reads key/cert/ca from paths (default: `/etc/apache2/ssl/onlinetestingserver.key`, `.crt`, `.ca`).
- Override with `SSL_KEY_PATH`, `SSL_CERT_PATH`, `SSL_CA_PATH`.
- HTTPS is used only when `NODE_ENV=customdev` and credentials are loaded.

## Setup

```bash
cd link-up-us-backend
npm install
```

Ensure MongoDB is running (local or set `DB` in env). Then:

```bash
npm run seed    # seed plans, templates, training videos (once)
npm start       # nodemon server.js
```

Server runs at **http://localhost:3001** (or `PORT` from env).

## API response format

All JSON responses use the luminal-style wrapper:

```json
{ "status": true, "message": "OK", "data": { ... } }
```

- **Login/Register:** `data.user`, `data.token`. Use `Authorization: Bearer <token>` or `x-user-id: <user._id>` for protected routes.
- **Lists:** `data` is the array or object (e.g. `data` = list of templates).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login → `data.user`, `data.token` |
| POST | `/api/auth/register` | Register (body: email, password, region, businessName, contactName, …) |
| GET | `/api/users/me` | Current user (auth required) |
| PATCH | `/api/users/me` | Update profile (auth required) |
| GET | `/api/templates` | Email templates |
| GET | `/api/training` | Training videos |
| GET/POST | `/api/leads` | List / create leads |
| GET | `/api/referrals` | Referrals (optional x-user-id) |
| GET/POST | `/api/verify/member` | 15% discount verification (?memberId=LU101) |
| GET | `/api/plans` | Plans (Standard $19.99) |
| GET/POST | `/api/plans/validate-referral` | Validate referral code |
| GET | `/api/billing/subscription` | Current subscription (auth) |
| GET | `/api/billing/invoices` | Invoices placeholder (auth) |

## Auth

- **Login:** Returns `data.user` and `data.token`. Pass `Authorization: Bearer <token>` on subsequent requests.
- **Optional:** `x-user-id` header with user `_id` (e.g. for server-to-server or when token is not used).
- **userRoute** middleware: validates JWT or `x-user-id` and sets `req.user`.

## Database

- **DB** env variable (same as luminal): `mongodb://localhost:27017/link-up-us` or Atlas URL in `.env.customdev`.
- Run `npm run seed` once to create default Plan, EmailTemplate, and TrainingVideo documents.

## Socket.io

Same pattern as luminal: `config/socket.js` initializes on the same server. Clients can `emit("register", userId)`. Disable with `SOCKET_ENABLED=false`.

## Old TypeScript backend

The `src/` folder (if present) is the previous TypeScript/Express in-memory backend. The active app is **server.js** at the project root. You can remove `src/` if you no longer need it.
