# Meeting Rooms SaaS (MVP)

Проект: SaaS для внутреннего бронирования переговорных комнат.

## Состав

- `backend`: NestJS + Prisma + PostgreSQL + JWT + SMTP.
- `frontend`: React + Vite + React Router + TanStack Query.
- `docker-compose.yml`: postgres, backend, frontend.

## Быстрый старт

1. Скопируйте `backend/.env.example` в `backend/.env`.
2. Скопируйте `frontend/.env.example` в `frontend/.env`.
3. Запустите:

```bash
docker compose up -d --build
```

## Реализовано на текущем этапе

- Регистрация по корпоративному домену.
- Подтверждение email одноразовым кодом.
- Повторная отправка кода с cooldown.
- Вход/`/auth/me` на JWT.
- Роли `ADMIN`/`USER`, первый подтвержденный пользователь = `ADMIN`.
- CRUD офисов (soft delete).
- CRUD переговорок (soft delete).
- CRUD броней с проверкой пересечений и прав.
- Базовый frontend со страницами `register/verify-email/login/calendar`.

## Важно

- Shell в текущей сессии IDE нестабилен, поэтому запуск и миграции нужно выполнить локально после открытия терминала:
  - `cd backend && npm install && npx prisma migrate dev && npm run start:dev`
  - `cd frontend && npm install && npm run dev`
