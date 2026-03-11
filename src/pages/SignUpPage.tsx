import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, Paper, Stack } from '@mui/material';
import { signUp } from '../services/authService';

export function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password);
      setSuccess(true);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Box sx={{ maxWidth: 360, mx: 'auto' }}>
        <Alert severity="success">Check your email to confirm your account.</Alert>
        <Typography sx={{ mt: 2 }}><Link to="/login">Go to login</Link></Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Sign up</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth inputProps={{ minLength: 6 }} />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>{loading ? 'Loading...' : 'Sign up'}</Button>
          </Stack>
        </form>
      </Paper>
      <Typography sx={{ mt: 2 }}>Already have an account? <Link to="/login">Log in</Link></Typography>
    </Box>
  );
}
