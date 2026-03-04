import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../../config/env";

const ACCESS_TOKEN_COOKIE = "rh_access_token";
const REFRESH_TOKEN_COOKIE = "rh_refresh_token";
const GOOGLE_OAUTH_COOKIE = "rh_google_oauth";

interface GoogleOauthStatePayload {
  codeVerifier: string;
  next?: string;
  issuedAt: number;
}

const createCookieSignature = (value: string): string => {
  return crypto
    .createHmac("sha256", env.COOKIE_SIGNING_SECRET)
    .update(value)
    .digest("base64url");
};

const encodeSignedCookie = (payload: object): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = createCookieSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const decodeSignedCookie = <T>(rawValue: string): T | null => {
  const [encodedPayload, providedSignature] = rawValue.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = createCookieSignature(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const json = Buffer.from(encodedPayload, "base64url").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

const cookieBaseOptions = {
  httpOnly: true,
  secure:
    env.NODE_ENV === "production" || env.AUTH_COOKIE_SAME_SITE === "none",
  sameSite: env.AUTH_COOKIE_SAME_SITE,
  path: "/",
};

const clientOrigin = (() => {
  try {
    return new URL(env.CLIENT_URL).origin;
  } catch {
    return env.CLIENT_URL;
  }
})();

const parseCookies = (req: Request): Record<string, string> => {
  const rawCookie = req.headers.cookie;
  return parseCookiesFromRawHeader(rawCookie);
};

export const parseCookiesFromRawHeader = (
  rawCookie: string | undefined
): Record<string, string> => {
  if (!rawCookie) return {};

  return rawCookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex < 0) return acc;
      const key = entry.slice(0, separatorIndex);
      const value = entry.slice(separatorIndex + 1);
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

export const getAccessTokenFromCookieHeader = (
  rawCookie: string | undefined
): string | null => {
  const cookies = parseCookiesFromRawHeader(rawCookie);
  return cookies[ACCESS_TOKEN_COOKIE] || null;
};

export const getAccessTokenFromCookies = (req: Request): string | null => {
  const cookies = parseCookies(req);
  return cookies[ACCESS_TOKEN_COOKIE] || null;
};

export const getRefreshTokenFromCookies = (req: Request): string | null => {
  const cookies = parseCookies(req);
  return cookies[REFRESH_TOKEN_COOKIE] || null;
};

export const setAuthCookies = (
  res: Response,
  session: { accessToken: string; refreshToken: string; expiresIn: number }
) => {
  const accessTokenMaxAgeMs = Math.max(session.expiresIn, 60) * 1000;
  const refreshTokenMaxAgeMs = 1000 * 60 * 60 * 24 * 30;

  res.cookie(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...cookieBaseOptions,
    maxAge: accessTokenMaxAgeMs,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...cookieBaseOptions,
    maxAge: refreshTokenMaxAgeMs,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieBaseOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieBaseOptions);
};

export const createPkceChallenge = (): {
  codeVerifier: string;
  codeChallenge: string;
} => {
  const codeVerifier = crypto.randomBytes(64).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
};

export const setGoogleOauthStateCookie = (
  res: Response,
  payload: GoogleOauthStatePayload
) => {
  const encoded = encodeSignedCookie(payload);
  res.cookie(GOOGLE_OAUTH_COOKIE, encoded, {
    ...cookieBaseOptions,
    maxAge: 1000 * 60 * 10,
  });
};

export const readGoogleOauthStateCookie = (
  req: Request
): GoogleOauthStatePayload | null => {
  const cookies = parseCookies(req);
  const rawValue = cookies[GOOGLE_OAUTH_COOKIE];
  if (!rawValue) return null;
  return decodeSignedCookie<GoogleOauthStatePayload>(rawValue);
};

export const clearGoogleOauthStateCookie = (res: Response) => {
  res.clearCookie(GOOGLE_OAUTH_COOKIE, cookieBaseOptions);
};

const isAllowedAbsoluteRedirect = (target: string): boolean => {
  try {
    const targetUrl = new URL(target);
    return targetUrl.origin === clientOrigin;
  } catch {
    return false;
  }
};

export const sanitizeRedirectTarget = (next?: string): string => {
  if (!next) return env.AUTH_SUCCESS_REDIRECT_URL;

  if (next.startsWith("/")) {
    try {
      return new URL(next, env.CLIENT_URL).toString();
    } catch {
      return env.AUTH_SUCCESS_REDIRECT_URL;
    }
  }

  if (isAllowedAbsoluteRedirect(next)) {
    return next;
  }

  return env.AUTH_SUCCESS_REDIRECT_URL;
};

export const buildErrorRedirect = (): string => {
  return env.AUTH_ERROR_REDIRECT_URL;
};
