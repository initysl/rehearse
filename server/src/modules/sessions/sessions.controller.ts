import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ensureSessionFeedback } from "../feedback/feedback.service";
import {
  endSessionById,
  getSessionDetailById,
  getSessionHistory,
  startSession,
} from "./sessions.service";
import {
  endSessionSchema,
  listSessionHistoryQuerySchema,
  sessionIdParamSchema,
  startSessionSchema,
} from "./sessions.types";

const handleZodError = (error: ZodError, next: NextFunction): void => {
  const err = new Error(
    error.errors
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join("; ")
  );
  (err as Error & { statusCode: number }).statusCode = 400;
  next(err);
};

export const startPracticeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const payload = startSessionSchema.parse(req.body);
    const session = await startSession(req.user.userId, payload);
    if (!session) return res.status(404).json({ error: "Scenario not found" });

    return res.status(201).json({ session });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = sessionIdParamSchema.parse(req.params);
    const detail = await getSessionDetailById(req.user.userId, id);
    if (!detail) return res.status(404).json({ error: "Session not found" });

    return res.status(200).json(detail);
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};

export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const query = listSessionHistoryQuerySchema.parse(req.query);
    const sessions = await getSessionHistory(req.user.userId, query);
    return res.status(200).json({ sessions });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};

export const endSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = sessionIdParamSchema.parse(req.params);
    const payload = endSessionSchema.parse(req.body || {});
    const session = await endSessionById(req.user.userId, id, payload);

    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.status !== "completed") {
      return res.status(200).json({ session, feedback: null });
    }

    try {
      const feedback = await ensureSessionFeedback({
        userId: req.user.userId,
        sessionId: id,
        allowAutoGenerate: true,
      });
      return res.status(200).json({ session, feedback });
    } catch (feedbackError) {
      console.error("Feedback generation on session end failed:", feedbackError);
      return res.status(200).json({
        session,
        feedback: null,
        feedbackGenerationError: "Feedback generation failed. You can retry via GET /feedback/:sessionId.",
      });
    }
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};
