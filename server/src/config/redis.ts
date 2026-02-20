import { createClient } from "redis";
import { env } from "./env";

export const redis = createClient({ url: env.REDIS_URL });
let redisConnectPromise: Promise<void> | null = null;

redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("✅  Redis connected"));

export const connectRedis = async () => {
  if (redis.isOpen) return;
  if (!redisConnectPromise) {
    redisConnectPromise = redis
      .connect()
      .then(() => undefined)
      .finally(() => {
        redisConnectPromise = null;
      });
  }
  await redisConnectPromise;
};
