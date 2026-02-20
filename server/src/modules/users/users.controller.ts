import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  findProfileByUserId,
  getUserProgressByUserId,
  updateProfileByUserId,
} from "./users.service";
import { updateProfileSchema } from "./users.types";

const mapValidationError = (error: ZodError): Error => {
  const mapped = new Error(
    error.errors
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join("; ")
  );
  (mapped as Error & { statusCode: number }).statusCode = 400;
  return mapped;
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await findProfileByUserId(req.user.userId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return next(error as Error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = updateProfileSchema.parse(req.body);
    const profile = await updateProfileByUserId(req.user.userId, payload);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(mapValidationError(error));
    }
    return next(error as Error);
  }
};

export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const progress = await getUserProgressByUserId(req.user.userId);
    return res.status(200).json(progress);
  } catch (error) {
    return next(error as Error);
  }
};
