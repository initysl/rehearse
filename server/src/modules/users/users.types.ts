import { z } from "zod";

const preferenceScalarSchema = z.union([
  z.string().max(200),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const preferencesSchema = z
  .record(preferenceScalarSchema)
  .refine(
    (value) => Object.keys(value).length <= 40,
    "preferences can contain at most 40 keys"
  );

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscriptionTier: "free" | "pro" | "enterprise";
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressSnapshotDto {
  id: string;
  sessionId: string | null;
  scenarioId: string;
  scenarioTitle: string;
  scenarioCategory: string;
  confidenceScore: number;
  sessionCount: number;
  recordedAt: Date;
}

export interface UserProgressSummary {
  totalCompletedSessions: number;
  averageConfidenceScore: number | null;
  latestConfidenceScore: number | null;
}

export interface UserProgressDto {
  summary: UserProgressSummary;
  snapshots: ProgressSnapshotDto[];
}

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(1).max(120).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    preferences: preferencesSchema.optional(),
  })
  .refine(
    (payload) =>
      payload.fullName !== undefined ||
      payload.avatarUrl !== undefined ||
      payload.preferences !== undefined,
    "At least one field must be provided"
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
