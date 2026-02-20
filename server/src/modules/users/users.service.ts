import { db } from "../../config/db";
import {
  ProgressSnapshotDto,
  UpdateProfileInput,
  UserProfile,
  UserProgressDto,
} from "./users.types";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "pro" | "enterprise";
  preferences: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

interface ProgressSnapshotRow {
  id: string;
  session_id: string | null;
  scenario_id: string;
  scenario_title: string;
  scenario_category: string;
  confidence_score: number;
  session_count: number;
  recorded_at: Date;
}

interface ProgressSummaryRow {
  total_completed_sessions: string;
  average_confidence_score: number | null;
  latest_confidence_score: number | null;
}

const toUserProfile = (row: ProfileRow): UserProfile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  subscriptionTier: row.subscription_tier,
  preferences: row.preferences || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toProgressSnapshot = (row: ProgressSnapshotRow): ProgressSnapshotDto => ({
  id: row.id,
  sessionId: row.session_id,
  scenarioId: row.scenario_id,
  scenarioTitle: row.scenario_title,
  scenarioCategory: row.scenario_category,
  confidenceScore: row.confidence_score,
  sessionCount: row.session_count,
  recordedAt: row.recorded_at,
});

export const findProfileByUserId = async (
  userId: string
): Promise<UserProfile | null> => {
  const result = await db.query<ProfileRow>(
    `SELECT
      id,
      email,
      full_name,
      avatar_url,
      subscription_tier,
      preferences,
      created_at,
      updated_at
     FROM public.profiles
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (!result.rows[0]) return null;
  return toUserProfile(result.rows[0]);
};

export const updateProfileByUserId = async (
  userId: string,
  payload: UpdateProfileInput
): Promise<UserProfile | null> => {
  const avatarProvided = Object.prototype.hasOwnProperty.call(payload, "avatarUrl");
  const preferencesProvided = Object.prototype.hasOwnProperty.call(
    payload,
    "preferences"
  );

  const result = await db.query<ProfileRow>(
    `UPDATE public.profiles
     SET
      full_name = COALESCE($2, full_name),
      avatar_url = CASE WHEN $3::boolean THEN $4 ELSE avatar_url END,
      preferences = CASE WHEN $5::boolean THEN $6::jsonb ELSE preferences END,
      updated_at = NOW()
     WHERE id = $1
     RETURNING
      id,
      email,
      full_name,
      avatar_url,
      subscription_tier,
      preferences,
      created_at,
      updated_at`,
    [
      userId,
      payload.fullName || null,
      avatarProvided,
      payload.avatarUrl ?? null,
      preferencesProvided,
      preferencesProvided ? JSON.stringify(payload.preferences || {}) : null,
    ]
  );

  if (!result.rows[0]) return null;
  return toUserProfile(result.rows[0]);
};

export const getUserProgressByUserId = async (
  userId: string
): Promise<UserProgressDto> => {
  const summaryResult = await db.query<ProgressSummaryRow>(
    `WITH feedback_rows AS (
       SELECT f.confidence_score, f.generated_at
       FROM public.feedback f
       JOIN public.sessions s ON s.id = f.session_id
       WHERE s.user_id = $1
     )
     SELECT
       (
         SELECT COUNT(*)::text
         FROM public.sessions
         WHERE user_id = $1
           AND status = 'completed'
       ) AS total_completed_sessions,
       (
         SELECT ROUND(AVG(confidence_score)::numeric, 2)
         FROM feedback_rows
       ) AS average_confidence_score,
       (
         SELECT confidence_score
         FROM feedback_rows
         ORDER BY generated_at DESC
         LIMIT 1
       ) AS latest_confidence_score`,
    [userId]
  );

  const snapshotsResult = await db.query<ProgressSnapshotRow>(
    `SELECT
      ps.id,
      ps.session_id,
      ps.scenario_id,
      sc.title AS scenario_title,
      sc.category AS scenario_category,
      ps.confidence_score,
      ps.session_count,
      ps.recorded_at
     FROM public.progress_snapshots ps
     JOIN public.scenarios sc ON sc.id = ps.scenario_id
     WHERE ps.user_id = $1
     ORDER BY ps.recorded_at DESC
     LIMIT 200`,
    [userId]
  );

  const summaryRow = summaryResult.rows[0];
  return {
    summary: {
      totalCompletedSessions: Number(summaryRow?.total_completed_sessions || "0"),
      averageConfidenceScore: summaryRow?.average_confidence_score ?? null,
      latestConfidenceScore: summaryRow?.latest_confidence_score ?? null,
    },
    snapshots: snapshotsResult.rows.map(toProgressSnapshot),
  };
};
