import http from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { env } from "./config/env";
import { db } from "./config/db";
import { connectRedis } from "./config/redis";
import { startFeedbackQueueWorker } from "./jobs/feedback.queue";
import { supabaseAuthApi, supabaseConfig } from "./config/supabase";
import { getAccessTokenFromCookieHeader } from "./modules/auth/auth.utils";
import { logError, logInfo, logWarn } from "./utils/logger";
import { handleVoiceSession } from "./voice/websocket.handler";

const server = http.createServer(app);

const expectedClientOrigin = (() => {
  try {
    return new URL(env.CLIENT_URL).origin;
  } catch {
    return env.CLIENT_URL;
  }
})();

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

const isAllowedWebSocketOrigin = (originHeader: string | undefined): boolean => {
  if (!originHeader) {
    return env.NODE_ENV !== "production";
  }

  try {
    return new URL(originHeader).origin === expectedClientOrigin;
  } catch {
    return false;
  }
};

// ── WebSocket Server (Voice) ──────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws/voice" });

wss.on("connection", async (ws, req) => {
  try {
    const originHeader =
      typeof req.headers.origin === "string" ? req.headers.origin : undefined;
    if (!isAllowedWebSocketOrigin(originHeader)) {
      logWarn("voice.ws.reject.invalid_origin", {
        origin: originHeader || null,
        expectedOrigin: expectedClientOrigin,
      });
      ws.close(1008, "Invalid websocket origin");
      return;
    }

    const url = new URL(req.url || "/ws/voice", env.SERVER_URL);
    const sessionId = url.searchParams.get("sessionId");
    const tokenFromCookie = getAccessTokenFromCookieHeader(req.headers.cookie);
    const token = tokenFromCookie;

    if (!sessionId || !token) {
      logWarn("voice.ws.reject.missing_params", {
        sessionId: sessionId || null,
        hasCookieToken: Boolean(tokenFromCookie),
      });
      ws.close(1008, "Missing sessionId or auth cookie");
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
    const redisReady = await connectRedis();
    await db.query("SELECT 1"); // Test DB connection

    if (!redisReady) {
      logWarn("server.start.redis_unavailable", {
        message:
          "Redis is not reachable at startup. Running with degraded mode for queue/rate-limit.",
      });
    }

    logInfo("server.start.dependencies_ready", {
      redis: redisReady,
      postgres: true,
    });
    if (redisReady) {
      startFeedbackQueueWorker();
    } else {
      logWarn("feedback.queue.worker.skipped", {
        queueBackend: "memory",
        reason: "Redis unavailable at startup",
      });
    }

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
