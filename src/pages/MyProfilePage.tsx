import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Skeleton,
  Avatar,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useEventsUserIsAttending } from '../hooks/useEventsUserIsAttending';
import { updateProfile } from '../services/profileService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { EventCard } from '../components/EventCard';
import { useAttendanceCounts } from '../hooks/useAttendanceCounts';

export function MyProfilePage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id ?? null, true);
  const { events, loading: eventsLoading, error: eventsError } = useEventsUserIsAttending(user?.id ?? null, user?.id ?? null);
  const eventIds = events.map((e) => e.id);
  const attendanceCounts = useAttendanceCounts(eventIds);
  const { showMessage } = useSnackbar();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setFormError(null);
    setSaving(true);
    try {
      await updateProfile(user.id, {
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
      });
      showMessage('Profile updated', 'success');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <Box>
        <Alert severity="info">Sign in to view and edit your profile.</Alert>
      </Box>
    );
  }

  if (profileLoading && !profile) {
    return <Skeleton variant="rounded" height={300} />;
  }
  if (profileError) {
    return <Alert severity="error">{profileError}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>My profile</Typography>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <Avatar src={avatarUrl || undefined} sx={{ width: 80, height: 80 }}>
              {(displayName || user.email)?.[0]?.toUpperCase() ?? '?'}
            </Avatar>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <TextField
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                fullWidth
                size="small"
                placeholder="https://..."
              />
              <TextField
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
              {formError && <Alert severity="error">{formError}</Alert>}
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                Save
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>My upcoming events</Typography>
      {eventsError && <Alert severity="error" sx={{ mb: 1 }}>{eventsError}</Alert>}
      {eventsLoading ? (
        <Stack spacing={1}>
          {[1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={100} />
          ))}
        </Stack>
      ) : events.length === 0 ? (
        <Typography color="text.secondary">You are not going to any events yet. Browse events and tap &quot;I&apos;m going&quot; to add them here.</Typography>
      ) : (
        <Stack spacing={1}>
          {events.map((e) => (
            <EventCard key={e.id} event={e} attendanceCount={attendanceCounts[e.id] ?? 0} currentUserId={user?.id ?? null} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
