# Langame

Langame is a mobile vocabulary game that helps Hebrew speakers learn English through short, rewarding daily sessions. Background services turn each learner's usage into a tailored study plan, surfacing the words they are most likely to forget and choosing what to practice next.

## Stack

- Mobile: Expo (React Native)
- Backend: Django + Django REST Framework + Django Admin
- Background jobs: Celery + Redis
- Database: Postgres

## Docs

Design documentation lives in [docs/](docs/):

- [docs/design.md](docs/design.md) - product vision, core session loop, MVP scope, and future vision.
- [docs/data-model.md](docs/data-model.md) - domain entities, ER diagram, and data flow.
- [docs/api.md](docs/api.md) - authentication approach and the MVP API contract.
- [docs/personalization.md](docs/personalization.md) - spaced repetition, Celery tasks, and the personalization loop.
- [docs/architecture.md](docs/architecture.md) - system components, repo layout, and local dev setup.

## Backend (local development)

The backend uses a hybrid setup: Postgres and Redis run in Docker, while Django
and Celery run on the host via [uv](https://docs.astral.sh/uv/). Docker host ports
are 5433 (Postgres) and 6380 (Redis) to avoid clashing with other local services.

Prerequisites: Docker, and `uv` (`brew install uv`).

```bash
# 1. Start infra (Postgres + Redis)
docker compose up -d

# 2. Install backend dependencies
cd backend
uv sync
cp .env.example .env            # already present in this repo for dev

# 3. Apply migrations and create an admin user
uv run python manage.py migrate
uv run python manage.py createsuperuser

# 4. Run the API
uv run python manage.py runserver

# Celery (separate terminals, used from milestone M4 onward)
uv run celery -A config worker -l info
uv run celery -A config beat -l info
```

Key URLs (dev): API under `http://127.0.0.1:8000/api/v1/`, Swagger UI at
`/api/docs/`, OpenAPI schema at `/api/schema/`, Django Admin at `/admin/`.

Auth endpoints available now (M0): `POST /api/v1/auth/register`,
`POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` (JWT via SimpleJWT).

## Mobile app (local development)

The mobile app is an [Expo](https://docs.expo.dev/) (React Native) app in
[mobile/](mobile/). Web is the primary dev target for now (fast iteration on a
Mac, no emulator needed); the same code also runs on Android/iOS.

Prerequisites: Node 20+, and the backend running (see above).

```bash
cd mobile
npm install
npm run web        # opens the app in the browser at http://localhost:8081
```

The API base URL is read from `app.json` -> `expo.extra.apiBaseUrl` (defaults to
`http://127.0.0.1:8000/api/v1`, which works for web and the iOS simulator). Override
it for other targets with an env var:

```bash
# Android emulator (10.0.2.2 is the emulator's alias for the host machine)
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api/v1 npm run android

# Physical device via Expo Go (use your Mac's LAN IP, same Wi-Fi)
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000/api/v1 npm start
```

What's implemented (M0): an auth screen (register/login) and a placeholder
"What's next" home screen showing the player's XP and streak. Tokens are stored
via `expo-secure-store` on native and `localStorage` on web.

Note: the backend enables permissive CORS in dev (`config/settings/dev.py`) so the
web client can call the API from a different origin. Production locks this down via
`CORS_ALLOWED_ORIGINS`.

## Status

M0 (Foundations) is complete: Django + DRF backend with JWT auth (register/login),
custom `User` + `Player` models, Django Admin, Celery wiring, Dockerized
Postgres/Redis, and an Expo app that logs in against the API and renders the home
screen (verified end-to-end on web). Next is M1: content models authored through
Django Admin. See [docs/design.md](docs/design.md) for the full milestone plan.
