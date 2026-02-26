# Rehearse Server API Contract

Base URL (local): `http://localhost:5000`

## Auth

- `POST /auth/register`
  - Body: `{ "email": string, "password": string, "fullName"?: string }`
  - Notes: Requires email confirmation before protected usage. Auth tokens are set in secure HttpOnly cookies; token strings are not returned in response body.
- `POST /auth/login`
  - Body: `{ "email": string, "password": string }`
- `POST /auth/refresh-token`
  - Body: none
  - Notes: Refresh token is read from secure HttpOnly cookie only.
- `GET /auth/oauth/google`
  - Starts backend-owned OAuth redirect flow.
- `GET /auth/oauth/google/callback`
  - OAuth callback endpoint (set in Supabase redirect URLs).
- `POST /auth/logout`
- `GET /auth/me`
  - Response user includes: `userId`, `email`, `role`, `emailConfirmed`, `aud`, `fullName`.

## Scenarios (Protected)

- `GET /scenarios`
  - Query: `category?`, `search?`, `customOnly?`, `limit?`, `offset?`
- `GET /scenarios/:id`
- `POST /scenarios/custom`
  - Body:
    - `title`, `category`, `description`
    - `characterProfile { name, role, personality[], goals[], emotionalState }`
    - `difficultyVariants[] { level, behaviorModifier }`
- `PATCH /scenarios/custom/:id`
  - Body: same as `POST /scenarios/custom` (full replacement of custom scenario)
- `DELETE /scenarios/custom/:id`
  - Notes: Returns `409` if scenario already has sessions (to preserve history integrity).

## Sessions (Protected)

- `POST /sessions/start`
  - Body: `{ "scenarioId": uuid, "difficultyLevel": "cooperative|neutral|resistant|hostile", "customContext"?: string }`
- `GET /sessions/history`
  - Query: `status?`, `limit?`, `offset?`
- `DELETE /sessions/history`
  - Query: `scope?=non_active|completed|abandoned|all`, `limit?`
  - Response: `{ "deletedCount": number }`
- `DELETE /sessions/:id`
  - Deletes one non-active session from history.
  - Returns `409` if the session is still active.
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
  - Voice preference keys (optional): `preferences.ttsGender = "male" | "female"`, `preferences.ttsVoiceId = string`
- `GET /users/progress`

## Response Notes

- Errors return: `{ "error": string, "code": string, "requestId"?: string }`
- Every response includes `x-request-id` header.

## Voice WebSocket

- Endpoint: `ws://localhost:5000/ws/voice?sessionId=<uuid>`
- Auth: secure auth cookie is required on the WebSocket handshake.
- Backend TTS provider: configurable (`TTS_PROVIDER=kokoro|groq`, optional `TTS_FALLBACK_PROVIDER`)
- Message flow:
  - Client sends JSON `{ "type": "audio_start", "mimeType": "audio/webm;codecs=opus" }`
  - Client streams binary `audio_chunk` frames
  - Client sends JSON `{ "type": "audio_end" }`
  - Server returns transcript + assistant text + streamed audio chunks
  - If audio synthesis is unavailable, server emits status `{ "type": "status", "message": "audio_unavailable", "code": string, "reason": string }` and still completes text response.
  - Non-fatal/terminal error events may include `{ "type": "error", "code": string, "message": string }`.
