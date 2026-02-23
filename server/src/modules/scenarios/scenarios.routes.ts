import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  createScenario,
  deleteScenario,
  getScenario,
  getScenarios,
  updateScenario,
} from "./scenarios.controller";

const router = Router();

router.get("/", authenticate, getScenarios);
router.post("/custom", authenticate, createScenario);
router.patch("/custom/:id", authenticate, updateScenario);
router.delete("/custom/:id", authenticate, deleteScenario);
router.get("/:id", authenticate, getScenario);

export default router;
