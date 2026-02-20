import http from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { env } from "./config/env";
import { db } from "./config/db";
import { connectRedis } from "./config/redis";
import { startFeedbackQueueWorker } from "./jobs/feedback.queue";
import { supabaseAuthApi, supabaseConfig } from "./config/supabase";
import { logError, logInfo, logWarn } from "./utils/logger";
import { handleVoiceSession } from "./voice/websocket.handler";

const server = http.createServer(app);

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split(".");
  if (segments.length < 2) return null;

  try {
    return JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
};

const validateVoiceToken = async (token: string) => {
  const decoded = parseJwtPayload(token);
  if (!decoded) return null;

  if (typeof decoded.iss !== "string" || decoded.iss !== supabaseConfig.jwtIssuer) {
    return null;
  }

  const tokenAudience = decoded.aud;
  const audienceMatch =
    (typeof tokenAudience === "string" &&
      tokenAudience === supabaseConfig.jwtAudience) ||
    (Array.isArray(tokenAudience) &&
      tokenAudience.includes(supabaseConfig.jwtAudience));
  if (!audienceMatch) return null;

  const user = await supabaseAuthApi.getUserFromAccessToken(token);
  if (!user.email_confirmed_at) return null;
  return user;
};

// ── WebSocket Server (Voice) ──────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws/voice" });

wss.on("connection", async (ws, req) => {
  try {
    const url = new URL(req.url || "/ws/voice", env.SERVER_URL);
    const sessionId = url.searchParams.get("sessionId");
    const token = url.searchParams.get("token");

    if (!sessionId || !token) {
      logWarn("voice.ws.reject.missing_params", {
        sessionId: sessionId || null,
      });
      ws.close(1008, "Missing sessionId or token");
      return;
    }

    const user = await validateVoiceToken(token);
    if (!user) {
      logWarn("voice.ws.reject.invalid_token", { sessionId });
      ws.close(1008, "Invalid token");
      return;
    }

    logInfo("voice.ws.connected", {
      sessionId,
      userId: user.id,
    });

    handleVoiceSession(ws, { sessionId, userId: user.id });
  } catch (error) {
    logError("voice.ws.connection_failed", {
      error: (error as Error).message,
    });
    ws.close(1011, "Voice websocket initialization failed");
  }
});

// ── Start Server ──────────────────────────────────────────────
const start = async () => {
  try {
    await connectRedis();
    await db.query("SELECT 1"); // Test DB connection
    logInfo("server.start.dependencies_ready", {
      redis: true,
      postgres: true,
    });
    startFeedbackQueueWorker();

    server.listen(env.PORT, () => {
      logInfo("server.started", {
        httpUrl: `http://localhost:${env.PORT}`,
        wsUrl: `ws://localhost:${env.PORT}/ws/voice`,
        environment: env.NODE_ENV,
      });
    });
  } catch (err) {
    logError("server.start.failed", {
      error: (err as Error).message,
    });
    process.exit(1);
  }
};

start();
