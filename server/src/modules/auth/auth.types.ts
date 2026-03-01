import { z } from "zod";

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});

export const googleOAuthStartQuerySchema = z.object({
  next: z.string().max(512).optional(),
});

export const googleOAuthCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type GoogleOAuthStartQuery = z.infer<typeof googleOAuthStartQuerySchema>;
export type GoogleOAuthCallbackQuery = z.infer<typeof googleOAuthCallbackQuerySchema>;
