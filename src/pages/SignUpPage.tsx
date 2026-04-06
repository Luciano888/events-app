import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { signUp } from '../services/authService';
import { authErrorToTranslationKey } from '../utils/authErrorKey';
import { PasswordTextField } from '../components/PasswordTextField';

export function SignUpPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t('auth.passwordsMustMatch'));
      return;
    }
    setLoading(true);
    try {
      const data = await signUp(email, password);
      if (data.session) {
        navigate('/', { replace: true });
        return;
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(t(authErrorToTranslationKey(err)));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Box sx={{ maxWidth: 360, mx: 'auto' }}>
        <Alert severity="success">{t('auth.confirmEmail')}</Alert>
        <Typography sx={{ mt: 2 }}>
          <Link to="/login">{t('auth.goToLogin')}</Link>
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('auth.signupTitle')}
      </Typography>
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
            <PasswordTextField
              label={t('auth.password')}
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
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? t('auth.loading') : t('auth.signupTitle')}
            </Button>
          </Stack>
        </form>
      </Paper>
      <Typography sx={{ mt: 2 }}>
        {t('auth.hasAccount')} <Link to="/login">{t('auth.goLogin')}</Link>
      </Typography>
    </Box>
  );
}
