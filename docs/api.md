# Langame - API Contract (MVP)

This document defines the minimal API the Expo app needs. The surface is deliberately small: all content authoring happens in Django Admin, so there is no content-write API in the MVP. The mobile app reads content and personalization, and writes attempts.

## Conventions

- Base path: `/api/v1`.
- Format: JSON request and response bodies.
- All times are ISO 8601 UTC.
- All endpoints except `/auth/register` and `/auth/login` require authentication.

## Authentication

- Mechanism: JWT via `djangorestframework-simplejwt`. Django session auth does not fit a mobile client well, so the app uses bearer tokens.
- The client sends `Authorization: Bearer <access_token>` on authenticated requests.
- Access tokens are short-lived; refresh tokens are used to obtain new access tokens (`POST /auth/refresh`, provided by simplejwt).

## API documentation / schema

- OpenAPI schema generated with `drf-spectacular`, served at `/api/schema/` with Swagger UI at `/api/docs/`.
- The schema is the source of truth for generating a typed TypeScript client for the Expo app later.

## Endpoints

### POST /auth/register

Purpose: create a new account and player profile.

- Reads/writes: creates `User` + `Player`.

Request:

```json
{
  "email": "learner@example.com",
  "password": "********",
  "display_name": "Dana"
}
```

Response (201):

```json
{
  "access": "<jwt-access>",
  "refresh": "<jwt-refresh>",
  "player": { "id": 1, "display_name": "Dana", "total_xp": 0, "current_streak": 0 }
}
```

### POST /auth/login

Purpose: authenticate and obtain tokens.

- Reads: `User`.

Request:

```json
{ "email": "learner@example.com", "password": "********" }
```

Response (200):

```json
{ "access": "<jwt-access>", "refresh": "<jwt-refresh>" }
```

### GET /me/next

Purpose: ask the backend what the learner should do now. This is the entry point of the core loop.

- Reads: `RecommendationQueue` (falls back to next unstarted `Lesson` if the queue is empty).

Response (200):

```json
{
  "item_type": "review",
  "reason": "due",
  "lesson": { "id": 42, "title": "Food - review" },
  "estimated_exercises": 10
}
```

When `item_type` is `new_lesson`, `lesson` points to the next lesson in the unit. The app then calls `GET /lessons/{id}`.

### GET /lessons/{id}

Purpose: fetch a lesson and its exercises to play.

- Reads: `Lesson`, `Exercise`, `ExerciseItem`, `Skill`, `VocabularyItem`, `MediaAsset`.

Response (200):

```json
{
  "id": 42,
  "title": "Food - review",
  "exercises": [
    {
      "id": 1001,
      "type": "multiple_choice",
      "skill_ids": [7],
      "payload": {
        "prompt_mode": "image",
        "prompt": { "image_url": "https://.../apple.png" },
        "options": ["apple", "orange", "bread", "water"],
        "answer": "apple"
      }
    },
    {
      "id": 1002,
      "type": "listening",
      "skill_ids": [9],
      "payload": {
        "prompt_mode": "audio",
        "prompt": { "audio_url": "https://.../water.mp3" },
        "answer": "water"
      }
    }
  ]
}
```

`skill_ids` lists the skills an exercise targets (one for a simple vocabulary prompt, several for matching or, later, mixed vocabulary/grammar exercises).

Note: in production the `answer` may be withheld from the payload and validated server-side; for the MVP it can be returned to keep the client simple. This is a known trade-off to revisit.

### POST /attempts

Purpose: submit exercise results. This is the signal that drives personalization. Supports batching a whole lesson's attempts in one request.

- Writes: `ExerciseAttempt` (append-only; one row per skill targeted by each exercise), updates `LessonProgress`. Triggers async personalization tasks.

Request:

```json
{
  "lesson_id": 42,
  "attempts": [
    { "exercise_id": 1001, "is_correct": true, "latency_ms": 2400, "answer_given": "apple" },
    { "exercise_id": 1002, "is_correct": false, "latency_ms": 5100, "answer_given": "wader" }
  ]
}
```

Response (201):

```json
{
  "recorded": 2,
  "lesson_status": "completed",
  "xp_awarded": 18,
  "current_streak": 4
}
```

### GET /me/progress

Purpose: render the progress screen.

- Reads: `Player`, `ExerciseAttempt` (later also `LearnerProfile`/`MemoryState`).

Response (200):

```json
{
  "display_name": "Dana",
  "total_xp": 320,
  "current_streak": 4,
  "longest_streak": 9,
  "skills_learned": 85,
  "skills_due": 12,
  "accuracy_7d": 0.82
}
```

Notes (MVP / M3):

- `display_name` is included so the app can render the home and progress screens without a separate `/me` call (login returns only tokens).
- `skills_learned` = distinct skills with at least one correct attempt; `accuracy_7d` = correct/total attempts over the last 7 days (`null` when there are no recent attempts).
- `skills_due` is `0` until spaced-repetition scheduling lands in M4 (it needs `MemoryState`).
- Streak rule: a streak counts consecutive days with at least one completed lesson. "Today" is computed in the player's timezone (`Player.timezone`, default UTC); completing a lesson on a day adjacent to `last_active_date` increments the streak, a gap resets it to 1.

## Endpoint summary

| Method | Path | Auth | Reads | Writes |
| --- | --- | --- | --- | --- |
| POST | /auth/register | no | - | User, Player |
| POST | /auth/login | no | User | - |
| GET | /me/next | yes | RecommendationQueue, Lesson | - |
| GET | /lessons/{id} | yes | Lesson, Exercise, ExerciseItem, Skill, VocabularyItem, MediaAsset | - |
| POST | /attempts | yes | Exercise | ExerciseAttempt, LessonProgress, Player |
| GET | /me/progress | yes | Player, LearnerProfile | - |

All content creation/editing (courses, units, lessons, skills, vocabulary, exercises, media) is done in Django Admin, not via this API.
