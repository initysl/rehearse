import { connectRedis, redis } from "../config/redis";
import { ensureSessionFeedback } from "../modules/feedback/feedback.service";
import { logError, logInfo, logWarn } from "../utils/logger";

type FeedbackJob = {
  sessionId: string;
  userId: string;
  attempt: number;
  enqueuedAt: number;
};

export type FeedbackJobState = "queued" | "processing" | "completed" | "failed";

export interface FeedbackJobStatus {
  state: FeedbackJobState;
  updatedAt: number;
  error?: string;
  attempts: number;
}

const isTestEnv = process.env.NODE_ENV === "test";

// In tests we keep the existing in-memory queue to avoid external Redis dependency.
const memoryQueue: FeedbackJob[] = [];
const memoryStatusMap = new Map<string, FeedbackJobStatus>();
const AUTO_PROCESS_MEMORY = !isTestEnv;
let isMemoryProcessing = false;

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;
const PROCESSING_TIMEOUT_MS = 60_000;
const STATUS_TTL_SECONDS = 7 * 24 * 60 * 60;

const REDIS_NAMESPACE = "feedback:queue";
const REDIS_PENDING_LIST = `${REDIS_NAMESPACE}:pending`;
const REDIS_DELAYED_ZSET = `${REDIS_NAMESPACE}:delayed`;
const REDIS_PROCESSING_ZSET = `${REDIS_NAMESPACE}:processing`;
const REDIS_ACTIVE_SET = `${REDIS_NAMESPACE}:active`;

let redisWorkerRunning = false;

const statusKey = (sessionId: string): string => `${REDIS_NAMESPACE}:status:${sessionId}`;
const jobKey = (sessionId: string): string => `${REDIS_NAMESPACE}:job:${sessionId}`;

const now = (): number => Date.now();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseIntSafe = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const setMemoryStatus = (
  sessionId: string,
  partial: Partial<FeedbackJobStatus> & { state: FeedbackJobState }
): FeedbackJobStatus => {
  const previous = memoryStatusMap.get(sessionId);
  const next: FeedbackJobStatus = {
    state: partial.state,
    updatedAt: now(),
    attempts: partial.attempts ?? previous?.attempts ?? 0,
    error: partial.error,
  };
  memoryStatusMap.set(sessionId, next);
  return next;
};

const requeueMemoryWithDelay = async (job: FeedbackJob): Promise<void> => {
  await sleep(RETRY_DELAY_MS);
  memoryQueue.push(job);
};

const processMemoryJob = async (job: FeedbackJob): Promise<void> => {
  setMemoryStatus(job.sessionId, { state: "processing", attempts: job.attempt });
  logInfo("feedback.queue.processing", {
    queueBackend: "memory",
    sessionId: job.sessionId,
    userId: job.userId,
    attempt: job.attempt,
  });

  try {
    await ensureSessionFeedback({
      sessionId: job.sessionId,
      userId: job.userId,
      allowAutoGenerate: true,
    });

    setMemoryStatus(job.sessionId, { state: "completed", attempts: job.attempt });
    logInfo("feedback.queue.completed", {
      queueBackend: "memory",
      sessionId: job.sessionId,
      userId: job.userId,
      attempts: job.attempt,
    });
  } catch (error) {
    const message = (error as Error).message;

    if (job.attempt >= MAX_ATTEMPTS) {
      setMemoryStatus(job.sessionId, {
        state: "failed",
        attempts: job.attempt,
        error: message,
      });
      logError("feedback.queue.failed", {
        queueBackend: "memory",
        sessionId: job.sessionId,
        userId: job.userId,
        attempts: job.attempt,
        error: message,
      });
      return;
    }

    logWarn("feedback.queue.retrying", {
      queueBackend: "memory",
      sessionId: job.sessionId,
      userId: job.userId,
      attempt: job.attempt,
      nextAttempt: job.attempt + 1,
      error: message,
    });

    await requeueMemoryWithDelay({
      ...job,
      attempt: job.attempt + 1,
      enqueuedAt: now(),
    });
  }
};

const drainMemoryQueue = async (): Promise<void> => {
  if (isMemoryProcessing) return;
  isMemoryProcessing = true;

  try {
    while (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (!job) continue;
      await processMemoryJob(job);
    }
  } finally {
    isMemoryProcessing = false;
  }
};

const getRedisStatus = async (sessionId: string): Promise<FeedbackJobStatus | null> => {
  const raw = await redis.hGetAll(statusKey(sessionId));
  if (Object.keys(raw).length === 0) return null;

  const state = raw.state as FeedbackJobState | undefined;
  if (!state || !["queued", "processing", "completed", "failed"].includes(state)) {
    return null;
  }

  return {
    state,
    updatedAt: parseIntSafe(raw.updatedAt, now()),
    attempts: parseIntSafe(raw.attempts, 0),
    error: raw.error || undefined,
  };
};

const setRedisStatus = async (
  sessionId: string,
  status: FeedbackJobStatus
): Promise<FeedbackJobStatus> => {
  await redis.hSet(statusKey(sessionId), {
    state: status.state,
    updatedAt: String(status.updatedAt),
    attempts: String(status.attempts),
    ...(status.error ? { error: status.error } : {}),
  });

  if (!status.error) {
    await redis.hDel(statusKey(sessionId), "error");
  }

  await redis.expire(statusKey(sessionId), STATUS_TTL_SECONDS);
  return status;
};

const getRedisJob = async (sessionId: string): Promise<FeedbackJob | null> => {
  const raw = await redis.hGetAll(jobKey(sessionId));
  if (Object.keys(raw).length === 0 || !raw.userId) return null;

  return {
    sessionId,
    userId: raw.userId,
    attempt: parseIntSafe(raw.attempt, 1),
    enqueuedAt: parseIntSafe(raw.enqueuedAt, now()),
  };
};

const saveRedisJob = async (job: FeedbackJob): Promise<void> => {
  await redis.hSet(jobKey(job.sessionId), {
    userId: job.userId,
    attempt: String(job.attempt),
    enqueuedAt: String(job.enqueuedAt),
  });
};

const cleanupRedisJob = async (sessionId: string): Promise<void> => {
  await redis.zRem(REDIS_PROCESSING_ZSET, sessionId);
  await redis.zRem(REDIS_DELAYED_ZSET, sessionId);
  await redis.sRem(REDIS_ACTIVE_SET, sessionId);
  await redis.del(jobKey(sessionId));
};

const moveDueDelayedJobs = async (): Promise<void> => {
  const dueSessionIds = await redis.zRangeByScore(REDIS_DELAYED_ZSET, 0, now());

  for (const sessionId of dueSessionIds) {
    const removed = await redis.zRem(REDIS_DELAYED_ZSET, sessionId);
    if (!removed) continue;

    await redis.lPush(REDIS_PENDING_LIST, sessionId);

    const job = await getRedisJob(sessionId);
    await setRedisStatus(sessionId, {
      state: "queued",
      updatedAt: now(),
      attempts: job ? Math.max(job.attempt - 1, 0) : 0,
    });
  }
};

const reclaimStaleProcessingJobs = async (): Promise<void> => {
  const staleThreshold = now() - PROCESSING_TIMEOUT_MS;
  const staleSessionIds = await redis.zRangeByScore(REDIS_PROCESSING_ZSET, 0, staleThreshold);

  for (const sessionId of staleSessionIds) {
    const removed = await redis.zRem(REDIS_PROCESSING_ZSET, sessionId);
    if (!removed) continue;

    const job = await getRedisJob(sessionId);
    if (!job) {
      await setRedisStatus(sessionId, {
        state: "failed",
        updatedAt: now(),
        attempts: 0,
        error: "Job payload missing while reclaiming stale processing task",
      });
      await cleanupRedisJob(sessionId);
      continue;
    }

    if (job.attempt >= MAX_ATTEMPTS) {
      await setRedisStatus(sessionId, {
        state: "failed",
        updatedAt: now(),
        attempts: job.attempt,
        error: "Feedback generation timed out repeatedly",
      });
      await cleanupRedisJob(sessionId);
      continue;
    }

    const nextAttempt = job.attempt + 1;
    await saveRedisJob({ ...job, attempt: nextAttempt, enqueuedAt: now() });
    await redis.zAdd(REDIS_DELAYED_ZSET, {
      value: sessionId,
      score: now() + RETRY_DELAY_MS,
    });

    await setRedisStatus(sessionId, {
      state: "queued",
      updatedAt: now(),
      attempts: job.attempt,
      error: "Previous processing attempt timed out; retry queued",
    });

    logWarn("feedback.queue.reclaimed_stale", {
      queueBackend: "redis",
      sessionId,
      previousAttempt: job.attempt,
      nextAttempt,
    });
  }
};

const popNextSessionId = async (blocking: boolean): Promise<string | null> => {
  if (blocking) {
    const popped = await redis.brPop(REDIS_PENDING_LIST, 1);
    return popped?.element || null;
  }

  return redis.rPop(REDIS_PENDING_LIST);
};

const processNextRedisJob = async (blocking: boolean): Promise<boolean> => {
  const sessionId = await popNextSessionId(blocking);
  if (!sessionId) return false;

  const job = await getRedisJob(sessionId);
  if (!job) {
    await setRedisStatus(sessionId, {
      state: "failed",
      updatedAt: now(),
      attempts: 0,
      error: "Queued job payload missing",
    });
    await cleanupRedisJob(sessionId);
    return true;
  }

  await redis.zAdd(REDIS_PROCESSING_ZSET, { value: sessionId, score: now() });

  await setRedisStatus(sessionId, {
    state: "processing",
    updatedAt: now(),
    attempts: job.attempt,
  });

  logInfo("feedback.queue.processing", {
    queueBackend: "redis",
    sessionId: job.sessionId,
    userId: job.userId,
    attempt: job.attempt,
  });

  try {
    await ensureSessionFeedback({
      sessionId: job.sessionId,
      userId: job.userId,
      allowAutoGenerate: true,
    });

    await setRedisStatus(job.sessionId, {
      state: "completed",
      updatedAt: now(),
      attempts: job.attempt,
    });
    await cleanupRedisJob(job.sessionId);

    logInfo("feedback.queue.completed", {
      queueBackend: "redis",
      sessionId: job.sessionId,
      userId: job.userId,
      attempts: job.attempt,
    });
  } catch (error) {
    const message = (error as Error).message;

    if (job.attempt >= MAX_ATTEMPTS) {
      await setRedisStatus(job.sessionId, {
        state: "failed",
        updatedAt: now(),
        attempts: job.attempt,
        error: message,
      });
      await cleanupRedisJob(job.sessionId);

      logError("feedback.queue.failed", {
        queueBackend: "redis",
        sessionId: job.sessionId,
        userId: job.userId,
        attempts: job.attempt,
        error: message,
      });
    } else {
      const nextAttempt = job.attempt + 1;

      await redis.zRem(REDIS_PROCESSING_ZSET, job.sessionId);
      await saveRedisJob({ ...job, attempt: nextAttempt, enqueuedAt: now() });
      await redis.zAdd(REDIS_DELAYED_ZSET, {
        value: job.sessionId,
        score: now() + RETRY_DELAY_MS,
      });

      await setRedisStatus(job.sessionId, {
        state: "queued",
        updatedAt: now(),
        attempts: job.attempt,
        error: message,
      });

      logWarn("feedback.queue.retrying", {
        queueBackend: "redis",
        sessionId: job.sessionId,
        userId: job.userId,
        attempt: job.attempt,
        nextAttempt,
        error: message,
      });
    }
  }

  return true;
};

const runRedisWorkerLoop = async (): Promise<void> => {
  while (redisWorkerRunning) {
    try {
      await connectRedis();
      await moveDueDelayedJobs();
      await reclaimStaleProcessingJobs();
      await processNextRedisJob(true);
    } catch (error) {
      logError("feedback.queue.worker.loop_error", {
        queueBackend: "redis",
        error: (error as Error).message,
      });
      await sleep(1000);
    }
  }
};

export const startFeedbackQueueWorker = (): void => {
  if (isTestEnv || redisWorkerRunning) return;

  redisWorkerRunning = true;
  logInfo("feedback.queue.worker.started", { queueBackend: "redis" });
  void runRedisWorkerLoop();
};

export const enqueueFeedbackGeneration = async (input: {
  sessionId: string;
  userId: string;
}): Promise<FeedbackJobStatus> => {
  if (isTestEnv) {
    const existing = memoryStatusMap.get(input.sessionId);

    if (existing && (existing.state === "queued" || existing.state === "processing")) {
      return existing;
    }

    if (existing?.state === "completed") {
      return existing;
    }

    memoryQueue.push({
      sessionId: input.sessionId,
      userId: input.userId,
      attempt: 1,
      enqueuedAt: now(),
    });

    const queuedStatus = setMemoryStatus(input.sessionId, {
      state: "queued",
      attempts: 0,
    });

    logInfo("feedback.queue.enqueued", {
      queueBackend: "memory",
      sessionId: input.sessionId,
      userId: input.userId,
    });

    if (AUTO_PROCESS_MEMORY) {
      void drainMemoryQueue();
    }

    return queuedStatus;
  }

  await connectRedis();

  const existing = await getRedisStatus(input.sessionId);
  if (existing && (existing.state === "queued" || existing.state === "processing")) {
    return existing;
  }

  if (existing?.state === "completed") {
    return existing;
  }

  const added = await redis.sAdd(REDIS_ACTIVE_SET, input.sessionId);
  if (added === 0) {
    return (
      (await getRedisStatus(input.sessionId)) || {
        state: "queued",
        updatedAt: now(),
        attempts: 0,
      }
    );
  }

  await saveRedisJob({
    sessionId: input.sessionId,
    userId: input.userId,
    attempt: 1,
    enqueuedAt: now(),
  });

  await redis.lPush(REDIS_PENDING_LIST, input.sessionId);

  await setRedisStatus(input.sessionId, {
    state: "queued",
    updatedAt: now(),
    attempts: 0,
  });

  logInfo("feedback.queue.enqueued", {
    queueBackend: "redis",
    sessionId: input.sessionId,
    userId: input.userId,
  });

  return (
    (await getRedisStatus(input.sessionId)) || {
      state: "queued",
      updatedAt: now(),
      attempts: 0,
    }
  );
};

export const getFeedbackJobStatus = async (
  sessionId: string
): Promise<FeedbackJobStatus | null> => {
  if (isTestEnv) {
    return memoryStatusMap.get(sessionId) || null;
  }

  await connectRedis();
  return getRedisStatus(sessionId);
};

export const processFeedbackQueueNow = async (): Promise<void> => {
  if (isTestEnv) {
    await drainMemoryQueue();
    return;
  }

  await connectRedis();
  await moveDueDelayedJobs();
  await reclaimStaleProcessingJobs();

  let processed = 0;
  while (await processNextRedisJob(false)) {
    processed += 1;
    if (processed >= 200) {
      logWarn("feedback.queue.process_now.truncated", {
        queueBackend: "redis",
        processed,
      });
      break;
    }
  }
};
