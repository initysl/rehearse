process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "5000";
process.env.SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
process.env.AUTH_SUCCESS_REDIRECT_URL =
  process.env.AUTH_SUCCESS_REDIRECT_URL || "http://localhost:3000/auth/callback";
process.env.AUTH_ERROR_REDIRECT_URL =
  process.env.AUTH_ERROR_REDIRECT_URL || "http://localhost:3000/auth/error";

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/rehearse_test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://example-project.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "anon-test-key";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service-role-test-key";
process.env.SUPABASE_JWT_AUDIENCE =
  process.env.SUPABASE_JWT_AUDIENCE || "authenticated";
process.env.GOOGLE_OAUTH_REDIRECT_URL =
  process.env.GOOGLE_OAUTH_REDIRECT_URL ||
  "http://localhost:5000/auth/oauth/google/callback";

process.env.COOKIE_SIGNING_SECRET =
  process.env.COOKIE_SIGNING_SECRET || "test-cookie-signing-secret";
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-groq-key";
