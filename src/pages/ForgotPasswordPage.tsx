import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { requestPasswordReset } from '../services/authService';
import { authErrorToTranslationKey } from '../utils/authErrorKey';
import { isSupabaseConfigured } from '../lib/supabase';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError(t('auth.errorGeneric'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err: unknown) {
      setError(t(authErrorToTranslationKey(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('auth.forgotPasswordTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('auth.forgotPasswordBody')}
      </Typography>
      {sent ? (
        <Alert severity="success">{t('auth.resetEmailSent')}</Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label={t('auth.email')}
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" disabled={loading} fullWidth>
                {loading ? t('auth.loading') : t('auth.sendResetLink')}
              </Button>
            </Stack>
          </form>
        </Paper>
      )}
      <Typography sx={{ mt: 2 }}>
        <Link to="/login">{t('auth.backToLogin')}</Link>
      </Typography>
    </Box>
  );
}
