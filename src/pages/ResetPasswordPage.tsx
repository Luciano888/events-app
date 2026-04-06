import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Alert, Paper, Stack, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { updatePassword } from '../services/authService';
import { authErrorToTranslationKey } from '../utils/authErrorKey';
import { PasswordTextField } from '../components/PasswordTextField';

type Phase = 'loading' | 'ready' | 'no_session';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setPhase('no_session');
      return;
    }
    let cancelled = false;

    async function resolveSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setPhase('ready');
        return;
      }
      await new Promise((r) => setTimeout(r, 700));
      if (cancelled) return;
      const { data: { session: retry } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (retry?.user) setPhase('ready');
      else setPhase('no_session');
    }

    void resolveSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t('auth.errorPasswordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordsMustMatch'));
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      window.location.replace('/');
    } catch (err: unknown) {
      setError(t(authErrorToTranslationKey(err)));
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'loading') {
    return (
      <Box sx={{ maxWidth: 360, mx: 'auto', display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress aria-label={t('auth.loading')} />
      </Box>
    );
  }

  if (phase === 'no_session') {
    return (
      <Box sx={{ maxWidth: 360, mx: 'auto' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('auth.invalidResetLink')}
        </Alert>
        <Typography>
          <Link to="/forgot-password">{t('auth.requestNewResetLink')}</Link>
        </Typography>
        <Typography sx={{ mt: 1 }}>
          <Link to="/login">{t('auth.backToLogin')}</Link>
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('auth.resetPasswordTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('auth.resetPasswordBody')}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <PasswordTextField
              label={t('auth.newPassword')}
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
            />
            <PasswordTextField
              label={t('auth.confirmPassword')}
              name="confirm-new-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={submitting} fullWidth>
              {submitting ? t('auth.loading') : t('auth.saveNewPassword')}
            </Button>
          </Stack>
        </form>
      </Paper>
      <Typography sx={{ mt: 2 }}>
        <Link to="/login">{t('auth.backToLogin')}</Link>
      </Typography>
    </Box>
  );
}
