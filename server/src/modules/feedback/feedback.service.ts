import { db } from "../../config/db";
import { buildCoachPrompt } from "../../ai/coach.prompt";
import { getGroqCompletion } from "../../ai/groq.service";
import { Message } from "../../types/global.types";
import { logError, logInfo, logWarn } from "../../utils/logger";
import {
  FeedbackDto,
  FeedbackGenerationResult,
  feedbackResultSchema,
} from "./feedback.types";

interface SessionFeedbackContextRow {
  session_id: string;
  user_id: string;
  scenario_id: string;
  session_status: "active" | "completed" | "abandoned";
  scenario_goal: string;
}

interface FeedbackRow {
  id: string;
  session_id: string;
  goal_achieved: boolean | null;
  confidence_score: number | null;
  full_feedback: unknown;
  generated_at: Date;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: Message["role"];
  content: string;
  token_count: number | null;
  created_at: Date;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableFeedbackError = (error: unknown): boolean => {
  const message = (error as Error)?.message?.toLowerCase?.() || "";
  return (
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("econn") ||
    message.includes("enotfound") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("deadlock")
  );
};

const runFeedbackStageWithRetry = async <T>(input: {
  stage: "context" | "transcript" | "generate" | "persist";
  sessionId: string;
  userId: string;
  operation: () => Promise<T>;
  retries?: number;
  retryDelayMs?: number;
}): Promise<T> => {
  const retries = input.retries ?? 1;
  const retryDelayMs = input.retryDelayMs ?? 400;
  let attempt = 0;

  while (true) {
    attempt += 1;
    logInfo("feedback.stage.begin", {
      stage: input.stage,
      sessionId: input.sessionId,
      userId: input.userId,
      attempt,
    });

    try {
      const result = await input.operation();
      logInfo("feedback.stage.success", {
        stage: input.stage,
        sessionId: input.sessionId,
        userId: input.userId,
        attempt,
      });
      return result;
    } catch (error) {
      logWarn("feedback.stage.failed", {
        stage: input.stage,
        sessionId: input.sessionId,
        userId: input.userId,
        attempt,
        retries,
        error: (error as Error).message,
      });

      if (attempt > retries || !isRetryableFeedbackError(error)) {
        throw error;
      }

      await sleep(retryDelayMs * attempt);
    }
  }
};

const mapFeedback = (row: FeedbackRow): FeedbackDto => {
  const parsed = feedbackResultSchema.parse(row.full_feedback);
  return {
    id: row.id,
    sessionId: row.session_id,
    goalAchieved: row.goal_achieved ?? parsed.goalAchieved,
    confidenceScore: row.confidence_score ?? parsed.confidenceScore,
    fullFeedback: parsed,
    generatedAt: row.generated_at,
  };
};

const createHttpError = (statusCode: number, message: string): Error => {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = statusCode;
  return err;
};

const getExistingFeedback = async (
  sessionId: string
): Promise<FeedbackDto | null> => {
  const result = await db.query<FeedbackRow>(
    `SELECT
      id,
      session_id,
      goal_achieved,
      confidence_score,
      full_feedback,
      generated_at
     FROM public.feedback
     WHERE session_id = $1
     ORDER BY generated_at DESC
     LIMIT 1`,
    [sessionId]
  );

  if (!result.rows[0]) return null;
  return mapFeedback(result.rows[0]);
};

export const getSessionFeedbackIfExists = async (input: {
  userId: string;
  sessionId: string;
}): Promise<FeedbackDto | null> => {
  const context = await getSessionContext(input.userId, input.sessionId);
  if (!context) {
    throw createHttpError(404, "Session not found");
  }

  return getExistingFeedback(input.sessionId);
};

const getSessionContext = async (
  userId: string,
  sessionId: string
): Promise<SessionFeedbackContextRow | null> => {
  const result = await db.query<SessionFeedbackContextRow>(
    `SELECT
      s.id AS session_id,
      s.user_id,
      s.scenario_id,
      s.status AS session_status,
      sc.description AS scenario_goal
     FROM public.sessions s
     JOIN public.scenarios sc ON sc.id = s.scenario_id
     WHERE s.id = $1
       AND s.user_id = $2
     LIMIT 1`,
    [sessionId, userId]
  );

  return result.rows[0] || null;
};

const getSessionTranscript = async (sessionId: string): Promise<Message[]> => {
  const result = await db.query<MessageRow>(
    `SELECT
      id,
      session_id,
      role,
      content,
      token_count,
      created_at
     FROM public.messages
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    tokenCount: row.token_count ?? undefined,
    createdAt: row.created_at,
  }));
};

const extractJsonObject = (raw: string): string => {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw createHttpError(502, "Coach model returned invalid JSON payload");
  }
  return raw.slice(start, end + 1);
};

const createFallbackFeedback = (reason: string) => ({
  goalAchieved: false,
  goalAnalysis: reason,
  communicationPatterns: {
    assertivenessScore: 5,
    clarityScore: 5,
    emotionalControlScore: 5,
    observations: ["Not enough transcript data to produce detailed coaching."],
  },
  keyMoments: [
    {
      userMessage: "No substantial conversation captured.",
      analysis: "A full coaching analysis needs at least one user message and one assistant reply.",
      alternative: "Complete a full practice round, then request feedback again.",
    },
  ],
  phrasesToTry: ["Could we restart and focus on one clear goal for this conversation?"],
  overallSummary: "Insufficient transcript for high-confidence feedback.",
  confidenceScore: 40,
});

const persistFeedback = async (input: {
  sessionId: string;
  scenarioId: string;
  userId: string;
  feedback: ReturnType<typeof feedbackResultSchema.parse>;
}): Promise<FeedbackDto> => {
  const client = await db.connect();
  try {
    logInfo("feedback.persist.begin", {
      sessionId: input.sessionId,
      userId: input.userId,
      scenarioId: input.scenarioId,
    });

    await client.query("BEGIN");
    const existingFeedback = await client.query<{ id: string }>(
      `SELECT id
       FROM public.feedback
       WHERE session_id = $1
       ORDER BY generated_at DESC
       LIMIT 1
       FOR UPDATE`,
      [input.sessionId]
    );

    let stored: { rows: FeedbackRow[] };
    if (existingFeedback.rows[0]) {
      stored = await client.query<FeedbackRow>(
        `UPDATE public.feedback
         SET
           goal_achieved = $2,
           confidence_score = $3,
           full_feedback = $4::jsonb,
           generated_at = NOW()
         WHERE id = $1
         RETURNING
           id,
           session_id,
           goal_achieved,
           confidence_score,
           full_feedback,
           generated_at`,
        [
          existingFeedback.rows[0].id,
          input.feedback.goalAchieved,
          input.feedback.confidenceScore,
          JSON.stringify(input.feedback),
        ]
      );
    } else {
      stored = await client.query<FeedbackRow>(
        `INSERT INTO public.feedback (
          session_id,
          goal_achieved,
          confidence_score,
          full_feedback
        )
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING
          id,
          session_id,
          goal_achieved,
          confidence_score,
          full_feedback,
          generated_at`,
        [
          input.sessionId,
          input.feedback.goalAchieved,
          input.feedback.confidenceScore,
          JSON.stringify(input.feedback),
        ]
      );
    }

    const completedCountResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM public.sessions
       WHERE user_id = $1
         AND scenario_id = $2
         AND status = 'completed'`,
      [input.userId, input.scenarioId]
    );

    const completedCount = Number(completedCountResult.rows[0]?.count || "1");

    const existingProgressSnapshot = await client.query<{ id: string }>(
      `SELECT id
       FROM public.progress_snapshots
       WHERE session_id = $1
       LIMIT 1
       FOR UPDATE`,
      [input.sessionId]
    );

    if (existingProgressSnapshot.rows[0]) {
      await client.query(
        `UPDATE public.progress_snapshots
         SET
           user_id = $2,
           scenario_id = $3,
           confidence_score = $4,
           session_count = $5,
           recorded_at = NOW()
         WHERE id = $1`,
        [
          existingProgressSnapshot.rows[0].id,
          input.userId,
          input.scenarioId,
          input.feedback.confidenceScore,
          completedCount,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO public.progress_snapshots (
          session_id,
          user_id,
          scenario_id,
          confidence_score,
          session_count
        )
        VALUES ($1, $2, $3, $4, $5)`,
        [
          input.sessionId,
          input.userId,
          input.scenarioId,
          input.feedback.confidenceScore,
          completedCount,
        ]
      );
    }

    await client.query("COMMIT");
    logInfo("feedback.persist.success", {
      sessionId: input.sessionId,
      userId: input.userId,
      confidenceScore: input.feedback.confidenceScore,
    });
    return mapFeedback(stored.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    logError("feedback.persist.failed", {
      sessionId: input.sessionId,
      userId: input.userId,
      error: (error as Error).message,
    });
    throw error;
  } finally {
    client.release();
  }
};

const generateFeedbackPayload = async (
  scenarioGoal: string,
  transcript: Message[]
): Promise<ReturnType<typeof feedbackResultSchema.parse>> => {
  if (transcript.length < 2) {
    return feedbackResultSchema.parse(
      createFallbackFeedback("Not enough transcript to evaluate outcomes reliably.")
    );
  }

  try {
    const prompt = buildCoachPrompt(scenarioGoal, transcript);
    const completion = await getGroqCompletion(prompt);
    const jsonString = extractJsonObject(completion);
    const parsed = JSON.parse(jsonString) as unknown;
    return feedbackResultSchema.parse(parsed);
  } catch (error) {
    logWarn("feedback.generate.fallback_used", {
      reason: (error as Error).message,
    });
    return feedbackResultSchema.parse(
      createFallbackFeedback("AI analysis failed. Returning safe fallback coaching output.")
    );
  }
};

export const ensureSessionFeedback = async (input: {
  userId: string;
  sessionId: string;
  allowAutoGenerate?: boolean;
}): Promise<FeedbackGenerationResult> => {
  logInfo("feedback.ensure.begin", {
    sessionId: input.sessionId,
    userId: input.userId,
    allowAutoGenerate: Boolean(input.allowAutoGenerate),
  });

  const context = await runFeedbackStageWithRetry({
    stage: "context",
    sessionId: input.sessionId,
    userId: input.userId,
    retries: 0,
    operation: () => getSessionContext(input.userId, input.sessionId),
  });
  if (!context) throw createHttpError(404, "Session not found");

  const existing = await getExistingFeedback(input.sessionId);
  if (existing) {
    logInfo("feedback.ensure.cached", {
      sessionId: input.sessionId,
      userId: input.userId,
    });
    return { feedback: existing, generatedNow: false };
  }

  if (!input.allowAutoGenerate) {
    throw createHttpError(404, "Feedback not found");
  }

  if (context.session_status !== "completed") {
    logWarn("feedback.ensure.rejected_non_completed", {
      sessionId: input.sessionId,
      userId: input.userId,
      status: context.session_status,
    });
    throw createHttpError(409, "Feedback is available only for completed sessions");
  }

  const transcript = await runFeedbackStageWithRetry({
    stage: "transcript",
    sessionId: input.sessionId,
    userId: input.userId,
    retries: 1,
    operation: () => getSessionTranscript(input.sessionId),
  });

  logInfo("feedback.transcript.loaded", {
    sessionId: input.sessionId,
    userId: input.userId,
    messageCount: transcript.length,
  });

  const payload = await runFeedbackStageWithRetry({
    stage: "generate",
    sessionId: input.sessionId,
    userId: input.userId,
    retries: 1,
    operation: () => generateFeedbackPayload(context.scenario_goal, transcript),
  });

  const feedback = await runFeedbackStageWithRetry({
    stage: "persist",
    sessionId: input.sessionId,
    userId: input.userId,
    retries: 2,
    operation: () =>
      persistFeedback({
        sessionId: context.session_id,
        scenarioId: context.scenario_id,
        userId: context.user_id,
        feedback: payload,
      }),
  });

  logInfo("feedback.ensure.generated", {
    sessionId: input.sessionId,
    userId: input.userId,
  });

  return { feedback, generatedNow: true };
};
