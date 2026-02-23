import { z } from "zod";
import { CharacterProfile, DifficultyVariant } from "../../types/global.types";

const categorySchema = z.enum([
  "work",
  "health",
  "family",
  "social",
  "financial",
  "legal",
]);

const difficultyLevelSchema = z.enum([
  "cooperative",
  "neutral",
  "resistant",
  "hostile",
]);

const characterProfileSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  personality: z.array(z.string().min(1).max(120)).min(1).max(12),
  goals: z.array(z.string().min(1).max(200)).min(1).max(12),
  emotionalState: z.string().min(1).max(120),
});

const difficultyVariantSchema = z.object({
  level: difficultyLevelSchema,
  behaviorModifier: z.string().min(1).max(500),
});

export const listScenariosQuerySchema = z.object({
  category: categorySchema.optional(),
  search: z.string().min(1).max(120).optional(),
  customOnly: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((value) => (value ? Math.min(parseInt(value, 10), 100) : 20)),
  offset: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : 0)),
});

export const scenarioIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createCustomScenarioSchema = z.object({
  title: z.string().min(3).max(255),
  category: categorySchema,
  description: z.string().min(10).max(2000),
  characterProfile: characterProfileSchema,
  difficultyVariants: z.array(difficultyVariantSchema).min(1).max(4),
});

export const updateCustomScenarioSchema = createCustomScenarioSchema;

export type ScenarioCategory = z.infer<typeof categorySchema>;
export type ScenarioDifficultyLevel = z.infer<typeof difficultyLevelSchema>;
export type CreateCustomScenarioInput = z.infer<typeof createCustomScenarioSchema>;
export type UpdateCustomScenarioInput = z.infer<typeof updateCustomScenarioSchema>;
export type ListScenariosQuery = z.infer<typeof listScenariosQuerySchema>;

export interface ScenarioDto {
  id: string;
  title: string;
  category: ScenarioCategory;
  description: string;
  characterProfile: CharacterProfile;
  difficultyVariants: DifficultyVariant[];
  isCustom: boolean;
  createdBy: string | null;
  playCount: number;
  createdAt: Date;
}
