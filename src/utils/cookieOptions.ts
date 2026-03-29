import { CookieOptions } from 'express';

export const getCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,       // JS cannot read this cookie — blocks XSS
    secure: isProduction, // HTTPS only in production, HTTP ok in dev
    sameSite: isProduction ? 'none' : 'lax',
    // 'none' required for cross-origin requests in production
    // 'lax' works fine for same-origin localhost dev
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
    path: '/',
  };
};

export const clearCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};