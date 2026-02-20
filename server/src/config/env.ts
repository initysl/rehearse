import dotenv from "dotenv";
dotenv.config();

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
  REDIS_URL: required("REDIS_URL"),
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
  OPENAI_API_KEY: required("OPENAI_API_KEY"),
};
