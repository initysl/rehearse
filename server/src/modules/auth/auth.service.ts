import {
  supabaseAuthApi,
  SupabaseSession,
} from "../../config/supabase";
import {
  GoogleOAuthStartQuery,
  RefreshTokenInput,
} from "./auth.types";

type AuthResponse = {
  user: {
    id: string;
    email: string | null;
    role: string;
    emailConfirmed: boolean;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
    tokenType: string;
  } | null;
  requiresEmailConfirmation: boolean;
};

const toAuthResponse = (
  user: {
    id: string;
    email: string | null;
    role: string | null;
    email_confirmed_at?: string | null;
  } | null,
  session: SupabaseSession | null
): AuthResponse => ({
  user: {
    id: user?.id || session?.user.id || "",
    email: user?.email || session?.user.email || null,
    role: user?.role || session?.user.role || "authenticated",
    emailConfirmed: Boolean(
      user?.email_confirmed_at || session?.user.email_confirmed_at
    ),
  },
  session: session
    ? {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: session.expires_at,
        tokenType: session.token_type,
      }
    : null,
  requiresEmailConfirmation: !session,
});

export const refreshAuthSession = async (
  payload: RefreshTokenInput
): Promise<AuthResponse> => {
  const session = await supabaseAuthApi.refreshSession(payload.refreshToken);
  return toAuthResponse(session.user, session);
};

export const getGoogleOAuthUrl = async (
  query: GoogleOAuthStartQuery & { codeChallenge: string }
): Promise<{ url: string }> => {
  return {
    url: supabaseAuthApi.buildGoogleOAuthPkceUrl({
      codeChallenge: query.codeChallenge,
    }),
  };
};

export const exchangeGoogleOAuthCode = async (input: {
  code: string;
  codeVerifier: string;
}): Promise<AuthResponse> => {
  const session = await supabaseAuthApi.exchangeCodeForSession({
    authCode: input.code,
    codeVerifier: input.codeVerifier,
  });
  return toAuthResponse(session.user, session);
};

export const logoutSession = async (accessToken: string): Promise<void> => {
  await supabaseAuthApi.revokeSession(accessToken);
};
