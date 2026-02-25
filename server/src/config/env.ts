import dotenv from "dotenv";
dotenv.config();

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() !== "false";
};

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  PORT: parseInt(process.env.PORT || "5000"),
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:5000",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  DATABASE_URL: required("DATABASE_URL"),
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || "20", 10),
  DB_IDLE_TIMEOUT_MS: parseInt(process.env.DB_IDLE_TIMEOUT_MS || "30000", 10),
  DB_CONNECTION_TIMEOUT_MS: parseInt(
    process.env.DB_CONNECTION_TIMEOUT_MS || "15000",
    10
  ),
  REDIS_URL: required("REDIS_URL"),
  RATE_LIMIT_REDIS_ENABLED: parseBoolean(
    process.env.RATE_LIMIT_REDIS_ENABLED,
    (process.env.NODE_ENV || "development") === "production"
  ),
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  SUPABASE_JWT_AUDIENCE: process.env.SUPABASE_JWT_AUDIENCE || "authenticated",
  SUPABASE_JWT_ISSUER: process.env.SUPABASE_JWT_ISSUER,
  GOOGLE_OAUTH_REDIRECT_URL:
    process.env.GOOGLE_OAUTH_REDIRECT_URL ||
    `${process.env.SERVER_URL || "http://localhost:5000"}/auth/oauth/google/callback`,
  AUTH_SUCCESS_REDIRECT_URL:
    process.env.AUTH_SUCCESS_REDIRECT_URL ||
    `${process.env.CLIENT_URL || "http://localhost:3000"}/auth/callback`,
  AUTH_ERROR_REDIRECT_URL:
    process.env.AUTH_ERROR_REDIRECT_URL ||
    `${process.env.CLIENT_URL || "http://localhost:3000"}/auth/error`,
  COOKIE_SIGNING_SECRET: required("COOKIE_SIGNING_SECRET"),
  GROQ_API_KEY: required("GROQ_API_KEY"),
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  GROQ_STT_MODEL: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo",
  GROQ_TTS_MODEL: process.env.GROQ_TTS_MODEL || "canopylabs/orpheus-v1-english",
  GROQ_TTS_VOICE_MALE: process.env.GROQ_TTS_VOICE_MALE || "troy",
  GROQ_TTS_VOICE_FEMALE: process.env.GROQ_TTS_VOICE_FEMALE || "sara",
  GROQ_STREAM_TIMEOUT_MS: parseInt(process.env.GROQ_STREAM_TIMEOUT_MS || "30000", 10),
  GROQ_COMPLETION_TIMEOUT_MS: parseInt(
    process.env.GROQ_COMPLETION_TIMEOUT_MS || "15000",
    10
  ),
  GROQ_QUOTA_ENABLED: parseBoolean(process.env.GROQ_QUOTA_ENABLED, true),
  GROQ_QUOTA_FAIL_OPEN: parseBoolean(process.env.GROQ_QUOTA_FAIL_OPEN, true),
  GROQ_QUOTA_HEADROOM_PERCENT: Math.min(
    100,
    Math.max(1, parseInt(process.env.GROQ_QUOTA_HEADROOM_PERCENT || "100", 10))
  ),
  GROQ_AUDIO_BYTES_PER_SECOND_ESTIMATE: parseInt(
    process.env.GROQ_AUDIO_BYTES_PER_SECOND_ESTIMATE || "6000",
    10
  ) || 6000,
};
