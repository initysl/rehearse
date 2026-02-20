import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getProfile, getProgress, updateProfile } from "./users.controller";

const router = Router();

router.get("/profile", authenticate, getProfile);
router.get("/progress", authenticate, getProgress);
router.patch("/profile", authenticate, updateProfile);

export default router;
