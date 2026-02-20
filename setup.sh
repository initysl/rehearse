#!/bin/bash

# ─────────────────────────────────────────────────────────────
#  Rehearse — Backend Setup Script
#  Creates the full folder structure and boilerplate files
# ─────────────────────────────────────────────────────────────

set -e

PROJECT="server"

echo ""
echo "🎙️  Setting up Rehearse Backend — $PROJECT"
echo "────────────────────────────────────────────"

# ── 1. Root folder ───────────────────────────────────────────
mkdir -p $PROJECT
cd $PROJECT

# ── 2. Folder structure ──────────────────────────────────────
echo "📁  Creating folder structure..."

mkdir -p src/config
mkdir -p src/modules/auth
mkdir -p src/modules/scenarios
mkdir -p src/modules/sessions
mkdir -p src/modules/messages
mkdir -p src/modules/feedback
mkdir -p src/modules/users
mkdir -p src/ai
mkdir -p src/voice
mkdir -p src/middleware
mkdir -p src/db/migrations
mkdir -p src/db/seeds
mkdir -p src/types

# ── 3. package.json ──────────────────────────────────────────
echo "📦  Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "rehearse-server",
  "version": "1.0.0",
  "description": "Rehearse — AI Conversation Simulator Backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "ts-node src/db/migrate.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "redis": "^4.6.11",
    "groq-sdk": "^0.3.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "express-rate-limit": "^7.1.5",
    "rate-limit-redis": "^4.2.0",
    "ws": "^8.16.0",
    "openai": "^4.24.1",
    "zod": "^3.22.4",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/pg": "^8.10.9",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/ws": "^8.5.10",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2"
  }
}
EOF

# ── 4. tsconfig.json ─────────────────────────────────────────
echo "🔧  Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ── 5. nodemon.json ──────────────────────────────────────────
echo "🔧  Creating nodemon.json..."
cat > nodemon.json << 'EOF'
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts"
}
EOF

# ── 6. .env.example ──────────────────────────────────────────
echo "🔑  Creating .env.example..."
cat > .env.example << 'EOF'
# ── Server ──────────────────────────────
PORT=5000
NODE_ENV=development

# ── PostgreSQL ───────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/rehearse_db

# ── Redis ────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── JWT ──────────────────────────────────
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_secret_here
REFRESH_TOKEN_EXPIRES_IN=30d

# ── Groq ─────────────────────────────────
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# ── OpenAI (Whisper STT + TTS) ───────────
OPENAI_API_KEY=your_openai_api_key_here

# ── Auth0 ────────────────────────────────
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# ── Frontend URL (CORS) ──────────────────
CLIENT_URL=http://localhost:3000
EOF

# ── 7. .gitignore ────────────────────────────────────────────
echo "🚫  Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.log
.DS_Store
EOF

# ── 8. src/config/env.ts ─────────────────────────────────────
cat > src/config/env.ts << 'EOF'
import dotenv from "dotenv";
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  PORT: parseInt(process.env.PORT || "5000"),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: required("REDIS_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_SECRET: required("REFRESH_TOKEN_SECRET"),
  GROQ_API_KEY: required("GROQ_API_KEY"),
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  OPENAI_API_KEY: required("OPENAI_API_KEY"),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
EOF

# ── 9. src/config/db.ts ──────────────────────────────────────
cat > src/config/db.ts << 'EOF'
import { Pool } from "pg";
import { env } from "./env";

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});
EOF

# ── 10. src/config/redis.ts ──────────────────────────────────
cat > src/config/redis.ts << 'EOF'
import { createClient } from "redis";
import { env } from "./env";

export const redis = createClient({ url: env.REDIS_URL });

redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("✅  Redis connected"));

export const connectRedis = async () => {
  await redis.connect();
};
EOF

# ── 11. src/config/groq.ts ───────────────────────────────────
cat > src/config/groq.ts << 'EOF'
import Groq from "groq-sdk";
import { env } from "./env";

export const groq = new Groq({ apiKey: env.GROQ_API_KEY });
EOF

# ── 12. src/types/global.types.ts ───────────────────────────
cat > src/types/global.types.ts << 'EOF'
// ── Auth ──────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
}

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  subscriptionTier: "free" | "pro" | "enterprise";
  createdAt: Date;
}

// ── Scenario ──────────────────────────────────────────────────
export interface Scenario {
  id: string;
  title: string;
  category: "work" | "health" | "family" | "social" | "financial" | "legal";
  description: string;
  characterProfile: CharacterProfile;
  difficultyVariants: DifficultyVariant[];
  isCustom: boolean;
  createdBy?: string;
}

export interface CharacterProfile {
  name: string;
  role: string;
  personality: string[];
  goals: string[];
  emotionalState: string;
}

export interface DifficultyVariant {
  level: "cooperative" | "neutral" | "resistant" | "hostile";
  behaviorModifier: string;
}

// ── Session ───────────────────────────────────────────────────
export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  customContext?: string;
  difficultyLevel: "cooperative" | "neutral" | "resistant" | "hostile";
  status: "active" | "completed" | "abandoned";
  startedAt: Date;
  endedAt?: Date;
}

// ── Message ───────────────────────────────────────────────────
export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokenCount?: number;
  createdAt: Date;
}

// ── Feedback ──────────────────────────────────────────────────
export interface FeedbackResult {
  goalAchieved: boolean;
  goalAnalysis: string;
  communicationPatterns: {
    assertivenessScore: number;
    clarityScore: number;
    emotionalControlScore: number;
    observations: string[];
  };
  keyMoments: {
    userMessage: string;
    analysis: string;
    alternative: string;
  }[];
  phrasesToTry: string[];
  overallSummary: string;
  confidenceScore: number;
}

// ── Express augmentation ──────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
EOF

# ── 13. src/middleware/auth.middleware.ts ────────────────────
cat > src/middleware/auth.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types/global.types";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized — no token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized — invalid or expired token" });
  }
};
EOF

# ── 14. src/middleware/error.middleware.ts ───────────────────
cat > src/middleware/error.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${statusCode} — ${message}`);

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
EOF

# ── 15. src/middleware/ratelimit.middleware.ts ───────────────
cat > src/middleware/ratelimit.middleware.ts << 'EOF'
import rateLimit from "express-rate-limit";

export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { error: "Too many requests — limit is 50 AI messages per hour" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many auth attempts — try again in 15 minutes" },
});
EOF

# ── 16. src/middleware/logger.middleware.ts ──────────────────
cat > src/middleware/logger.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    // NOTE: Never log req.body — may contain conversation content
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
};
EOF

# ── 17. src/ai/character.prompt.ts ──────────────────────────
cat > src/ai/character.prompt.ts << 'EOF'
import { Scenario, Message } from "../types/global.types";

export const buildCharacterPrompt = (
  scenario: Scenario,
  difficulty: string,
  customContext?: string
): string => {
  const variant = scenario.difficultyVariants.find(v => v.level === difficulty);
  const { characterProfile } = scenario;

  return `You are playing the role of ${characterProfile.name}, a ${characterProfile.role}.

PERSONALITY: ${characterProfile.personality.join(", ")}
EMOTIONAL STATE: ${characterProfile.emotionalState}
SITUATION: ${scenario.description}
${customContext ? `ADDITIONAL CONTEXT: ${customContext}` : ""}
YOUR GOALS IN THIS CONVERSATION: ${characterProfile.goals.join(". ")}
DIFFICULTY MODIFIER: ${variant?.behaviorModifier || "Respond naturally and realistically."}

RULES:
- Stay in character at all times. Never break character under any circumstance.
- Respond the way a real ${characterProfile.role} would — natural language, realistic emotions.
- Do not be artificially helpful. React authentically to what the user says.
- Keep responses concise (2-4 sentences) unless the situation genuinely requires more.
- Never refer to yourself as an AI or a language model.
- If the user says something that would genuinely change the character's position, reflect that.`;
};

export const buildMessages = (
  systemPrompt: string,
  history: Message[]
): { role: "system" | "user" | "assistant"; content: string }[] => {
  return [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    }))
  ];
};
EOF

# ── 18. src/ai/coach.prompt.ts ───────────────────────────────
cat > src/ai/coach.prompt.ts << 'EOF'
import { Message } from "../types/global.types";

export const buildCoachPrompt = (
  scenarioGoal: string,
  transcript: Message[]
): string => {
  const formatted = transcript
    .filter(m => m.role !== "system")
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  return `You are an expert communication coach. Analyze the following practice conversation and return ONLY a valid JSON object — no explanation, no markdown, no preamble.

SCENARIO GOAL: ${scenarioGoal}

TRANSCRIPT:
${formatted}

Return this exact JSON structure:
{
  "goalAchieved": boolean,
  "goalAnalysis": "string",
  "communicationPatterns": {
    "assertivenessScore": number (1-10),
    "clarityScore": number (1-10),
    "emotionalControlScore": number (1-10),
    "observations": ["string"]
  },
  "keyMoments": [
    { "userMessage": "string", "analysis": "string", "alternative": "string" }
  ],
  "phrasesToTry": ["string"],
  "overallSummary": "string",
  "confidenceScore": number (1-100)
}`;
};
EOF

# ── 19. src/ai/groq.service.ts ───────────────────────────────
cat > src/ai/groq.service.ts << 'EOF'
import { Response } from "express";
import { groq } from "../config/groq";
import { env } from "../config/env";

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export const streamGroqResponse = async (
  messages: GroqMessage[],
  res: Response
): Promise<string> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullContent = "";

  const stream = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages,
    stream: true,
    max_tokens: 500,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      fullContent += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();

  return fullContent;
};

export const getGroqCompletion = async (prompt: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || "";
};
EOF

# ── 20. src/ai/context.manager.ts ───────────────────────────
cat > src/ai/context.manager.ts << 'EOF'
import { Message } from "../types/global.types";

const MAX_MESSAGES = 40; // Keep last 40 messages to stay within token limits

export const manageContext = (messages: Message[]): Message[] => {
  if (messages.length <= MAX_MESSAGES) return messages;

  // Keep first message (scene-setter) + most recent messages
  const first = messages.slice(0, 1);
  const recent = messages.slice(-( MAX_MESSAGES - 1));
  return [...first, ...recent];
};
EOF

# ── 21. src/voice/websocket.handler.ts ──────────────────────
cat > src/voice/websocket.handler.ts << 'EOF'
import { WebSocket } from "ws";
import { transcribeAudio } from "./stt.service";
import { streamTTS } from "./tts.service";

export const handleVoiceSession = (ws: WebSocket, sessionId: string) => {
  const audioChunks: Buffer[] = [];

  ws.on("message", async (data: Buffer, isBinary: boolean) => {
    try {
      if (isBinary) {
        // Accumulate audio chunks
        audioChunks.push(data);
        return;
      }

      const message = JSON.parse(data.toString());

      if (message.type === "audio_end") {
        // User stopped speaking — process the audio
        const audioBuffer = Buffer.concat(audioChunks);
        audioChunks.length = 0; // clear

        ws.send(JSON.stringify({ type: "status", message: "transcribing" }));

        const transcript = await transcribeAudio(audioBuffer);
        ws.send(JSON.stringify({ type: "transcript", text: transcript }));

        // AI response via sentence streaming TTS is handled in audio.pipeline.ts
        await streamTTS(transcript, sessionId, ws);
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: "Voice processing failed" }));
    }
  });

  ws.on("close", () => {
    console.log(`Voice session closed: ${sessionId}`);
  });
};
EOF

# ── 22. src/voice/stt.service.ts ────────────────────────────
cat > src/voice/stt.service.ts << 'EOF'
import OpenAI from "openai";
import { env } from "../config/env";
import { Readable } from "stream";
import { toFile } from "openai";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
  const file = await toFile(Readable.from(audioBuffer), "audio.webm", {
    type: "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
  });

  return transcription.text;
};
EOF

# ── 23. src/voice/tts.service.ts ────────────────────────────
cat > src/voice/tts.service.ts << 'EOF'
import OpenAI from "openai";
import { env } from "../config/env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const convertToSpeech = async (text: string): Promise<Buffer> => {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
};
EOF

# ── 24. src/voice/audio.pipeline.ts ─────────────────────────
cat > src/voice/audio.pipeline.ts << 'EOF'
import { WebSocket } from "ws";
import { convertToSpeech } from "./tts.service";

// Splits AI text into sentences and converts each to audio as it arrives
export const streamTTS = async (
  text: string,
  _sessionId: string,
  ws: WebSocket
): Promise<void> => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let sequence = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const audioBuffer = await convertToSpeech(trimmed);
    ws.send(JSON.stringify({
      type: "audio_response",
      sequence: sequence++,
      size: audioBuffer.length,
    }));
    ws.send(audioBuffer); // Send raw binary audio
  }

  ws.send(JSON.stringify({ type: "response_complete" }));
};
EOF

# ── 25. src/app.ts ───────────────────────────────────────────
cat > src/app.ts << 'EOF'
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";

// Route imports
import authRoutes from "./modules/auth/auth.routes";
import scenarioRoutes from "./modules/scenarios/scenarios.routes";
import sessionRoutes from "./modules/sessions/sessions.routes";
import feedbackRoutes from "./modules/feedback/feedback.routes";
import userRoutes from "./modules/users/users.routes";

const app = express();

// ── Core Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/scenarios", scenarioRoutes);
app.use("/sessions", sessionRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/users", userRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", project: "Rehearse", version: "1.0.0" });
});

// ── Error Handler (must be last) ─────────────────────────────
app.use(errorHandler);

export default app;
EOF

# ── 26. src/server.ts ────────────────────────────────────────
cat > src/server.ts << 'EOF'
import http from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { env } from "./config/env";
import { db } from "./config/db";
import { connectRedis } from "./config/redis";
import { handleVoiceSession } from "./voice/websocket.handler";

const server = http.createServer(app);

// ── WebSocket Server (Voice) ──────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws/voice" });

wss.on("connection", (ws, req) => {
  const sessionId = req.url?.split("/").pop() || "unknown";
  console.log(`🎙️  Voice WebSocket connected — session: ${sessionId}`);
  handleVoiceSession(ws, sessionId);
});

// ── Start Server ──────────────────────────────────────────────
const start = async () => {
  try {
    await connectRedis();
    await db.query("SELECT 1"); // Test DB connection
    console.log("✅  PostgreSQL connected");

    server.listen(env.PORT, () => {
      console.log("");
      console.log("🎙️  Rehearse Backend running");
      console.log(`🌐  http://localhost:${env.PORT}`);
      console.log(`🔌  WebSocket: ws://localhost:${env.PORT}/ws/voice`);
      console.log(`🌍  Environment: ${env.NODE_ENV}`);
      console.log("");
    });
  } catch (err) {
    console.error("❌  Failed to start server:", err);
    process.exit(1);
  }
};

start();
EOF

# ── 27. Module placeholder files ────────────────────────────
echo "📄  Creating module placeholder files..."

for MODULE in auth scenarios sessions messages feedback users; do
  cat > src/modules/$MODULE/${MODULE}.routes.ts << EOF
import { Router } from "express";

const router = Router();

// TODO: Define ${MODULE} routes

export default router;
EOF

  cat > src/modules/$MODULE/${MODULE}.controller.ts << EOF
import { Request, Response } from "express";

// TODO: Implement ${MODULE} controller methods
EOF

  cat > src/modules/$MODULE/${MODULE}.service.ts << EOF
import { db } from "../../config/db";

// TODO: Implement ${MODULE} service methods
EOF

  cat > src/modules/$MODULE/${MODULE}.types.ts << EOF
// TODO: Define ${MODULE}-specific TypeScript types
EOF
done

# ── 28. DB Migration placeholders ───────────────────────────
echo "🗃️  Creating migration files..."

cat > src/db/migrations/001_create_users.sql << 'EOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
EOF

cat > src/db/migrations/002_create_scenarios.sql << 'EOF'
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('work', 'health', 'family', 'social', 'financial', 'legal')),
  description TEXT NOT NULL,
  character_profile JSONB NOT NULL,
  difficulty_variants JSONB NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EOF

cat > src/db/migrations/003_create_sessions.sql << 'EOF'
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id),
  custom_context TEXT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('cooperative', 'neutral', 'resistant', 'hostile')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
EOF

cat > src/db/migrations/004_create_messages.sql << 'EOF'
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EOF

cat > src/db/migrations/005_create_feedback.sql << 'EOF'
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  goal_achieved BOOLEAN,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 100),
  full_feedback JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
EOF

cat > src/db/migrations/006_create_progress.sql << 'EOF'
CREATE TABLE progress_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id),
  confidence_score INTEGER,
  session_count INTEGER DEFAULT 1,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
EOF

# ── 29. Seed placeholder ─────────────────────────────────────
cat > src/db/seeds/scenarios.seed.ts << 'EOF'
import { db } from "../config/db";

// TODO: Insert default scenario library
const seed = async () => {
  console.log("Seeding scenarios...");
  // Add seed data here
  await db.end();
};

seed();
EOF

# ── 30. Copy .env.example to .env ───────────────────────────
cp .env.example .env

# ── 31. Install dependencies ─────────────────────────────────
echo ""
echo "📦  Installing dependencies..."
npm install

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────"
echo "✅  Rehearse backend is ready!"
echo ""
echo "Next steps:"
echo "  1.  Fill in your .env file with real API keys"
echo "  2.  Run your PostgreSQL migrations"
echo "  3.  npm run dev — to start the dev server"
echo "────────────────────────────────────────────"
echo ""
