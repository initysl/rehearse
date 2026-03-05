# Rehearse

Rehearse is an AI conversation simulator for practicing high-stakes real-life discussions before they happen in real life.

It gives users a safe environment to rehearse difficult conversations, get immediate AI responses in text and voice, and receive structured coaching feedback after each session.

Examples:

- Salary negotiation with a manager
- Requesting loan repayment from a friend
- Interview simulation
- Setting boundaries with family
- Handling social or workplace conflict

This repository is a monorepo:

- `client`: Next.js web app
- `server`: Node.js/Express API + realtime voice pipeline

---

## What The System Does

Rehearse is not a generic chatbot. It is a guided simulation system with scenario context, role behavior, and post-session coaching.

At runtime, it does this:

1. User signs in and selects a scenario.
2. User starts a practice session with difficulty and context.
3. User interacts with an AI character by text and/or microphone.
4. AI responds in-stream (SSE for text, WebSocket for voice).
5. Session transcript is persisted.
6. User ends session and gets generated feedback.
7. User reviews history, progress, and can retry with improved strategy.

---

## Core Product Capabilities

- Scenario library with realistic conversation contexts
- Custom scenarios with editable character profile
- Mixed interaction mode:
  - Text streaming chat
  - Voice streaming (mic + transcript + TTS playback)
- Session lifecycle:
  - start, message, end, feedback retrieval
- Structured coaching feedback after completed sessions
- Session history management (delete/clear)
- User profile and progress tracking
- OAuth-based authentication with secure cookie sessions
- Quota/rate-limit controls for model usage and platform abuse prevention

---

## Architecture Overview

### Frontend (`client`)

- Next.js 16 + React 19 + TypeScript
- Dashboard and landing experience
- React Query data layer
- Framer Motion interactions
- Talks to backend via `NEXT_PUBLIC_API_BASE_URL`

### Backend (`server`)

- Express + TypeScript
- REST modules:
  - `auth`
  - `scenarios`
  - `sessions`
  - `messages`
  - `feedback`
  - `users`
- Realtime:
  - SSE for text response streaming
  - WebSocket for voice sessions (`/ws/voice`)

### Data and Infra

- PostgreSQL for persistent domain data
- Redis for queue/rate-limit support
- Supabase Auth for identity and token verification
- Groq for LLM + STT + primary TTS
- Optional ElevenLabs fallback TTS (rate-limit policy based)

---

## Repository Structure

```text
rehearse/
  client/
    app/                    # Next.js App Router pages
    components/             # Landing + dashboard UI
    lib/                    # API clients, hooks, query keys
  server/
    src/
      modules/              # Domain modules (auth/sessions/scenarios/etc)
      voice/                # Voice WebSocket + TTS/STT pipeline
      db/migrations/        # SQL migrations
      config/               # Env, DB, Redis, Supabase config
    tests/                  # Node test runner suites
    docs/api-contract.md
  Dockerfile                # Backend container build
  Rehearse: AI_Conversation_Simulator_System_Design.docx
```

---

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind
- Backend: Node.js, Express, TypeScript
- Data: PostgreSQL, Redis
- Auth: Supabase Auth
- AI/Voice: Groq (LLM/STT/TTS), optional ElevenLabs fallback TTS
- Tooling: Zod, React Query, ws, node test runner

---

## Local Development

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL
- Redis
- Supabase project
- Groq API key

### 1) Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2) Configure environment

Server:

```bash
cp server/.env.example server/.env
```

Client:

```bash
cp client/.env.example client/.env
```

Minimum required server values:

- `DATABASE_URL`
- `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `COOKIE_SIGNING_SECRET`
- `GROQ_API_KEY`

Minimum required client values:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

### 3) Run migrations and seed

```bash
cd server
npm run migrate
npm run seed:scenarios
```

### 4) Start services

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Local defaults:

- Web app: `http://localhost:3000`
- API: `http://localhost:5000`
- Health: `http://localhost:5000/health`
- Voice WS: `ws://localhost:5000/ws/voice`

---

## Testing and Build

Server:

```bash
cd server
npm run build
npm test
```

Client:

```bash
cd client
npm run build
```

---

## API and Realtime Contract

Detailed contract: `server/docs/api-contract.md`

Key entry points:

- `GET /health`
- `GET /auth/oauth/google`
- `GET /auth/oauth/google/callback`
- `POST /sessions/start`
- `POST /sessions/:id/message` (SSE stream)
- `GET /feedback/:sessionId`
- `ws://<api-host>/ws/voice?sessionId=<uuid>`

---
## Co-Contributor
Claude - Codex

Made with ❤️ for humans and alies :)
