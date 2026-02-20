import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getFeedbackForSession } from "./feedback.controller";

const router = Router();

router.get("/:sessionId", authenticate, getFeedbackForSession);

export default router;
