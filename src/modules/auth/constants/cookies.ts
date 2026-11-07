import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 دقیقه
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 روز

// تنظیمات مشترک امنیتی کوکی
export const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // محافظت در برابر XSS
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

export const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  path: '/',
};

// refresh token فقط به مسیرهای auth فرستاده می‌شود
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  path: '/api/auth',
};
