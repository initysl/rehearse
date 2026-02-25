import { Request } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { env } from "../config/env";
import { connectRedis, redis } from "../config/redis";
import { logWarn } from "../utils/logger";

const createRedisStore = (prefix: string) =>
  new RedisStore({
    prefix,
    sendCommand: async (...args: string[]) => {
      if (!redis.isOpen) {
        await connectRedis();
      }
      const response = await (redis as unknown as {
        sendCommand: (command: string[]) => Promise<unknown>;
      }).sendCommand(args);
      return response as string | number | boolean | Array<string | number | boolean>;
    },
  });

const userAwareKeyGenerator = (req: Request): string => {
  if (req.user?.userId) return `user:${req.user.userId}`;
  return `ip:${req.ip || "unknown"}`;
};

const isTestEnv = process.env.NODE_ENV === "test";
const shouldUseRedisStore = !isTestEnv && env.RATE_LIMIT_REDIS_ENABLED;

if (!shouldUseRedisStore) {
  logWarn("ratelimit.redis.disabled", {
    reason: "RATE_LIMIT_REDIS_ENABLED is false or test environment",
  });
}

export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { error: "Too many requests — limit is 50 AI messages per hour" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  store: shouldUseRedisStore ? createRedisStore("rl:ai:") : undefined,
  passOnStoreError: true,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many auth attempts — try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  store: shouldUseRedisStore ? createRedisStore("rl:auth:") : undefined,
  passOnStoreError: true,
});
