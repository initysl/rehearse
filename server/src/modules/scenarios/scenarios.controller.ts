import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  createCustomScenario,
  deleteCustomScenario,
  getScenarioById,
  listScenarios,
  updateCustomScenario,
} from "./scenarios.service";
import {
  createCustomScenarioSchema,
  listScenariosQuerySchema,
  scenarioIdParamSchema,
  updateCustomScenarioSchema,
} from "./scenarios.types";

const handleZodError = (error: ZodError, next: NextFunction): void => {
  const err = new Error(
    error.errors
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join("; ")
  );
  (err as Error & { statusCode: number }).statusCode = 400;
  next(err);
};

export const getScenarios = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const query = listScenariosQuerySchema.parse(req.query);
    const scenarios = await listScenarios(req.user.userId, query);
    return res.status(200).json({ scenarios });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};

export const getScenario = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = scenarioIdParamSchema.parse(req.params);
    const scenario = await getScenarioById(req.user.userId, id);
    if (!scenario) return res.status(404).json({ error: "Scenario not found" });

    return res.status(200).json({ scenario });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};

export const createScenario = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const payload = createCustomScenarioSchema.parse(req.body);
    const scenario = await createCustomScenario(req.user.userId, payload);
    return res.status(201).json({ scenario });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};

export const updateScenario = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = scenarioIdParamSchema.parse(req.params);
    const payload = updateCustomScenarioSchema.parse(req.body);
    const scenario = await updateCustomScenario(req.user.userId, id, payload);
    if (!scenario) return res.status(404).json({ error: "Scenario not found" });

    return res.status(200).json({ scenario });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};

export const deleteScenario = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = scenarioIdParamSchema.parse(req.params);
    const deleted = await deleteCustomScenario(req.user.userId, id);
    if (deleted === "not_found") {
      return res.status(404).json({ error: "Scenario not found" });
    }

    if (deleted === "in_use") {
      return res.status(409).json({
        error:
          "Cannot delete a custom scenario that already has sessions. Keep it for history consistency.",
      });
    }

    return res.status(200).json({ deleted: true });
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error, next);
    return next(error as Error);
  }
};
