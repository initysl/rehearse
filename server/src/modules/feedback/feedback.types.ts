import { z } from "zod";
import { FeedbackResult } from "../../types/global.types";

export const feedbackSessionParamSchema = z.object({
  sessionId: z.string().uuid(),
});

export const feedbackResultSchema = z.object({
  goalAchieved: z.boolean(),
  goalAnalysis: z.string().min(1).max(4000),
  communicationPatterns: z.object({
    assertivenessScore: z.number().int().min(1).max(10),
    clarityScore: z.number().int().min(1).max(10),
    emotionalControlScore: z.number().int().min(1).max(10),
    observations: z.array(z.string().min(1).max(500)).min(1).max(20),
  }),
  keyMoments: z
    .array(
      z.object({
        userMessage: z.string().min(1).max(2000),
        analysis: z.string().min(1).max(2000),
        alternative: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
  phrasesToTry: z.array(z.string().min(1).max(500)).min(1).max(20),
  overallSummary: z.string().min(1).max(4000),
  confidenceScore: z.number().int().min(1).max(100),
});

export interface FeedbackDto {
  id: string;
  sessionId: string;
  goalAchieved: boolean;
  confidenceScore: number;
  fullFeedback: FeedbackResult;
  generatedAt: Date;
}

export interface FeedbackGenerationResult {
  feedback: FeedbackDto;
  generatedNow: boolean;
}
