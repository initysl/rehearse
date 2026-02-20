import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logInfo } from "../utils/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const incomingRequestId = req.header("x-request-id");
  const requestId =
    incomingRequestId && incomingRequestId.trim().length > 0
      ? incomingRequestId
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logInfo("http.request.completed", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });

  next();
};
