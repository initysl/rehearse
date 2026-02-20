import { ensureSessionFeedback } from "../modules/feedback/feedback.service";
import { logError, logInfo, logWarn } from "../utils/logger";

type FeedbackJob = {
  sessionId: string;
  userId: string;
  attempt: number;
  enqueuedAt: number;
};

type FeedbackJobState =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

interface FeedbackJobStatus {
  state: FeedbackJobState;
  updatedAt: number;
  error?: string;
  attempts: number;
}

const queue: FeedbackJob[] = [];
const statusMap = new Map<string, FeedbackJobStatus>();
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;
const AUTO_PROCESS = process.env.NODE_ENV !== "test";

let isProcessing = false;

const getQueueKey = (sessionId: string): string => sessionId;

const setStatus = (
  sessionId: string,
  partial: Partial<FeedbackJobStatus> & { state: FeedbackJobState }
) => {
  const previous = statusMap.get(sessionId);
  statusMap.set(sessionId, {
    state: partial.state,
    updatedAt: Date.now(),
    attempts: partial.attempts ?? previous?.attempts ?? 0,
    error: partial.error,
  });
};

const requeueWithDelay = async (job: FeedbackJob): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  queue.push(job);
};

const processJob = async (job: FeedbackJob): Promise<void> => {
  setStatus(job.sessionId, { state: "processing", attempts: job.attempt });
  logInfo("feedback.queue.processing", {
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
    setStatus(job.sessionId, { state: "completed", attempts: job.attempt });
    logInfo("feedback.queue.completed", {
      sessionId: job.sessionId,
      userId: job.userId,
      attempts: job.attempt,
    });
  } catch (error) {
    const message = (error as Error).message;
    if (job.attempt >= MAX_ATTEMPTS) {
      setStatus(job.sessionId, {
        state: "failed",
        attempts: job.attempt,
        error: message,
      });
      logError("feedback.queue.failed", {
        sessionId: job.sessionId,
        userId: job.userId,
        attempts: job.attempt,
        error: message,
      });
      return;
    }

    logWarn("feedback.queue.retrying", {
      sessionId: job.sessionId,
      userId: job.userId,
      attempt: job.attempt,
      nextAttempt: job.attempt + 1,
      error: message,
    });

    await requeueWithDelay({
      ...job,
      attempt: job.attempt + 1,
      enqueuedAt: Date.now(),
    });
  }
};

const drainQueue = async (): Promise<void> => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) continue;
      await processJob(job);
    }
  } finally {
    isProcessing = false;
  }
};

export const enqueueFeedbackGeneration = (input: {
  sessionId: string;
  userId: string;
}): FeedbackJobStatus => {
  const key = getQueueKey(input.sessionId);
  const existing = statusMap.get(key);

  if (existing && (existing.state === "queued" || existing.state === "processing")) {
    return existing;
  }

  if (existing?.state === "completed") {
    return existing;
  }

  const job: FeedbackJob = {
    sessionId: input.sessionId,
    userId: input.userId,
    attempt: 1,
    enqueuedAt: Date.now(),
  };

  queue.push(job);
  setStatus(input.sessionId, { state: "queued", attempts: 0 });
  logInfo("feedback.queue.enqueued", {
    sessionId: input.sessionId,
    userId: input.userId,
  });

  if (AUTO_PROCESS) {
    void drainQueue();
  }

  return statusMap.get(input.sessionId)!;
};

export const getFeedbackJobStatus = (
  sessionId: string
): FeedbackJobStatus | null => {
  return statusMap.get(getQueueKey(sessionId)) || null;
};

export const processFeedbackQueueNow = async (): Promise<void> => {
  await drainQueue();
};
