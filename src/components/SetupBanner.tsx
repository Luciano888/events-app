import { Alert, AlertTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Renders a prominent setup message when Supabase env vars are missing.
 */
export function SetupBanner() {
  const { t } = useTranslation();
  if (isSupabaseConfigured) return null;

  return (
    <Alert severity="warning" sx={{ borderRadius: 0 }}>
      <AlertTitle>{t('setup.title')}</AlertTitle>
      {t('setup.message')}
    </Alert>
  );
}
