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
