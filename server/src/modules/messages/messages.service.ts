import { db } from "../../config/db";
import { redis } from "../../config/redis";
import { buildCharacterPrompt, buildMessages } from "../../ai/character.prompt";
import { manageContext } from "../../ai/context.manager";
import { streamGroqResponse } from "../../ai/groq.service";
import { Message, Scenario } from "../../types/global.types";
import { logError, logInfo, logWarn } from "../../utils/logger";
import { SendSessionMessageInput } from "./messages.types";

interface SessionContextRow {
  session_id: string;
  user_id: string;
  scenario_id: string;
  difficulty_level: "cooperative" | "neutral" | "resistant" | "hostile";
  custom_context: string | null;
  status: "active" | "completed" | "abandoned";
  scenario_title: string;
  scenario_category: Scenario["category"];
  scenario_description: string;
  character_profile: Scenario["characterProfile"];
  difficulty_variants: Scenario["difficultyVariants"];
  scenario_is_custom: boolean;
  scenario_created_by: string | null;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: Message["role"];
  content: string;
  token_count: number | null;
  created_at: Date;
}

interface StreamSessionMessageInput {
  userId: string;
  sessionId: string;
  payload: SendSessionMessageInput;
  response: import("express").Response;
}

const HISTORY_CACHE_TTL_SECONDS = 60 * 60 * 12;
const HISTORY_CACHE_MAX_MESSAGES = 120;

const historyCacheKey = (sessionId: string): string =>
  `rehearse:session:${sessionId}:messages`;

const toMessage = (row: MessageRow): Message => ({
  id: row.id,
  sessionId: row.session_id,
  role: row.role,
  content: row.content,
  tokenCount: row.token_count ?? undefined,
  createdAt: row.created_at,
});

const tokenEstimate = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.3));
};

const toScenario = (row: SessionContextRow): Scenario => ({
  id: row.scenario_id,
  title: row.scenario_title,
  category: row.scenario_category,
  description: row.scenario_description,
  characterProfile: row.character_profile,
  difficultyVariants: row.difficulty_variants,
  isCustom: row.scenario_is_custom,
  createdBy: row.scenario_created_by || undefined,
});

const mapCachedHistory = (raw: string): Message[] => {
  const parsed = JSON.parse(raw) as Array<{
    id: string;
    sessionId: string;
    role: Message["role"];
    content: string;
    tokenCount?: number;
    createdAt: string;
  }>;

  return parsed.map((item) => ({
    id: item.id,
    sessionId: item.sessionId,
    role: item.role,
    content: item.content,
    tokenCount: item.tokenCount,
    createdAt: new Date(item.createdAt),
  }));
};

const readHistoryFromCache = async (sessionId: string): Promise<Message[] | null> => {
  try {
    const raw = await redis.get(historyCacheKey(sessionId));
    if (!raw) return null;
    return mapCachedHistory(raw);
  } catch (error) {
    logWarn("messages.cache.read_failed", {
      sessionId,
      error: (error as Error).message,
    });
    return null;
  }
};

const writeHistoryToCache = async (
  sessionId: string,
  history: Message[]
): Promise<void> => {
  const trimmed = history.slice(-HISTORY_CACHE_MAX_MESSAGES);
  try {
    await redis.set(
      historyCacheKey(sessionId),
      JSON.stringify(
        trimmed.map((item) => ({
          id: item.id,
          sessionId: item.sessionId,
          role: item.role,
          content: item.content,
          tokenCount: item.tokenCount,
          createdAt: item.createdAt.toISOString(),
        }))
      ),
      { EX: HISTORY_CACHE_TTL_SECONDS }
    );
  } catch (error) {
    logWarn("messages.cache.write_failed", {
      sessionId,
      error: (error as Error).message,
    });
  }
};

const getSessionContext = async (
  userId: string,
  sessionId: string
): Promise<SessionContextRow | null> => {
  const result = await db.query<SessionContextRow>(
    `SELECT
      s.id AS session_id,
      s.user_id,
      s.scenario_id,
      s.difficulty_level,
      s.custom_context,
      s.status,
      sc.title AS scenario_title,
      sc.category AS scenario_category,
      sc.description AS scenario_description,
      sc.character_profile,
      sc.difficulty_variants,
      sc.is_custom AS scenario_is_custom,
      sc.created_by AS scenario_created_by
     FROM public.sessions s
     JOIN public.scenarios sc ON sc.id = s.scenario_id
     WHERE s.id = $1
       AND s.user_id = $2
     LIMIT 1`,
    [sessionId, userId]
  );

  return result.rows[0] || null;
};

const insertMessage = async (
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<Message> => {
  const result = await db.query<MessageRow>(
    `INSERT INTO public.messages (
      session_id,
      role,
      content,
      token_count
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      session_id,
      role,
      content,
      token_count,
      created_at`,
    [sessionId, role, content, tokenEstimate(content)]
  );

  return toMessage(result.rows[0]);
};

const getHistoryFromDatabase = async (sessionId: string): Promise<Message[]> => {
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

  return result.rows.map(toMessage);
};

const createHttpError = (statusCode: number, message: string): Error => {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = statusCode;
  return err;
};

export const streamSessionMessage = async ({
  userId,
  sessionId,
  payload,
  response,
}: StreamSessionMessageInput): Promise<void> => {
  logInfo("messages.stream.begin", {
    sessionId,
    userId,
    contentLength: payload.content.length,
  });

  const context = await getSessionContext(userId, sessionId);
  if (!context) {
    logWarn("messages.stream.session_not_found", { sessionId, userId });
    throw createHttpError(404, "Session not found");
  }

  if (context.status !== "active") {
    logWarn("messages.stream.session_inactive", {
      sessionId,
      userId,
      status: context.status,
    });
    throw createHttpError(409, "Session is not active");
  }

  const userMessage = await insertMessage(sessionId, "user", payload.content);
  const cachedHistory = await readHistoryFromCache(sessionId);

  const history = cachedHistory
    ? [...cachedHistory, userMessage]
    : await getHistoryFromDatabase(sessionId);

  const promptHistory = manageContext(history);
  const scenario = toScenario(context);
  const systemPrompt = buildCharacterPrompt(
    scenario,
    context.difficulty_level,
    context.custom_context || undefined
  );
  const llmMessages = buildMessages(systemPrompt, promptHistory);

  let assistantContent = "";
  try {
    assistantContent = await streamGroqResponse(llmMessages, response);
  } catch (error) {
    logError("messages.stream.model_failed", {
      sessionId,
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
  const assistantMessage = await insertMessage(sessionId, "assistant", assistantContent);

  await writeHistoryToCache(sessionId, [...history, assistantMessage]);
  logInfo("messages.stream.success", {
    sessionId,
    userId,
    assistantContentLength: assistantContent.length,
  });
};
