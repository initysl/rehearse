import { createClient } from "redis";
import { env } from "./env";
import { logWarn, logInfo } from "../utils/logger";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const redis = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 30_000,
    keepAlive: 5_000,
    noDelay: true,
    reconnectStrategy: (retries: number) => Math.min(250 * retries, 5_000),
  },
  pingInterval: 30_000,
});
let redisConnectPromise: Promise<boolean> | null = null;

redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("✅  Redis connected"));
redis.on("reconnecting", () => {
  logWarn("redis.reconnecting");
});
redis.on("end", () => {
  logWarn("redis.connection_ended");
});

export const connectRedis = async () => {
  if (redis.isOpen) return true;
  if (!redisConnectPromise) {
    redisConnectPromise = (async () => {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          if (redis.isOpen) return true;
          await redis.connect();
          logInfo("redis.connected", { attempt });
          return true;
        } catch (error) {
          const message = (error as Error).message;
          logWarn("redis.connect_failed", {
            attempt,
            maxAttempts,
            error: message,
          });

          if (attempt < maxAttempts) {
            await sleep(Math.min(300 * attempt, 1200));
          }
        }
      }
      return false;
    })().finally(() => {
      redisConnectPromise = null;
    });
  }
  return await redisConnectPromise;
};
