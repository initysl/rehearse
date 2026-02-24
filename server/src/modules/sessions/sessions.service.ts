import { db } from "../../config/db";
import {
  ClearSessionHistoryQuery,
  EndSessionInput,
  SessionDetail,
  SessionDto,
  SessionHistoryItem,
  SessionHistoryQuery,
  StartSessionInput,
} from "./sessions.types";
import { Message } from "../../types/global.types";

interface SessionRow {
  id: string;
  user_id: string;
  scenario_id: string;
  custom_context: string | null;
  difficulty_level: SessionDto["difficultyLevel"];
  status: SessionDto["status"];
  started_at: Date;
  ended_at: Date | null;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: Message["role"];
  content: string;
  token_count: number | null;
  created_at: Date;
}

interface SessionHistoryRow extends SessionRow {
  scenario_title: string;
  scenario_category: string;
  message_count: string;
}

const mapSession = (row: SessionRow): SessionDto => ({
  id: row.id,
  userId: row.user_id,
  scenarioId: row.scenario_id,
  customContext: row.custom_context,
  difficultyLevel: row.difficulty_level,
  status: row.status,
  startedAt: row.started_at,
  endedAt: row.ended_at,
});

const mapMessage = (row: MessageRow): Message => ({
  id: row.id,
  sessionId: row.session_id,
  role: row.role,
  content: row.content,
  tokenCount: row.token_count ?? undefined,
  createdAt: row.created_at,
});

const getSessionRowById = async (
  userId: string,
  sessionId: string
): Promise<SessionRow | null> => {
  const result = await db.query<SessionRow>(
    `SELECT
      id,
      user_id,
      scenario_id,
      custom_context,
      difficulty_level,
      status,
      started_at,
      ended_at
     FROM public.sessions
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [sessionId, userId]
  );

  return result.rows[0] || null;
};

export const startSession = async (
  userId: string,
  payload: StartSessionInput
): Promise<SessionDto | null> => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const scenario = await client.query<{ id: string }>(
      `SELECT id
       FROM public.scenarios
       WHERE id = $1
         AND (is_custom = FALSE OR created_by = $2)
       LIMIT 1`,
      [payload.scenarioId, userId]
    );

    if (!scenario.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    const session = await client.query<SessionRow>(
      `INSERT INTO public.sessions (
        user_id,
        scenario_id,
        custom_context,
        difficulty_level,
        status
      )
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING
        id,
        user_id,
        scenario_id,
        custom_context,
        difficulty_level,
        status,
        started_at,
        ended_at`,
      [userId, payload.scenarioId, payload.customContext || null, payload.difficultyLevel]
    );

    await client.query(
      `UPDATE public.scenarios
       SET play_count = play_count + 1
       WHERE id = $1`,
      [payload.scenarioId]
    );

    await client.query("COMMIT");
    return mapSession(session.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getSessionDetailById = async (
  userId: string,
  sessionId: string
): Promise<SessionDetail | null> => {
  const sessionRow = await getSessionRowById(userId, sessionId);
  if (!sessionRow) return null;

  const messagesResult = await db.query<MessageRow>(
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

  return {
    session: mapSession(sessionRow),
    messages: messagesResult.rows.map(mapMessage),
  };
};

export const getSessionHistory = async (
  userId: string,
  query: SessionHistoryQuery
): Promise<SessionHistoryItem[]> => {
  const params: unknown[] = [userId];
  const whereConditions = ["s.user_id = $1"];

  if (query.status) {
    params.push(query.status);
    whereConditions.push(`s.status = $${params.length}`);
  }

  params.push(query.limit, query.offset);
  const limitParam = `$${params.length - 1}`;
  const offsetParam = `$${params.length}`;

  const result = await db.query<SessionHistoryRow>(
    `SELECT
      s.id,
      s.user_id,
      s.scenario_id,
      s.custom_context,
      s.difficulty_level,
      s.status,
      s.started_at,
      s.ended_at,
      sc.title AS scenario_title,
      sc.category AS scenario_category,
      COUNT(m.id) AS message_count
     FROM public.sessions s
     JOIN public.scenarios sc ON sc.id = s.scenario_id
     LEFT JOIN public.messages m ON m.session_id = s.id
     WHERE ${whereConditions.join(" AND ")}
     GROUP BY s.id, sc.title, sc.category
     ORDER BY s.started_at DESC
     LIMIT ${limitParam}
     OFFSET ${offsetParam}`,
    params
  );

  return result.rows.map((row) => ({
    ...mapSession(row),
    scenarioTitle: row.scenario_title,
    scenarioCategory: row.scenario_category,
    messageCount: Number(row.message_count),
  }));
};

export const clearSessionHistory = async (
  userId: string,
  query: ClearSessionHistoryQuery
): Promise<number> => {
  const scopeCondition =
    query.scope === "all"
      ? "TRUE"
      : query.scope === "completed"
        ? "s.status = 'completed'"
        : query.scope === "abandoned"
          ? "s.status = 'abandoned'"
          : "s.status IN ('completed', 'abandoned')";

  const result = await db.query<{ deleted_count: string }>(
    `WITH target AS (
       SELECT s.id
       FROM public.sessions s
       WHERE s.user_id = $1
         AND ${scopeCondition}
       ORDER BY s.started_at DESC
       LIMIT $2
     ),
     deleted AS (
       DELETE FROM public.sessions s
       USING target t
       WHERE s.id = t.id
       RETURNING s.id
     )
     SELECT COUNT(*)::text AS deleted_count
     FROM deleted`,
    [userId, query.limit]
  );

  return Number(result.rows[0]?.deleted_count || "0");
};

export const deleteSessionById = async (
  userId: string,
  sessionId: string
): Promise<"deleted" | "not_found" | "active"> => {
  const deleted = await db.query<{ id: string }>(
    `DELETE FROM public.sessions
     WHERE id = $1
       AND user_id = $2
       AND status <> 'active'
     RETURNING id`,
    [sessionId, userId]
  );

  if (deleted.rows[0]) return "deleted";

  const existing = await getSessionRowById(userId, sessionId);
  if (!existing) return "not_found";
  if (existing.status === "active") return "active";
  return "not_found";
};

export const endSessionById = async (
  userId: string,
  sessionId: string,
  payload: EndSessionInput
): Promise<SessionDto | null> => {
  const updated = await db.query<SessionRow>(
    `UPDATE public.sessions
     SET status = $3, ended_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND status = 'active'
     RETURNING
      id,
      user_id,
      scenario_id,
      custom_context,
      difficulty_level,
      status,
      started_at,
      ended_at`,
    [sessionId, userId, payload.status]
  );

  if (updated.rows[0]) return mapSession(updated.rows[0]);

  const existing = await getSessionRowById(userId, sessionId);
  return existing ? mapSession(existing) : null;
};
