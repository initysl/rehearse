import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { aiRateLimit } from "../../middleware/ratelimit.middleware";
import { sendSessionMessage } from "../messages/messages.controller";
import {
  clearHistory,
  endSession,
  getHistory,
  getSession,
  startPracticeSession,
} from "./sessions.controller";

const router = Router();

router.post("/start", authenticate, startPracticeSession);
router.get("/history", authenticate, getHistory);
router.delete("/history", authenticate, clearHistory);
router.get("/:id", authenticate, getSession);
router.post("/:id/message", authenticate, aiRateLimit, sendSessionMessage);
router.post("/:id/end", authenticate, endSession);

export default router;
