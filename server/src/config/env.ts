import dotenv from 'dotenv';
dotenv.config();

const parseBoolean = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() !== 'false';
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseTtsProvider = (
  value: string | undefined,
  fallback: 'groq' | 'elevenlabs' | 'none',
): 'groq' | 'elevenlabs' | 'none' => {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === 'groq' ||
    normalized === 'elevenlabs' ||
    normalized === 'none'
  ) {
    return normalized;
  }
  return fallback;
};

const parseTtsFallbackPolicy = (
  value: string | undefined,
  fallback: 'always' | 'rate_limit_only',
): 'always' | 'rate_limit_only' => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'always' || normalized === 'rate_limit_only') {
    return normalized;
  }
  return fallback;
};

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  PORT: parseInt(process.env.PORT || '5000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  DATABASE_URL: required('DATABASE_URL'),
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '20', 10),
  DB_IDLE_TIMEOUT_MS: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  DB_CONNECTION_TIMEOUT_MS: parseInt(
    process.env.DB_CONNECTION_TIMEOUT_MS || '15000',
    10,
  ),
  REDIS_URL: required('REDIS_URL'),
  RATE_LIMIT_REDIS_ENABLED: parseBoolean(
    process.env.RATE_LIMIT_REDIS_ENABLED,
    (process.env.NODE_ENV || 'development') === 'production',
  ),
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_JWT_AUDIENCE: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated',
  SUPABASE_JWT_ISSUER: process.env.SUPABASE_JWT_ISSUER,
  GOOGLE_OAUTH_REDIRECT_URL:
    process.env.GOOGLE_OAUTH_REDIRECT_URL ||
    `${process.env.SERVER_URL || 'http://localhost:5000'}/auth/oauth/google/callback`,
  AUTH_SUCCESS_REDIRECT_URL:
    process.env.AUTH_SUCCESS_REDIRECT_URL ||
    `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback`,
  AUTH_ERROR_REDIRECT_URL:
    process.env.AUTH_ERROR_REDIRECT_URL ||
    `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/error`,
  COOKIE_SIGNING_SECRET: required('COOKIE_SIGNING_SECRET'),
  GROQ_API_KEY: required('GROQ_API_KEY'),
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GROQ_STT_MODEL: process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo',
  GROQ_TTS_MODEL: process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english',
  GROQ_TTS_VOICE_MALE: process.env.GROQ_TTS_VOICE_MALE || 'troy',
  GROQ_TTS_VOICE_FEMALE: process.env.GROQ_TTS_VOICE_FEMALE || 'hannah',
  TTS_PROVIDER: parseTtsProvider(process.env.TTS_PROVIDER, 'groq'),
  TTS_FALLBACK_PROVIDER: parseTtsProvider(
    process.env.TTS_FALLBACK_PROVIDER,
    'none',
  ),
  TTS_FALLBACK_POLICY: parseTtsFallbackPolicy(
    process.env.TTS_FALLBACK_POLICY,
    'rate_limit_only',
  ),
  TTS_TIMEOUT_MS: parseNumber(process.env.TTS_TIMEOUT_MS, 60000),
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  ELEVENLABS_MODEL_ID:
    process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
  ELEVENLABS_VOICE_MALE: process.env.ELEVENLABS_VOICE_MALE || '',
  ELEVENLABS_VOICE_FEMALE: process.env.ELEVENLABS_VOICE_FEMALE || '',
  GROQ_STREAM_TIMEOUT_MS: parseInt(
    process.env.GROQ_STREAM_TIMEOUT_MS || '30000',
    10,
  ),
  GROQ_COMPLETION_TIMEOUT_MS: parseInt(
    process.env.GROQ_COMPLETION_TIMEOUT_MS || '15000',
    10,
  ),
  GROQ_QUOTA_ENABLED: parseBoolean(process.env.GROQ_QUOTA_ENABLED, true),
  GROQ_QUOTA_FAIL_OPEN: parseBoolean(process.env.GROQ_QUOTA_FAIL_OPEN, true),
  GROQ_QUOTA_HEADROOM_PERCENT: Math.min(
    100,
    Math.max(1, parseInt(process.env.GROQ_QUOTA_HEADROOM_PERCENT || '100', 10)),
  ),
  GROQ_AUDIO_BYTES_PER_SECOND_ESTIMATE:
    parseInt(process.env.GROQ_AUDIO_BYTES_PER_SECOND_ESTIMATE || '6000', 10) ||
    6000,
  PUBLIC_DAILY_SESSION_LIMIT: Math.max(
    1,
    parseNumber(process.env.PUBLIC_DAILY_SESSION_LIMIT, 3),
  ),
};
