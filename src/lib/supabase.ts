import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/** True when env vars are set; use this to skip Supabase calls and show setup message. */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

/**
 * Supabase client for auth and database access.
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.
 * Uses placeholder values when not set so the client never throws on import.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-key'
);
