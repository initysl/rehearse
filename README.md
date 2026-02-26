# Rehearse

Rehearse is an AI Conversation Simulator designed to help users practice difficult real-life conversations in a safe, private environment and improve communication confidence through structured feedback.

This repository is a monorepo with:
- `client`: Next.js frontend
- `server`: Node.js/Express backend

The product and architecture are based on `Rehearse: AI_Conversation_Simulator_System_Design.docx` (v1.0.0, February 2026).

## Monorepo Structure

```text
rehearse/
  client/                  # Frontend (Next.js + TypeScript)
  server/                  # Backend (Express + TypeScript)
    src/
      ai/                  # Prompt + AI integration layer
      voice/               # STT/TTS + WebSocket voice flow
      modules/             # Auth, scenarios, sessions, feedback, users
      db/migrations/       # SQL schema migrations
  Rehearse: AI_Conversation_Simulator_System_Design.docx
```

## System Design Summary

Planned layered architecture:
- Frontend: Next.js + TypeScript
- Backend/API: Express + TypeScript
- AI Engine: Groq (Llama 3.3 70B + Whisper STT), local Kokoro TTS (or Groq TTS fallback)
- Data: PostgreSQL (persistent), Redis (cache/session/rate limit)
- Realtime: SSE for streaming text, WebSocket for voice

Core product goals:
- Practice realistic scenarios (work, health, family, social, financial)
- Receive structured coaching feedback after each session
- Track confidence growth over time
- Keep user conversations private and secure

## Current Implementation Status

What exists now in code:
- Frontend app scaffold in `client` (Next.js app router baseline)
- Backend server bootstrap with middleware and health endpoint
- Supabase-backed auth (`email/password` + Google OAuth via backend callback)
- Protected profile routes with token validation middleware
- AI prompt builders and Groq streaming helper
- Voice pipeline components (WebSocket handler, Whisper STT, configurable TTS provider)
- PostgreSQL SQL migration files for core tables
- Redis and PostgreSQL configuration wiring
- Migration runner script (`server/src/db/migrate.ts`)

What is still scaffold/TODO:
- Most backend feature routes and module implementations in `server/src/modules/*`
- Scenario seed data implementation

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Data: PostgreSQL, Redis
- AI/Voice: Groq SDK (LLM + Whisper STT), Kokoro local TTS or Groq TTS
- Security/Infra: Helmet, CORS, Supabase Auth, RLS, rate limiting

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 16+
- Redis 7+
- API key for Groq

## Environment Setup

Server environment is required before startup.

1. Copy and edit:
```bash
cp server/.env.example server/.env
```

2. Fill required values in `server/.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `COOKIE_SIGNING_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `GROQ_API_KEY`
- `CLIENT_URL` (default `http://localhost:3000`)

## Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

## Run Locally

Run backend:

```bash
cd server
npm run dev
```

Run frontend:

```bash
cd client
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health check: `GET http://localhost:5000/health`
- Voice WebSocket: `ws://localhost:5000/ws/voice`

## Database Migrations

Migration SQL files are available in:
- `server/src/db/migrations`

Run in order (manual for now), for example:

```bash
cd server
for f in src/db/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

## Roadmap (From System Design)

1. Phase 1 (MVP): text scenarios, core session flow, basic feedback
2. Phase 2: deeper scenario library + improved analytics/history
3. Phase 3: full voice mode with low-latency sentence-level streaming
4. Phase 4: B2B features (team dashboards, coach workflows)
5. Phase 5: scale (mobile, multilingual, partnerships)

## Notes

- This README reflects both the intended architecture from the design document and the current codebase status.
- The system design doc remains the source of truth for product direction and non-functional requirements.
