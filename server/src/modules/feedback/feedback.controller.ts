import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  getSessionFeedbackIfExists,
} from "./feedback.service";
import { feedbackSessionParamSchema } from "./feedback.types";
import {
  enqueueFeedbackGeneration,
  getFeedbackJobStatus,
} from "../../jobs/feedback.queue";

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
    const existing = await getSessionFeedbackIfExists({
      userId: req.user.userId,
      sessionId,
    });

    if (existing) {
      return res.status(200).json({
        feedback: existing,
        generatedNow: false,
        queueStatus: getFeedbackJobStatus(sessionId),
      });
    }

    const queueStatus = enqueueFeedbackGeneration({
      userId: req.user.userId,
      sessionId,
    });

    return res.status(202).json({
      status: "pending",
      queueStatus,
      message: "Feedback is being generated. Retry this endpoint shortly.",
    });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};
