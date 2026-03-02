import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authRateLimit } from "../../middleware/ratelimit.middleware";
import {
  googleOAuth,
  googleOAuthCallback,
  logout,
  me,
  refreshToken,
} from "./auth.controller";

const router = Router();

router.post("/refresh-token", authRateLimit, refreshToken);
router.get("/oauth/google", authRateLimit, googleOAuth);
router.get("/oauth/google/callback", authRateLimit, googleOAuthCallback);
router.post("/logout", authRateLimit, logout);
router.get("/me", authenticate, me);

export default router;
