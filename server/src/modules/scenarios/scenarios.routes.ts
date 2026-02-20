import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { createScenario, getScenario, getScenarios } from "./scenarios.controller";

const router = Router();

router.get("/", authenticate, getScenarios);
router.get("/:id", authenticate, getScenario);
router.post("/custom", authenticate, createScenario);

export default router;
