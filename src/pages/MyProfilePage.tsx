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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useEventsUserIsAttending } from '../hooks/useEventsUserIsAttending';
import { updateProfile, getProfilesByIds } from '../services/profileService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { EventCard } from '../components/EventCard';
import { useAttendanceCounts } from '../hooks/useAttendanceCounts';
import { FocalPointEditor, type FocalPoint } from '../components/FocalPointEditor';
import { uploadImage, isUploadConfigured } from '../services/cloudinaryService';
import type { Profile } from '../models/Profile';
import { getAvatarObjectPosition } from '../utils/avatarPosition';

export function MyProfilePage() {
  const { t } = useTranslation();
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<FocalPoint>({ x: 50, y: 50 });
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
      setBio(profile.bio ?? '');
      setAvatarPosition({
        x: profile.avatar_position_x ?? 50,
        y: profile.avatar_position_y ?? 50,
      });
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setFormError(null);
    setSaving(true);
    try {
      let finalAvatarUrl = profile?.avatar_url ?? null;
      if (avatarFile && isUploadConfigured()) {
        const result = await uploadImage(avatarFile);
        finalAvatarUrl = result.secure_url;
        setAvatarFile(null);
      }
      await updateProfile(user.id, {
        display_name: displayName.trim() || null,
        avatar_url: finalAvatarUrl,
        avatar_position_x: Math.round(avatarPosition.x),
        avatar_position_y: Math.round(avatarPosition.y),
        bio: bio.trim() || null,
      });
      showMessage(t('profile.profileUpdated'), 'success');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t('profile.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <Box>
        <Alert severity="info">{t('profile.signInProfile')}</Alert>
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
      <Typography variant="h5" gutterBottom>{t('profile.myProfile')}</Typography>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <Box sx={{ position: 'relative' }}>
              <input
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setAvatarFile(file);
                  if (file) setAvatarPosition({ x: 50, y: 50 });
                }}
              />
              <Avatar
                src={avatarPreviewUrl || profile?.avatar_url || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  cursor: isUploadConfigured() ? 'pointer' : 'default',
                  '& .MuiAvatar-img': {
                    objectPosition: avatarPreviewUrl
                      ? `${avatarPosition.x}% ${avatarPosition.y}%`
                      : getAvatarObjectPosition(profile),
                  },
                }}
                onClick={() => isUploadConfigured() && avatarInputRef.current?.click()}
              >
                {(displayName || user.email)?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              {isUploadConfigured() && (
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => avatarInputRef.current?.click()}
                  title={t('profile.uploadPhoto')}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              )}
              {avatarFile && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('profile.newPhotoSelected')}
                </Typography>
              )}
              {avatarFile && avatarPreviewUrl && (
                <Box sx={{ mt: 1, width: 220 }}>
                  <FocalPointEditor
                    src={avatarPreviewUrl}
                    position={avatarPosition}
                    onChange={setAvatarPosition}
                    aspectRatio="1:1"
                    draggable
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {t('profile.avatarCropHint')}
                  </Typography>
                </Box>
              )}
            </Box>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <TextField
                label={t('profile.displayName')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={t('profile.bio')}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
              {formError && <Alert severity="error">{formError}</Alert>}
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                {t('profile.save')}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Button component={Link} to="/friends" startIcon={<GroupIcon />} variant="outlined" size="small" sx={{ mb: 2 }}>
        {t('profile.friends')}
      </Button>

      <Typography variant="h6" gutterBottom>{t('profile.myPlans')}</Typography>
      <Tabs value={plansTimeFilter} onChange={(_, v) => setPlansTimeFilter(v as 'upcoming' | 'past' | 'all')} sx={{ mb: 2 }}>
        <Tab label={t('events.upcoming')} value="upcoming" />
        <Tab label={t('events.past')} value="past" />
        <Tab label={t('events.all')} value="all" />
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
            ? t('profile.noUpcomingPlans')
            : plansTimeFilter === 'past'
              ? t('profile.noPastPlans')
              : t('profile.noPlans')}
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
