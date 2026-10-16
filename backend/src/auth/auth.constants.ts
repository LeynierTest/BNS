import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';

export const ACCESS_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME_TYPE = /^image\/(jpeg|png|webp)$/;

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function accessTokenCookieOptions(): CookieOptions {
  return {
    ...baseCookieOptions(),
    maxAge: ACCESS_TOKEN_TTL_MS,
  };
}

export function clearAccessTokenCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
