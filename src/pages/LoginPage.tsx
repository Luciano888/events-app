import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, Paper, Stack } from '@mui/material';
import { signIn } from '../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Log in</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>{loading ? 'Loading...' : 'Log in'}</Button>
          </Stack>
        </form>
      </Paper>
      <Typography sx={{ mt: 2 }}>No account? <Link to="/signup">Sign up</Link></Typography>
    </Box>
  );
}
