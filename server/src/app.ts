import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";

// Route imports
import authRoutes from "./modules/auth/auth.routes";
import scenarioRoutes from "./modules/scenarios/scenarios.routes";
import sessionRoutes from "./modules/sessions/sessions.routes";
import feedbackRoutes from "./modules/feedback/feedback.routes";
import userRoutes from "./modules/users/users.routes";

const app = express();
const expectedClientOrigin = (() => {
  try {
    return new URL(env.CLIENT_URL).origin;
  } catch {
    return env.CLIENT_URL;
  }
})();

// ── Core Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const normalizedOrigin = new URL(origin).origin;
        callback(null, normalizedOrigin === expectedClientOrigin);
      } catch {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/scenarios", scenarioRoutes);
app.use("/sessions", sessionRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/users", userRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", project: "Rehearse", version: "1.0.0" });
});

// ── Error Handler (must be last) ─────────────────────────────
app.use(errorHandler);

export default app;
