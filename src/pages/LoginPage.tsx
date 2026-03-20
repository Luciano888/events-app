import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { signIn } from '../services/authService';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
  const redirectTo = fromState ? `${fromState.pathname}${fromState.search ?? ''}` : '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>{t('auth.loginTitle')}</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>{loading ? t('auth.loading') : t('auth.loginTitle')}</Button>
          </Stack>
        </form>
      </Paper>
      <Typography sx={{ mt: 2 }}>{t('auth.noAccount')} <Link to="/signup">{t('auth.goSignup')}</Link></Typography>
    </Box>
  );
}
