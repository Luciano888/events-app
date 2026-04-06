import { supabase } from '../lib/supabase';
import { getSiteOrigin } from '../utils/siteOrigin';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Sends password reset email. Add redirect URL in Supabase Dashboard → Auth → URL configuration. */
export async function requestPasswordReset(email: string) {
  const origin = getSiteOrigin();
  const redirectTo = origin ? `${origin}/reset-password` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
