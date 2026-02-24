import { env } from "../config/env";
import { connectRedis, redis } from "../config/redis";
import { logWarn } from "../utils/logger";

type QuotaMetric = "rpm" | "rpd" | "tpm" | "tpd" | "ash" | "asd";

type ModelQuotaProfile = Partial<Record<QuotaMetric, number>>;

type ConsumeGroqQuotaInput = {
  model: string;
  increments: Partial<Record<QuotaMetric, number>>;
  context?: Record<string, unknown>;
};

interface QuotaCheck {
  metric: QuotaMetric;
  key: string;
  increment: number;
  limit: number;
  ttlSeconds: number;
}

const MODEL_LIMITS: Record<string, ModelQuotaProfile> = {
  "llama-3.3-70b-versatile": {
    rpm: 30,
    rpd: 1000,
    tpm: 12000,
    tpd: 100000,
  },
  "canopylabs/orpheus-v1-english": {
    rpm: 10,
    rpd: 100,
    tpm: 1200,
    tpd: 3600,
  },
  "whisper-large-v3": {
    rpm: 20,
    rpd: 2000,
    ash: 7200,
    asd: 28800,
  },
  "whisper-large-v3-turbo": {
    rpm: 20,
    rpd: 2000,
    ash: 7200,
    asd: 28800,
  },
};

const QUOTA_LUA_SCRIPT = `
for i=1,#KEYS do
  local argBase = (i - 1) * 3
  local increment = tonumber(ARGV[argBase + 1])
  local limit = tonumber(ARGV[argBase + 2])
  local current = tonumber(redis.call("GET", KEYS[i]) or "0")
  if current + increment > limit then
    local ttl = redis.call("TTL", KEYS[i])
    return {0, KEYS[i], tostring(current), tostring(limit), tostring(increment), tostring(ttl)}
  end
end

for i=1,#KEYS do
  local argBase = (i - 1) * 3
  local increment = tonumber(ARGV[argBase + 1])
  local ttlSeconds = tonumber(ARGV[argBase + 3])
  redis.call("INCRBYFLOAT", KEYS[i], increment)
  local ttl = redis.call("TTL", KEYS[i])
  if ttl < 0 then
    redis.call("EXPIRE", KEYS[i], ttlSeconds)
  end
end

return {1}
`;

const pad = (value: number): string => value.toString().padStart(2, "0");

const safeModelKey = (model: string): string =>
  model.replace(/[^a-zA-Z0-9._-]/g, "_");

const formatUtcDayBucket = (now: Date): string =>
  `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;

const formatUtcHourBucket = (now: Date): string =>
  `${formatUtcDayBucket(now)}${pad(now.getUTCHours())}`;

const formatUtcMinuteBucket = (now: Date): string =>
  `${formatUtcHourBucket(now)}${pad(now.getUTCMinutes())}`;

const secondsUntilNextMinute = (now: Date): number => {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes() + 1,
      0,
      0
    )
  );
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
};

const secondsUntilNextHour = (now: Date): number => {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours() + 1,
      0,
      0,
      0
    )
  );
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
};

const secondsUntilNextDay = (now: Date): number => {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
};

const metricKeyAndTtl = (
  model: string,
  metric: QuotaMetric,
  now: Date
): { key: string; ttlSeconds: number } => {
  const modelKey = safeModelKey(model);

  if (metric === "rpm" || metric === "tpm") {
    return {
      key: `quota:groq:${modelKey}:${metric}:${formatUtcMinuteBucket(now)}`,
      ttlSeconds: secondsUntilNextMinute(now),
    };
  }

  if (metric === "ash") {
    return {
      key: `quota:groq:${modelKey}:${metric}:${formatUtcHourBucket(now)}`,
      ttlSeconds: secondsUntilNextHour(now),
    };
  }

  return {
    key: `quota:groq:${modelKey}:${metric}:${formatUtcDayBucket(now)}`,
    ttlSeconds: secondsUntilNextDay(now),
  };
};

const isFloatMetric = (metric: QuotaMetric): boolean =>
  metric === "ash" || metric === "asd";

const applyHeadroom = (metric: QuotaMetric, limit: number): number => {
  const adjusted = (limit * env.GROQ_QUOTA_HEADROOM_PERCENT) / 100;
  if (isFloatMetric(metric)) return Number(adjusted.toFixed(2));
  return Math.max(1, Math.floor(adjusted));
};

export class GroqQuotaExceededError extends Error {
  statusCode = 429;
  retryAfterSeconds: number;
  model: string;
  metric: QuotaMetric;
  limit: number;
  current: number;
  increment: number;

  constructor(input: {
    model: string;
    metric: QuotaMetric;
    limit: number;
    current: number;
    increment: number;
    retryAfterSeconds: number;
  }) {
    super(
      `Groq ${input.metric.toUpperCase()} limit reached for model ${input.model}. Retry in about ${Math.max(
        1,
        input.retryAfterSeconds
      )}s.`
    );
    this.name = "GroqQuotaExceededError";
    this.model = input.model;
    this.metric = input.metric;
    this.limit = input.limit;
    this.current = input.current;
    this.increment = input.increment;
    this.retryAfterSeconds = input.retryAfterSeconds;
  }
}

const modelProfile = (model: string): ModelQuotaProfile | null =>
  MODEL_LIMITS[model] || null;

const toQuotaChecks = (
  model: string,
  increments: Partial<Record<QuotaMetric, number>>
): QuotaCheck[] => {
  const profile = modelProfile(model);
  if (!profile) return [];

  const now = new Date();
  const checks: QuotaCheck[] = [];

  const metrics: QuotaMetric[] = ["rpm", "rpd", "tpm", "tpd", "ash", "asd"];
  for (const metric of metrics) {
    const increment = Number(increments[metric] || 0);
    if (!increment || increment <= 0) continue;

    const baseLimit = profile[metric];
    if (!baseLimit || baseLimit <= 0) continue;

    const effectiveLimit = applyHeadroom(metric, baseLimit);
    const { key, ttlSeconds } = metricKeyAndTtl(model, metric, now);
    checks.push({
      metric,
      key,
      increment: isFloatMetric(metric) ? Number(increment.toFixed(2)) : Math.ceil(increment),
      limit: effectiveLimit,
      ttlSeconds,
    });
  }

  return checks;
};

const runQuotaScript = async (checks: QuotaCheck[], model: string): Promise<void> => {
  const keys = checks.map((check) => check.key);
  const args = checks.flatMap((check) => [
    check.increment.toString(),
    check.limit.toString(),
    check.ttlSeconds.toString(),
  ]);

  const evalResult = (await (
    redis as unknown as {
      eval: (
        script: string,
        options: { keys: string[]; arguments: string[] }
      ) => Promise<unknown>;
    }
  ).eval(QUOTA_LUA_SCRIPT, { keys, arguments: args })) as unknown;

  if (!Array.isArray(evalResult)) return;
  const successFlag = Number(evalResult[0]);
  if (successFlag === 1) return;

  const failedKey = String(evalResult[1] || "");
  const current = Number(evalResult[2] || "0");
  const limit = Number(evalResult[3] || "0");
  const increment = Number(evalResult[4] || "0");
  const ttl = Number(evalResult[5] || "1");

  const failedIndex = checks.findIndex((check) => check.key === failedKey);
  const failedMetric: QuotaMetric =
    failedIndex >= 0 ? checks[failedIndex].metric : "rpm";
  throw new GroqQuotaExceededError({
    model,
    metric: failedMetric,
    limit,
    current,
    increment,
    retryAfterSeconds: ttl > 0 ? ttl : 1,
  });
};

export const consumeGroqQuota = async ({
  model,
  increments,
  context = {},
}: ConsumeGroqQuotaInput): Promise<void> => {
  if (!env.GROQ_QUOTA_ENABLED) return;

  const checks = toQuotaChecks(model, increments);
  if (!checks.length) return;

  try {
    if (!redis.isOpen) {
      await connectRedis();
    }
    await runQuotaScript(checks, model);
  } catch (error) {
    if (error instanceof GroqQuotaExceededError) {
      logWarn("groq.quota.exceeded", {
        model,
        metric: error.metric,
        limit: error.limit,
        current: error.current,
        increment: error.increment,
        retryAfterSeconds: error.retryAfterSeconds,
        ...context,
      });
      throw error;
    }

    if (env.GROQ_QUOTA_FAIL_OPEN) {
      logWarn("groq.quota.fail_open", {
        model,
        error: (error as Error).message,
        ...context,
      });
      return;
    }

    throw error;
  }
};

export const estimateTextTokens = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.3));
};

export const estimateMessagesTokens = (
  messages: Array<{ content: string }>
): number =>
  messages.reduce((sum, message) => sum + estimateTextTokens(message.content), 0);

export const estimateAudioSeconds = (
  audioBytes: number,
  mimeType?: string
): number => {
  const normalized = (mimeType || "").toLowerCase();
  const toSeconds = (bytesPerSecond: number): number =>
    Math.max(0.1, Number((audioBytes / bytesPerSecond).toFixed(2)));

  // Typical 128kbps encoded streams.
  if (normalized.includes("mpeg") || normalized.includes("mp3") || normalized.includes("mp4")) {
    return toSeconds(16000);
  }

  // Typical browser opus uploads.
  if (normalized.includes("webm") || normalized.includes("ogg")) {
    return toSeconds(env.GROQ_AUDIO_BYTES_PER_SECOND_ESTIMATE);
  }

  return toSeconds(env.GROQ_AUDIO_BYTES_PER_SECOND_ESTIMATE);
};
