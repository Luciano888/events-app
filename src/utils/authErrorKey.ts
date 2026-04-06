import type { AuthError } from '@supabase/supabase-js';

/**
 * Maps Supabase Auth errors to i18n keys under `auth.*`.
 */
export function authErrorToTranslationKey(error: AuthError | Error | unknown): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) return 'auth.errorInvalidCredentials';
  if (lower.includes('email not confirmed')) return 'auth.errorEmailNotConfirmed';
  if (lower.includes('already registered') || lower.includes('user already exists'))
    return 'auth.errorUserAlreadyRegistered';
  if (lower.includes('password') && (lower.includes('at least') || lower.includes('6 characters')))
    return 'auth.errorPasswordTooShort';
  if (lower.includes('invalid email') || lower.includes('unable to validate email'))
    return 'auth.errorInvalidEmail';
  if (lower.includes('rate limit') || lower.includes('once every') || lower.includes('too many'))
    return 'auth.errorRateLimit';
  if (lower.includes('signup') && lower.includes('disabled')) return 'auth.errorSignupDisabled';
  if (
    lower.includes('jwt expired') ||
    lower.includes('invalid jwt') ||
    lower.includes('invalid refresh token') ||
    lower.includes('refresh token')
  )
    return 'auth.errorSessionInvalid';

  return 'auth.errorGeneric';
}
