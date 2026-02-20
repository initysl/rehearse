import { env } from "./env";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const supabaseConfig = {
  baseUrl: trimTrailingSlash(env.SUPABASE_URL),
  authBaseUrl: `${trimTrailingSlash(env.SUPABASE_URL)}/auth/v1`,
  anonKey: env.SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  jwtAudience: env.SUPABASE_JWT_AUDIENCE,
  jwtIssuer: env.SUPABASE_JWT_ISSUER || `${trimTrailingSlash(env.SUPABASE_URL)}/auth/v1`,
  googleOauthRedirectUrl: env.GOOGLE_OAUTH_REDIRECT_URL,
};

export interface SupabaseAuthUser {
  id: string;
  email: string | null;
  role: string | null;
  email_confirmed_at?: string | null;
}

interface SupabaseErrorResponse {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}

const parseErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== "object") return fallback;
  const maybeError = payload as SupabaseErrorResponse;

  return (
    maybeError.error_description ||
    maybeError.message ||
    maybeError.msg ||
    maybeError.error ||
    fallback
  );
};

export class SupabaseRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "SupabaseRequestError";
    this.statusCode = statusCode;
  }
}

const baseHeaders = {
  apikey: supabaseConfig.anonKey,
  "Content-Type": "application/json",
};

const requestSupabase = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${supabaseConfig.authBaseUrl}${path}`, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    throw new SupabaseRequestError(
      parseErrorMessage(payload, "Supabase request failed"),
      response.status
    );
  }

  return payload as T;
};

export const supabaseAuthApi = {
  signUp: async (input: {
    email: string;
    password: string;
    fullName?: string;
  }) => {
    return requestSupabase<{
      user: SupabaseAuthUser | null;
      session: SupabaseSession | null;
    }>("/signup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        data: input.fullName ? { full_name: input.fullName } : undefined,
      }),
    });
  },

  signInWithPassword: async (input: { email: string; password: string }) => {
    return requestSupabase<SupabaseSession>(
      "/token?grant_type=password",
      {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          password: input.password,
        }),
      }
    );
  },

  refreshSession: async (refreshToken: string) => {
    return requestSupabase<SupabaseSession>(
      "/token?grant_type=refresh_token",
      {
        method: "POST",
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    );
  },

  getUserFromAccessToken: async (accessToken: string) => {
    return requestSupabase<SupabaseAuthUser>("/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  buildGoogleOAuthPkceUrl: (input: {
    redirectTo?: string;
    state: string;
    codeChallenge: string;
  }): string => {
    const params = new URLSearchParams({
      provider: "google",
      redirect_to: input.redirectTo || supabaseConfig.googleOauthRedirectUrl,
      code_challenge: input.codeChallenge,
      code_challenge_method: "S256",
      state: input.state,
    });

    return `${supabaseConfig.authBaseUrl}/authorize?${params.toString()}`;
  },

  exchangeCodeForSession: async (input: {
    authCode: string;
    codeVerifier: string;
  }) => {
    return requestSupabase<SupabaseSession>("/token?grant_type=pkce", {
      method: "POST",
      body: JSON.stringify({
        auth_code: input.authCode,
        code_verifier: input.codeVerifier,
      }),
    });
  },

  revokeSession: async (accessToken: string) => {
    await requestSupabase<Record<string, never>>("/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });
  },
};

export interface SupabaseSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: SupabaseAuthUser;
}
