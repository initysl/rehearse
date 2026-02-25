import { Request, Response, NextFunction } from 'express';
import {
  supabaseAuthApi,
  supabaseConfig,
  SupabaseRequestError,
} from '../config/supabase';
import { getAccessTokenFromCookies } from '../modules/auth/auth.utils';
import { JwtPayload } from '../types/global.types';

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split('.');
  if (segments.length < 2) return null;

  try {
    const payload = Buffer.from(segments[1], 'base64url').toString('utf8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  const cookieToken = getAccessTokenFromCookies(req);
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  try {
    const decoded = parseJwtPayload(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized — malformed token' });
    }

    if (
      typeof decoded.iss !== 'string' ||
      decoded.iss !== supabaseConfig.jwtIssuer
    ) {
      return res
        .status(401)
        .json({ error: 'Unauthorized — token issuer mismatch' });
    }

    const tokenAudience = decoded.aud;
    const audienceMatch =
      (typeof tokenAudience === 'string' &&
        tokenAudience === supabaseConfig.jwtAudience) ||
      (Array.isArray(tokenAudience) &&
        tokenAudience.includes(supabaseConfig.jwtAudience));

    if (!audienceMatch) {
      return res
        .status(401)
        .json({ error: 'Unauthorized — token audience mismatch' });
    }

    const user = await supabaseAuthApi.getUserFromAccessToken(token);
    const emailConfirmed = Boolean(user.email_confirmed_at);
    if (!emailConfirmed) {
      return res.status(403).json({
        error: 'Email confirmation required before accessing this resource',
      });
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'authenticated',
      emailConfirmed,
      aud: typeof decoded.aud === 'string' ? decoded.aud : null,
    };

    req.user = payload;
    req.accessToken = token;
    next();
  } catch (error) {
    const statusCode =
      error instanceof SupabaseRequestError ? error.statusCode : 401;
    return res
      .status(statusCode === 401 ? 401 : 500)
      .json({ error: 'Unauthorized — invalid or expired token' });
  }
};
