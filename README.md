# Meeting Rooms SaaS

Internal SaaS for booking meeting rooms across multiple offices. Corporate email sign-up with email verification, role-based admin area, calendar with overlap detection.

## Stack

- **Backend**: NestJS, Prisma, PostgreSQL, JWT, Nodemailer
- **Frontend**: React, Vite, React Router, TanStack Query, FullCalendar
- **Infra**: Docker Compose (Postgres + backend + frontend)

## Quick start (Docker)

Requires Docker and Docker Compose.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend:  http://localhost:3000
- Postgres: localhost:5432 (user `postgres`, password `postgres`, db `meeting_rooms`)

Prisma migrations run automatically on backend startup.

### First admin

The first user who finishes email verification automatically becomes `ADMIN`. Subsequent users are `USER`.

### Getting the verification code without SMTP

If `SMTP_*` values in `backend/.env` are left as placeholders, emails are not sent. Instead, the code is printed to the backend log:

```bash
docker compose logs -f backend | grep "Verification code"
```

## Local dev

Run Postgres via Docker and the apps on host:

```bash
docker compose up -d postgres

cd backend
npm install
cp .env.example .env   # DATABASE_URL already points to localhost
npx prisma migrate dev
npm run start:dev

cd ../frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signing secret for JWT |
| `JWT_EXPIRES_IN` | JWT lifetime, e.g. `7d` |
| `ALLOWED_EMAIL_DOMAIN` | Corporate domain allowed to register |
| `SMTP_*`, `SMTP_FROM` | SMTP credentials for verification codes (optional in dev) |
| `EMAIL_CODE_TTL_MINUTES` | Verification code TTL |
| `EMAIL_CODE_RESEND_COOLDOWN_SECONDS` | Resend cooldown |
| `APP_TIMEZONE` | Single timezone for all bookings (default `Europe/Moscow`) |
| `CORS_ORIGINS` | Comma-separated list of allowed origins |

### Frontend (`frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL (default `http://localhost:3000`) |

## Features

- Sign-up restricted to the configured corporate domain.
- Email verification via one-time code with resend cooldown.
- JWT login, `GET /auth/me`, role guards.
- First verified user becomes `ADMIN`.
- Admin CRUD for offices and meeting rooms (soft delete).
- Deleting an office cascades: its rooms are deactivated and future bookings are removed. The same cascade applies when a single room is deleted.
- User CRUD for bookings with overlap detection and permission checks.
- Calendar views (week / day) with filters by office and room, 24h time axis.
- Native-looking toast notifications, in-app confirmation dialogs, dark theme with yellow accents.

## Project layout

```
backend/   # NestJS API
frontend/  # React SPA
docker-compose.yml
```

## Common troubleshooting

- **`P1001 Can't reach database server`** in local dev — make sure Postgres is running (`docker compose up -d postgres`) and `DATABASE_URL` in `backend/.env` points to `localhost:5432`.
- **CORS errors** — add the frontend origin to `CORS_ORIGINS` in `backend/.env` and restart the backend.
- **No email received** — SMTP not configured; check backend logs for the code (see above).
