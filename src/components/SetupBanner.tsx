import { Alert, AlertTitle } from '@mui/material';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Renders a prominent setup message when Supabase env vars are missing.
 */
export function SetupBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <Alert severity="warning" sx={{ borderRadius: 0 }}>
      <AlertTitle>Setup required</AlertTitle>
      Create a <code>.env</code> file in the project root with{' '}
      <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>. Get both from Supabase Dashboard → Settings → API. Then run the migration in <code>supabase/migrations/</code> and restart the dev server.
    </Alert>
  );
}
