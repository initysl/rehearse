import { Pool } from "pg";
import { env } from "./env";

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
});

db.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});
