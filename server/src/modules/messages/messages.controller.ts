import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { streamSessionMessage } from "./messages.service";
import {
  sendSessionMessageParamsSchema,
  sendSessionMessageSchema,
} from "./messages.types";

const handleZodError = (error: ZodError, next: NextFunction): void => {
  const err = new Error(
    error.errors
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join("; ")
  );
  (err as Error & { statusCode: number }).statusCode = 400;
  next(err);
};

export const sendSessionMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = sendSessionMessageParamsSchema.parse(req.params);
    const payload = sendSessionMessageSchema.parse(req.body);

    await streamSessionMessage({
      userId: req.user.userId,
      sessionId: id,
      payload,
      response: res,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, next);
    }

    if (res.headersSent || res.writableEnded) {
      try {
        res.write(`data: ${JSON.stringify({ error: "Message streaming failed" })}\n\n`);
      } catch {
        // ignored: stream likely already closed
      }
      return res.end();
    }

    return next(error as Error);
  }
};
