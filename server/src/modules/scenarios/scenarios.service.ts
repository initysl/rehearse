import { db } from "../../config/db";
import {
  CreateCustomScenarioInput,
  ListScenariosQuery,
  ScenarioDto,
  UpdateCustomScenarioInput,
} from "./scenarios.types";

interface ScenarioRow {
  id: string;
  title: string;
  category: ScenarioDto["category"];
  description: string;
  character_profile: ScenarioDto["characterProfile"];
  difficulty_variants: ScenarioDto["difficultyVariants"];
  is_custom: boolean;
  created_by: string | null;
  play_count: number;
  created_at: Date;
}

const mapScenario = (row: ScenarioRow): ScenarioDto => ({
  id: row.id,
  title: row.title,
  category: row.category,
  description: row.description,
  characterProfile: row.character_profile,
  difficultyVariants: row.difficulty_variants,
  isCustom: row.is_custom,
  createdBy: row.created_by,
  playCount: row.play_count,
  createdAt: row.created_at,
});

export const listScenarios = async (
  userId: string,
  query: ListScenariosQuery
): Promise<ScenarioDto[]> => {
  const params: unknown[] = [userId];
  const whereConditions: string[] = [];

  if (query.customOnly) {
    whereConditions.push("s.is_custom = TRUE AND s.created_by = $1");
  } else {
    whereConditions.push("(s.is_custom = FALSE OR s.created_by = $1)");
  }

  if (query.category) {
    params.push(query.category);
    whereConditions.push(`s.category = $${params.length}`);
  }

  if (query.search) {
    params.push(`%${query.search}%`);
    whereConditions.push(`s.title ILIKE $${params.length}`);
  }

  params.push(query.limit, query.offset);
  const limitParam = `$${params.length - 1}`;
  const offsetParam = `$${params.length}`;

  const result = await db.query<ScenarioRow>(
    `SELECT
      s.id,
      s.title,
      s.category,
      s.description,
      s.character_profile,
      s.difficulty_variants,
      s.is_custom,
      s.created_by,
      s.play_count,
      s.created_at
     FROM public.scenarios s
     WHERE ${whereConditions.join(" AND ")}
     ORDER BY s.play_count DESC, s.created_at DESC
     LIMIT ${limitParam}
     OFFSET ${offsetParam}`,
    params
  );

  return result.rows.map(mapScenario);
};

export const getScenarioById = async (
  userId: string,
  scenarioId: string
): Promise<ScenarioDto | null> => {
  const result = await db.query<ScenarioRow>(
    `SELECT
      s.id,
      s.title,
      s.category,
      s.description,
      s.character_profile,
      s.difficulty_variants,
      s.is_custom,
      s.created_by,
      s.play_count,
      s.created_at
     FROM public.scenarios s
     WHERE s.id = $1
       AND (s.is_custom = FALSE OR s.created_by = $2)
     LIMIT 1`,
    [scenarioId, userId]
  );

  if (!result.rows[0]) return null;
  return mapScenario(result.rows[0]);
};

export const createCustomScenario = async (
  userId: string,
  payload: CreateCustomScenarioInput
): Promise<ScenarioDto> => {
  const result = await db.query<ScenarioRow>(
    `INSERT INTO public.scenarios (
      title,
      category,
      description,
      character_profile,
      difficulty_variants,
      is_custom,
      created_by
    )
    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, TRUE, $6)
    RETURNING
      id,
      title,
      category,
      description,
      character_profile,
      difficulty_variants,
      is_custom,
      created_by,
      play_count,
      created_at`,
    [
      payload.title,
      payload.category,
      payload.description,
      JSON.stringify(payload.characterProfile),
      JSON.stringify(payload.difficultyVariants),
      userId,
    ]
  );

  return mapScenario(result.rows[0]);
};

export const updateCustomScenario = async (
  userId: string,
  scenarioId: string,
  payload: UpdateCustomScenarioInput
): Promise<ScenarioDto | null> => {
  const result = await db.query<ScenarioRow>(
    `UPDATE public.scenarios
     SET
       title = $3,
       category = $4,
       description = $5,
       character_profile = $6::jsonb,
       difficulty_variants = $7::jsonb
     WHERE id = $1
       AND is_custom = TRUE
       AND created_by = $2
     RETURNING
       id,
       title,
       category,
       description,
       character_profile,
       difficulty_variants,
       is_custom,
       created_by,
       play_count,
       created_at`,
    [
      scenarioId,
      userId,
      payload.title,
      payload.category,
      payload.description,
      JSON.stringify(payload.characterProfile),
      JSON.stringify(payload.difficultyVariants),
    ]
  );

  if (!result.rows[0]) return null;
  return mapScenario(result.rows[0]);
};

export const deleteCustomScenario = async (
  userId: string,
  scenarioId: string
): Promise<"deleted" | "not_found" | "in_use"> => {
  const inUseResult = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM public.sessions
     WHERE scenario_id = $1
       AND user_id = $2`,
    [scenarioId, userId]
  );

  if (Number(inUseResult.rows[0]?.count || "0") > 0) {
    return "in_use";
  }

  const result = await db.query<{ id: string }>(
    `DELETE FROM public.scenarios
     WHERE id = $1
       AND is_custom = TRUE
       AND created_by = $2
     RETURNING id`,
    [scenarioId, userId]
  );

  return result.rows[0] ? "deleted" : "not_found";
};
