import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ensureSessionFeedback } from "./feedback.service";
import { feedbackSessionParamSchema } from "./feedback.types";

const handleZodError = (error: ZodError, next: NextFunction): void => {
  const err = new Error(
    error.errors
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join("; ")
  );
  (err as Error & { statusCode: number }).statusCode = 400;
  next(err);
};

export const getFeedbackForSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const { sessionId } = feedbackSessionParamSchema.parse(req.params);
    const result = await ensureSessionFeedback({
      userId: req.user.userId,
      sessionId,
      allowAutoGenerate: true,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};
