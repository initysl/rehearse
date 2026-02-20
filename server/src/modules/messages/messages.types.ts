import { z } from "zod";

export const sendSessionMessageParamsSchema = z.object({
  id: z.string().uuid(),
});

export const sendSessionMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export type SendSessionMessageInput = z.infer<typeof sendSessionMessageSchema>;
