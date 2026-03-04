# Rehearse Server API Contract

This document reflects the currently implemented server contract in `server/src`.

Base URL (local): `http://localhost:5000`

## Conventions

- All API routes are mounted on the server root (for example, `/auth/me`, `/sessions/start`).
- Protected routes require valid auth cookies set by the OAuth callback flow.
- `x-request-id` is returned on every response.
- Standard error shape:

```json
{
  "error": "Request failed.",
  "code": "REQUEST_FAILED",
  "details": {},
  "requestId": "..."
}
```

- HTTP error codes are sanitized to public-safe messages/codes by `error.middleware.ts`.

## Authentication

### `POST /auth/refresh-token`

- Purpose: rotates/refreshes session using refresh token cookie.
- Request body: none.
- Success `200`:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "authenticated",
    "emailConfirmed": true
  },
  "session": null,
  "requiresEmailConfirmation": false
}
```

- Failure:
  - `401` missing/invalid refresh cookie
  - `403` email not confirmed

### `GET /auth/oauth/google`

- Purpose: starts PKCE Google OAuth flow via Supabase.
- Query:
  - `next` optional relative path (for post-login redirect), max 512 chars.
- Behavior:
  - Sets signed OAuth state cookie.
  - Returns `302` redirect to Supabase authorize URL.

### `GET /auth/oauth/google/callback`

- Purpose: OAuth callback endpoint (must be reachable on backend domain).
- Query:
  - `code` (required in success flow)
  - `state` optional
  - `error`, `error_description` optional
- Behavior:
  - Validates signed state cookie + PKCE verifier.
  - Exchanges code for Supabase session.
  - Sets auth cookies and redirects (`302`) to sanitized success target.
  - On failure, clears cookies and redirects to configured error URL.

### `POST /auth/logout`

- Purpose: revoke session and clear auth cookies.
- Success `200`:

```json
{ "success": true }
```

### `GET /auth/me` (Protected)

- Purpose: returns authenticated user claims plus profile name.
- Success `200`:

```json
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "authenticated",
    "emailConfirmed": true,
    "aud": "authenticated",
    "fullName": "Jane Doe"
  }
}
```

## Scenarios (Protected)

### `GET /scenarios`

- Query:
  - `category`: `work|health|family|social|financial|legal`
  - `search`: string (1..120)
  - `customOnly`: `"true"|"false"`
  - `limit`: numeric string, capped at 100, default 20
  - `offset`: numeric string, default 0
- Success `200`:

```json
{ "scenarios": [ ... ] }
```

### `GET /scenarios/:id`

- Success `200`:

```json
{ "scenario": { ... } }
```

- `404` if not found/inaccessible.

### `POST /scenarios/custom`

- Body:
  - `title`, `category`, `description`
  - `characterProfile`:
    - `name`, `role`, `gender`, `voiceId`, `personality[]`, `goals[]`, `emotionalState`
    - Gender/voice rules:
      - Male voices: `austin | daniel | troy`
      - Female voices: `autumn | diana | hannah`
  - `difficultyVariants[]`:
    - `level`: `cooperative|neutral|resistant|hostile`
    - `behaviorModifier`
- Success `201`:

```json
{ "scenario": { ... } }
```

### `PATCH /scenarios/custom/:id`

- Body schema: same as create (full validated payload).
- Success `200`:

```json
{ "scenario": { ... } }
```

- `404` if scenario not found/inaccessible.

### `DELETE /scenarios/custom/:id`

- Success `200`:

```json
{ "deleted": true }
```

- `404` not found
- `409` if scenario already has sessions (`in_use`)

## Sessions (Protected)

### `POST /sessions/start`

- Body:

```json
{
  "scenarioId": "uuid",
  "difficultyLevel": "cooperative|neutral|resistant|hostile",
  "customContext": "optional"
}
```

- Success `201`:

```json
{
  "session": {
    "id": "uuid",
    "userId": "uuid",
    "scenarioId": "uuid",
    "customContext": null,
    "difficultyLevel": "neutral",
    "status": "active",
    "startedAt": "ISO",
    "endedAt": null
  }
}
```

- `404` scenario not found or inaccessible.

### `GET /sessions/history`

- Query:
  - `limit`: numeric string (cap 100, default 20)
  - `offset`: numeric string (default 0)
  - `status`: `active|completed|abandoned`
- Success `200`:

```json
{ "sessions": [ ... ] }
```

### `DELETE /sessions/history`

- Query:
  - `scope`: `non_active|completed|abandoned|all` (default `non_active`)
  - `limit`: numeric string (cap 500, default 100)
- Success `200`:

```json
{ "deletedCount": 12 }
```

### `DELETE /sessions/:id`

- Deletes a single non-active session.
- Success `200`:

```json
{ "deleted": true }
```

- `409` if session is active
- `404` if not found

### `GET /sessions/:id`

- Success `200`:

```json
{
  "session": { ... },
  "messages": [ ... ]
}
```

- `404` if not found/inaccessible.

### `POST /sessions/:id/message` (SSE)

- Body:

```json
{ "content": "User message text" }
```

- Response headers:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

- Stream chunks:

```text
data: {"token":"..."}

data: {"done":true}
```

- Failure:
  - `404` session not found
  - `409` session not active
  - `400` invalid body/params

### `POST /sessions/:id/end`

- Body:

```json
{ "status": "completed|abandoned" }
```

- Success `200` always returns `session`.
- If ended as `completed`, feedback is queued and response includes:

```json
{
  "session": { ... },
  "feedback": null,
  "feedbackStatus": "pending",
  "feedbackQueue": {
    "state": "queued|processing|completed|failed",
    "updatedAt": 0,
    "attempts": 0,
    "error": "optional"
  }
}
```

- If feedback queueing fails, response includes `feedbackGenerationError`.

## Feedback (Protected)

### `GET /feedback/:sessionId`

- If feedback already exists:
  - `200`

```json
{
  "feedback": { ... },
  "generatedNow": false,
  "queueStatus": {
    "state": "queued|processing|completed|failed",
    "updatedAt": 0,
    "attempts": 0,
    "error": "optional"
  }
}
```

- If feedback not ready:
  - `202`

```json
{
  "status": "pending",
  "queueStatus": {
    "state": "queued|processing|completed|failed",
    "updatedAt": 0,
    "attempts": 0,
    "error": "optional"
  },
  "message": "Feedback is being generated. Retry this endpoint shortly."
}
```

## Users (Protected)

### `GET /users/profile`

- Success `200`:

```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "avatarUrl": null,
    "preferences": {},
    "createdAt": "ISO",
    "updatedAt": "ISO"
  }
}
```

### `PATCH /users/profile`

- Body (at least one field required):

```json
{
  "fullName": "optional",
  "avatarUrl": "optional-url-or-null",
  "preferences": {
    "ttsGender": "male|female",
    "ttsVoiceId": "autumn|diana|hannah|austin|daniel|troy"
  }
}
```

- Success `200`:

```json
{ "profile": { ... } }
```

### `GET /users/progress`

- Success `200`:

```json
{
  "summary": {
    "totalCompletedSessions": 0,
    "averageConfidenceScore": null,
    "latestConfidenceScore": null
  },
  "snapshots": []
}
```

## Health

### `GET /health`

- Success `200`:

```json
{ "status": "ok", "project": "Rehearse", "version": "1.0.0" }
```

## Voice WebSocket Contract

Endpoint:
- `ws://localhost:5000/ws/voice?sessionId=<uuid>` (local)
- `wss://<api-domain>/ws/voice?sessionId=<uuid>` (production)

Handshake requirements:
- Valid auth cookie in WebSocket request.
- Valid `sessionId` query param.
- Origin must match configured client origin in production.

Client -> Server events:
- JSON: `{ "type": "audio_start", "mimeType": "audio/webm" }`
- Binary frames: microphone chunks
- JSON: `{ "type": "audio_end" }`

Server -> Client events:
- Status events:
  - `listening`
  - `transcribing`
  - `generating_response`
  - `synthesizing_audio`
  - `audio_unavailable` (with safe reason)
  - `empty_transcript`
  - `idle`
- Transcript event:
  - `{ "type": "transcript", "text": "..." }`
- Assistant text event:
  - `{ "type": "assistant_text", "text": "..." }`
- Audio metadata:
  - `{ "type": "audio_response", "sequence": 0, "size": 1234, "mimeType": "audio/wav", "provider": "groq|elevenlabs" }`
- Binary audio chunks (raw bytes)
- Completion:
  - `{ "type": "response_complete" }`
- Error:
  - `{ "type": "error", "code": "...", "message": "..." }`

Server guardrails:
- max audio bytes per turn: 2 MB
- max chunk count per turn: 200
- max malformed messages: 5
- accepted mime types: webm/ogg/mp3/wav/mp4/m4a

