/**
 * Base URL for auth redirects (password recovery, future OAuth).
 * Prefer VITE_SITE_URL in production; fall back to current origin in the browser.
 */
export function getSiteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}
