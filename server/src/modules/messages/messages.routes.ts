import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { aiRateLimit } from "../../middleware/ratelimit.middleware";
import { sendSessionMessage } from "./messages.controller";

const router = Router();

router.post("/sessions/:id/message", authenticate, aiRateLimit, sendSessionMessage);

export default router;
