import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { SupabaseRequestError } from "../../config/supabase";
import {
  exchangeGoogleOAuthCode,
  getGoogleOAuthUrl,
  logoutSession,
  refreshAuthSession,
} from "./auth.service";
import {
  googleOAuthCallbackQuerySchema,
  googleOAuthStartQuerySchema,
  refreshTokenSchema,
} from "./auth.types";
import { findProfileByUserId } from "../users/users.service";
import {
  buildErrorRedirect,
  clearAuthCookies,
  clearGoogleOauthStateCookie,
  createPkceChallenge,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  readGoogleOauthStateCookie,
  sanitizeRedirectTarget,
  setAuthCookies,
  setGoogleOauthStateCookie,
} from "./auth.utils";

const isZodError = (error: unknown): error is ZodError => error instanceof ZodError;

type PublicAuthResponse = {
  user: {
    id: string;
    email: string | null;
    role: string;
    emailConfirmed: boolean;
  };
  session: null;
  requiresEmailConfirmation: boolean;
};

const handleControllerError = (
  error: unknown,
  next: NextFunction
): void => {
  if (isZodError(error)) {
    const validationError = new Error("Invalid request payload");
    (validationError as Error & { statusCode: number }).statusCode = 400;
    validationError.message = error.errors
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join("; ");
    return next(validationError);
  }

  if (error instanceof SupabaseRequestError) {
    const supabaseError = new Error(error.message);
    (supabaseError as Error & { statusCode: number }).statusCode =
      error.statusCode;
    return next(supabaseError);
  }

  return next(error as Error);
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = getRefreshTokenFromCookies(req);

    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Refresh token cookie is missing" });
    }

    const payload = refreshTokenSchema.parse({ refreshToken });
    const result = await refreshAuthSession(payload);
    if (!result.user.emailConfirmed) {
      clearAuthCookies(res);
      return res
        .status(403)
        .json({ error: "Email confirmation required before session refresh" });
    }

    if (!result.session) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Session refresh failed" });
    }
    setAuthCookies(res, result.session);

    const responsePayload: PublicAuthResponse = {
      user: result.user,
      session: null,
      requiresEmailConfirmation: false,
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    return handleControllerError(error, next);
  }
};

export const googleOAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = googleOAuthStartQuerySchema.parse(req.query);
    const { codeVerifier, codeChallenge, state } = createPkceChallenge();

    setGoogleOauthStateCookie(res, {
      state,
      codeVerifier,
      next: query.next,
      issuedAt: Date.now(),
    });

    const result = await getGoogleOAuthUrl({ ...query, state, codeChallenge });
    return res.redirect(302, result.url);
  } catch (error) {
    return handleControllerError(error, next);
  }
};

export const googleOAuthCallback = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const query = googleOAuthCallbackQuerySchema.parse(req.query);
    const stateCookie = readGoogleOauthStateCookie(req);
    clearGoogleOauthStateCookie(res);

    if (query.error) {
      clearAuthCookies(res);
      return res.redirect(302, buildErrorRedirect());
    }

    if (!query.code || !query.state || !stateCookie) {
      clearAuthCookies(res);
      return res.redirect(302, buildErrorRedirect());
    }

    if (stateCookie.state !== query.state) {
      clearAuthCookies(res);
      return res.redirect(302, buildErrorRedirect());
    }

    if (Date.now() - stateCookie.issuedAt > 1000 * 60 * 10) {
      clearAuthCookies(res);
      return res.redirect(302, buildErrorRedirect());
    }

    const result = await exchangeGoogleOAuthCode({
      code: query.code,
      codeVerifier: stateCookie.codeVerifier,
    });

    if (!result.session || !result.user.emailConfirmed) {
      clearAuthCookies(res);
      return res.redirect(302, buildErrorRedirect());
    }

    setAuthCookies(res, result.session);
    return res.redirect(302, sanitizeRedirectTarget(stateCookie.next));
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    clearAuthCookies(res);
    return res.redirect(302, buildErrorRedirect());
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.accessToken || getAccessTokenFromCookies(req);
    if (token) {
      await logoutSession(token);
    }

    clearAuthCookies(res);
    clearGoogleOauthStateCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    clearAuthCookies(res);
    return handleControllerError(error, next);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await findProfileByUserId(req.user.userId);
    return res.status(200).json({
      user: {
        ...req.user,
        fullName: profile?.fullName || null,
      },
    });
  } catch (error) {
    return handleControllerError(error, next);
  }
};
