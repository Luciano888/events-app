import { useState, useEffect, useMemo, useRef } from 'react';
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
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import GroupIcon from '@mui/icons-material/Group';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useEventsUserIsAttending } from '../hooks/useEventsUserIsAttending';
import { updateProfile, getProfilesByIds } from '../services/profileService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { EventCard } from '../components/EventCard';
import { useAttendanceCounts } from '../hooks/useAttendanceCounts';
import { uploadImage, isUploadConfigured } from '../services/cloudinaryService';
import type { Profile } from '../models/Profile';

export function MyProfilePage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id ?? null, true);
  const { events, loading: eventsLoading, error: eventsError } = useEventsUserIsAttending(user?.id ?? null, user?.id ?? null);
  const [plansTimeFilter, setPlansTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const filteredPlans = useMemo(() => {
    const now = Date.now();
    let list = [...events];
    if (plansTimeFilter === 'upcoming') {
      list = list.filter((e) => new Date(e.dateTime).getTime() >= now);
      list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    } else if (plansTimeFilter === 'past') {
      list = list.filter((e) => new Date(e.dateTime).getTime() < now);
      list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    } else {
      list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
    return list;
  }, [events, plansTimeFilter]);

  const eventIds = useMemo(() => filteredPlans.map((e) => e.id), [filteredPlans]);
  const attendanceCounts = useAttendanceCounts(eventIds);
  const creatorIds = useMemo(() => [...new Set(filteredPlans.map((e) => e.userId))], [filteredPlans]);
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, Profile>>({});
  const { showMessage } = useSnackbar();

  useEffect(() => {
    if (creatorIds.length === 0) {
      setCreatorProfiles({});
      return;
    }
    getProfilesByIds(creatorIds)
      .then((list) => {
        const map: Record<string, Profile> = {};
        list.forEach((p) => { map[p.id] = p; });
        setCreatorProfiles(map);
      })
      .catch(() => setCreatorProfiles({}));
  }, [creatorIds.join(',')]);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);
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
      let finalAvatarUrl = avatarUrl.trim() || null;
      if (avatarFile && isUploadConfigured()) {
        const result = await uploadImage(avatarFile);
        finalAvatarUrl = result.secure_url;
        setAvatarUrl(finalAvatarUrl);
        setAvatarFile(null);
      }
      await updateProfile(user.id, {
        display_name: displayName.trim() || null,
        avatar_url: finalAvatarUrl,
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
            <Box sx={{ position: 'relative' }}>
              <input
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                style={{ display: 'none' }}
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
              <Avatar
                src={avatarPreviewUrl || avatarUrl || undefined}
                sx={{ width: 80, height: 80, cursor: isUploadConfigured() ? 'pointer' : 'default' }}
                onClick={() => isUploadConfigured() && avatarInputRef.current?.click()}
              >
                {(displayName || user.email)?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              {isUploadConfigured() && (
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => avatarInputRef.current?.click()}
                  title="Upload profile photo"
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              )}
              {avatarFile && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  New photo selected. Save to upload.
                </Typography>
              )}
            </Box>
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
                placeholder="Or paste an image URL"
                helperText={isUploadConfigured() ? 'Upload a photo above or paste a URL here.' : 'Paste an image URL (configure Cloudinary to upload photos).'}
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

      <Button component={Link} to="/friends" startIcon={<GroupIcon />} variant="outlined" size="small" sx={{ mb: 2 }}>
        Friends
      </Button>

      <Typography variant="h6" gutterBottom>My plans</Typography>
      <Tabs value={plansTimeFilter} onChange={(_, v) => setPlansTimeFilter(v as 'upcoming' | 'past' | 'all')} sx={{ mb: 2 }}>
        <Tab label="Upcoming" value="upcoming" />
        <Tab label="Past" value="past" />
        <Tab label="All" value="all" />
      </Tabs>
      {eventsError && <Alert severity="error" sx={{ mb: 1 }}>{eventsError}</Alert>}
      {eventsLoading ? (
        <Stack spacing={1}>
          {[1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={100} />
          ))}
        </Stack>
      ) : filteredPlans.length === 0 ? (
        <Typography color="text.secondary">
          {plansTimeFilter === 'upcoming'
            ? 'No upcoming plans. Browse events and tap &quot;I&apos;m going&quot; to add them here.'
            : plansTimeFilter === 'past'
              ? 'No past events yet.'
              : 'You are not going to any events yet. Browse events and tap &quot;I&apos;m going&quot; to add them here.'}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {filteredPlans.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              attendanceCount={attendanceCounts[e.id] ?? 0}
              currentUserId={user?.id ?? null}
              creatorProfile={creatorProfiles[e.userId]}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
