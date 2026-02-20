import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authRateLimit } from "../../middleware/ratelimit.middleware";
import {
  googleOAuth,
  googleOAuthCallback,
  login,
  logout,
  me,
  refreshToken,
  register,
} from "./auth.controller";

const router = Router();

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.post("/refresh-token", authRateLimit, refreshToken);
router.get("/oauth/google", googleOAuth);
router.get("/oauth/google/callback", googleOAuthCallback);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
