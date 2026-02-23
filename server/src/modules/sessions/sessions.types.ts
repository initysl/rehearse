import { z } from "zod";
import { Message } from "../../types/global.types";

export const sessionIdParamSchema = z.object({
  id: z.string().uuid(),
});

const difficultySchema = z.enum([
  "cooperative",
  "neutral",
  "resistant",
  "hostile",
]);

const sessionStatusSchema = z.enum(["active", "completed", "abandoned"]);

export const startSessionSchema = z.object({
  scenarioId: z.string().uuid(),
  difficultyLevel: difficultySchema,
  customContext: z.string().max(2000).optional(),
});

export const endSessionSchema = z.object({
  status: z.enum(["completed", "abandoned"]).default("completed"),
});

export const listSessionHistoryQuerySchema = z.object({
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
  status: sessionStatusSchema.optional(),
});

const clearHistoryScopeSchema = z.enum([
  "non_active",
  "completed",
  "abandoned",
  "all",
]);

export const clearSessionHistoryQuerySchema = z.object({
  scope: clearHistoryScopeSchema.optional().default("non_active"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((value) => (value ? Math.min(parseInt(value, 10), 500) : 100)),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
export type SessionHistoryQuery = z.infer<typeof listSessionHistoryQuerySchema>;
export type ClearSessionHistoryQuery = z.infer<typeof clearSessionHistoryQuerySchema>;

export interface SessionDto {
  id: string;
  userId: string;
  scenarioId: string;
  customContext: string | null;
  difficultyLevel: z.infer<typeof difficultySchema>;
  status: z.infer<typeof sessionStatusSchema>;
  startedAt: Date;
  endedAt: Date | null;
}

export interface SessionHistoryItem extends SessionDto {
  scenarioTitle: string;
  scenarioCategory: string;
  messageCount: number;
}

export interface SessionDetail {
  session: SessionDto;
  messages: Message[];
}
