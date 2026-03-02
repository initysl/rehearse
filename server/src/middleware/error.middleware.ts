import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';
import { toSafeHttpErrorMessage } from '../utils/public-error';

export interface AppError extends Error {
  statusCode?: number;
  retryAfterSeconds?: number;
  publicDetails?: Record<string, unknown>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const internalMessage = err.message || 'Internal Server Error';
  const publicError = toSafeHttpErrorMessage(statusCode, internalMessage);

  logError('http.request.error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    message: internalMessage,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (typeof err.retryAfterSeconds === 'number' && err.retryAfterSeconds > 0) {
    res.setHeader('Retry-After', Math.ceil(err.retryAfterSeconds));
  }

  res.status(statusCode).json({
    error: publicError.message,
    code: publicError.code,
    ...(err.publicDetails && Object.keys(err.publicDetails).length > 0
      ? { details: err.publicDetails }
      : {}),
    requestId: req.requestId,
  });
};
