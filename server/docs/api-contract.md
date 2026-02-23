# Rehearse Server API Contract

Base URL (local): `http://localhost:5000`

## Auth

- `POST /auth/register`
  - Body: `{ "email": string, "password": string, "fullName"?: string }`
  - Notes: Requires email confirmation before protected usage.
- `POST /auth/login`
  - Body: `{ "email": string, "password": string }`
- `POST /auth/refresh-token`
  - Body: `{ "refreshToken"?: string }` (cookie fallback supported)
- `GET /auth/oauth/google`
  - Starts backend-owned OAuth redirect flow.
- `GET /auth/oauth/google/callback`
  - OAuth callback endpoint (set in Supabase redirect URLs).
- `POST /auth/logout`
- `GET /auth/me`

## Scenarios (Protected)

- `GET /scenarios`
  - Query: `category?`, `search?`, `customOnly?`, `limit?`, `offset?`
- `GET /scenarios/:id`
- `POST /scenarios/custom`
  - Body:
    - `title`, `category`, `description`
    - `characterProfile { name, role, personality[], goals[], emotionalState }`
    - `difficultyVariants[] { level, behaviorModifier }`

## Sessions (Protected)

- `POST /sessions/start`
  - Body: `{ "scenarioId": uuid, "difficultyLevel": "cooperative|neutral|resistant|hostile", "customContext"?: string }`
- `GET /sessions/history`
  - Query: `status?`, `limit?`, `offset?`
- `DELETE /sessions/history`
  - Query: `scope?=non_active|completed|abandoned|all`, `limit?`
  - Response: `{ "deletedCount": number }`
- `GET /sessions/:id`
- `POST /sessions/:id/message`
  - Body: `{ "content": string }`
  - Response: `text/event-stream` token stream.
- `POST /sessions/:id/end`
  - Body: `{ "status"?: "completed|abandoned" }`
  - Notes: If completed, feedback generation is queued asynchronously.

## Feedback (Protected)

- `GET /feedback/:sessionId`
  - Returns existing feedback (`200`) or pending status (`202`) while queued.

## Users (Protected)

- `GET /users/profile`
- `PATCH /users/profile`
  - Body: `{ "fullName"?: string, "avatarUrl"?: string | null, "preferences"?: object }`
- `GET /users/progress`

## Response Notes

- Errors return: `{ "error": string, "requestId"?: string }`
- Every response includes `x-request-id` header.

## Voice WebSocket

- Endpoint: `ws://localhost:5000/ws/voice?sessionId=<uuid>&token=<accessToken>`
- Message flow:
  - Client sends JSON `{ "type": "audio_start", "mimeType": "audio/webm;codecs=opus" }`
  - Client streams binary `audio_chunk` frames
  - Client sends JSON `{ "type": "audio_end" }`
  - Server returns transcript + assistant text + streamed audio chunks
