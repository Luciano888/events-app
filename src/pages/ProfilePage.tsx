import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  Skeleton,
  Avatar,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useEventsUserIsAttending } from '../hooks/useEventsUserIsAttending';
import { sendFriendRequest } from '../services/friendService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { EventCard } from '../components/EventCard';
import { useAttendanceCounts } from '../hooks/useAttendanceCounts';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile(userId ?? null);
  const { status, friendsCount, loading: connLoading, error: connError } = useConnectionStatus(user?.id ?? null, userId ?? null);
  const { events, loading: eventsLoading, error: eventsError } = useEventsUserIsAttending(userId ?? null, user?.id ?? null);
  const eventIds = events.map((e) => e.id);
  const attendanceCounts = useAttendanceCounts(eventIds);
  const { showMessage } = useSnackbar();

  const [sendingRequest, setSendingRequest] = useState(false);
  const [statusOverride, setStatusOverride] = useState<typeof status | null>(null);
  const effectiveStatus = statusOverride ?? status;

  async function handleConnect() {
    if (!user || !userId || user.id === userId) return;
    setSendingRequest(true);
    try {
      await sendFriendRequest(user.id, userId);
      setStatusOverride('pending_sent');
      showMessage('Connection request sent', 'success');
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Failed to send request', 'error');
    } finally {
      setSendingRequest(false);
    }
  }

  if (!userId) {
    return <Typography>Invalid profile.</Typography>;
  }

  const isOwnProfile = user?.id === userId;

  if (profileLoading && !profile) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }
  if (profileError || !profile) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">{profileError ?? 'Profile not found.'}</Alert>
      </Box>
    );
  }

  const displayName = profile.display_name?.trim() || 'User';
  const canConnect = user && !isOwnProfile && effectiveStatus === 'none';

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <Avatar src={profile.avatar_url ?? undefined} sx={{ width: 80, height: 80 }}>
              {displayName[0]?.toUpperCase() ?? '?'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{displayName}</Typography>
              {profile.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {profile.bio}
                </Typography>
              )}
              {!connLoading && friendsCount != null && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {friendsCount} connected
                </Typography>
              )}
              {user && !isOwnProfile && (
                <Box sx={{ mt: 1 }}>
                  {effectiveStatus === 'friends' && (
                    <Button size="small" startIcon={<CheckCircleIcon />} disabled>Connected</Button>
                  )}
                  {effectiveStatus === 'pending_sent' && (
                    <Button size="small" startIcon={<HourglassEmptyIcon />} disabled>Request sent</Button>
                  )}
                  {effectiveStatus === 'pending_received' && (
                    <Typography variant="body2" color="text.secondary">They sent you a request. Accept in Friends.</Typography>
                  )}
                  {canConnect && (
                    <Button variant="outlined" size="small" startIcon={<PersonAddIcon />} onClick={handleConnect} disabled={sendingRequest}>
                      Connect
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Only logged-in users see "Events they're going to" on someone else's profile (see functional doc). */}
      {user && (
        <>
          <Typography variant="h6" gutterBottom>Events they&apos;re going to</Typography>
          {connError && <Alert severity="error" sx={{ mb: 1 }}>{connError}</Alert>}
          {eventsError && <Alert severity="error" sx={{ mb: 1 }}>{eventsError}</Alert>}
          {eventsLoading ? (
            <Stack spacing={1}>
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={100} />
              ))}
            </Stack>
          ) : events.length === 0 ? (
            <Typography color="text.secondary">No upcoming events.</Typography>
          ) : (
            <Stack spacing={1}>
              {events.map((e) => (
                <EventCard key={e.id} event={e} attendanceCount={attendanceCounts[e.id] ?? 0} currentUserId={user?.id ?? null} />
              ))}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
