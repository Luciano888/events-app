import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Stack,
  Paper,
  IconButton,
  Skeleton,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { fetchEventById, updateEvent } from '../services/eventService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { LocationPicker } from '../components/LocationPicker';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { FocalPointEditor, type FocalPoint, type CoverAspectRatio } from '../components/FocalPointEditor';
import { uploadImage, isUploadConfigured } from '../services/cloudinaryService';
import { buildImageUrl } from '../lib/cloudinary';
import { COVER_ASPECT_RATIOS, Event } from '../models/Event';
import { EventType, Visibility, EVENT_TYPE_LABELS, VISIBILITY_LABELS } from '../models/enums';
import { isoToDatetimeLocalValue } from '../utils/datetimeLocal';

export function EditEventPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [eventType, setEventType] = useState<EventType>(EventType.Social);
  const [visibility, setVisibility] = useState<Visibility>(Visibility.Public);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [coverPosition, setCoverPosition] = useState<FocalPoint>({ x: 50, y: 50 });
  const [coverAspectRatio, setCoverAspectRatio] = useState<CoverAspectRatio>('1:1');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!id) {
      setLoadingEvent(false);
      setLoadError(t('events.eventNotFound'));
      return;
    }
    setLoadingEvent(true);
    setLoadError(null);
    fetchEventById(id)
      .then((e) => {
        setEvent(e);
        if (e) {
          setName(e.name);
          setDateTime(isoToDatetimeLocalValue(e.dateTime));
          setEventType(e.eventType);
          setVisibility(e.visibility);
          setAddress(e.address ?? '');
          setLatitude(e.latitude);
          setLongitude(e.longitude);
          setDescription(e.description ?? '');
          setCoverRemoved(!e.coverCloudinaryPublicId);
          setCoverFile(null);
          setCoverAspectRatio(e.coverAspectRatio ?? '1:1');
          setCoverPosition({ x: 50, y: 50 });
        }
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : t('events.failedToLoadEvent')))
      .finally(() => setLoadingEvent(false));
  }, [id, t]);

  const existingCoverSrc =
    event?.coverCloudinaryPublicId && !coverRemoved ? buildImageUrl(event.coverCloudinaryPublicId) : '';

  const showCoverEditor =
    isUploadConfigured() && ((coverFile && coverPreviewUrl) || (!!existingCoverSrc && !coverFile));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !id || !event) return;
    setError(null);
    if (latitude === 0 && longitude === 0) {
      setError(t('events.searchAddressRequired'));
      return;
    }
    setLoading(true);
    try {
      let coverPublicId: string | null;
      if (coverFile && isUploadConfigured()) {
        const result = await uploadImage(coverFile);
        coverPublicId = result.public_id;
      } else if (coverRemoved) {
        coverPublicId = null;
      } else {
        coverPublicId = event.coverCloudinaryPublicId ?? null;
      }

      await updateEvent(id, {
        name,
        date_time: new Date(dateTime).toISOString(),
        event_type: eventType,
        visibility,
        latitude,
        longitude,
        description: description.trim() || null,
        cover_cloudinary_public_id: coverPublicId,
        cover_aspect_ratio: coverPublicId ? coverAspectRatio : null,
        address: address.trim() || null,
      });
      showMessage(t('events.eventUpdated'), 'success');
      navigate(`/event/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('events.failedToUpdateEvent'));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loadingEvent) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (loadError || !id) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Alert severity="error">{loadError ?? t('events.eventNotFound')}</Alert>
        <Button component={Link} to="/" sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
          {t('events.back')}
        </Button>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Typography>{t('events.eventNotFound')}</Typography>
        <Button component={Link} to="/" sx={{ mt: 2 }}>
          {t('events.back')}
        </Button>
      </Box>
    );
  }

  if (user && event.userId !== user.id) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Alert severity="warning">{t('events.editEventForbidden')}</Alert>
        <Button component={Link} to={`/event/${id}`} sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
          {t('events.backToEvent')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Button component={Link} to={`/event/${id}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        {t('events.backToEvent')}
      </Button>
      <Typography variant="h5" gutterBottom>
        {t('events.editEventTitle')}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label={t('events.name')} value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField
              label={t('events.dateAndTime')}
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Typography variant="subtitle2">{t('events.locationHint')}</Typography>
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={(lat, lon, displayName) => {
                setLatitude(lat);
                setLongitude(lon);
                setAddress(displayName);
              }}
              label={t('events.address')}
              placeholder={t('events.addressPlaceholder')}
            />
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />

            <TextField
              label={t('events.descriptionOptional')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              placeholder={t('events.descriptionPlaceholder')}
              fullWidth
            />

            {isUploadConfigured() ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('events.coverPhotoOptional')}
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setCoverFile(file);
                    setCoverRemoved(false);
                    if (file) setCoverPosition({ x: 50, y: 50 });
                    e.target.value = '';
                  }}
                />
                {showCoverEditor ? (
                  <Box sx={{ position: 'relative', width: '100%' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {COVER_ASPECT_RATIOS.map((ratio) => (
                        <Button
                          key={ratio}
                          size="small"
                          variant={coverAspectRatio === ratio ? 'contained' : 'outlined'}
                          onClick={() => setCoverAspectRatio(ratio)}
                          sx={{ minWidth: 56 }}
                        >
                          {ratio}
                        </Button>
                      ))}
                    </Box>
                    <FocalPointEditor
                      src={coverFile && coverPreviewUrl ? coverPreviewUrl : existingCoverSrc}
                      position={coverPosition}
                      onChange={setCoverPosition}
                      aspectRatio={coverAspectRatio}
                      draggable
                      sx={{ width: '100%' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {t('events.dragCoverHint')}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverRemoved(true);
                      }}
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                      aria-label={t('events.removeCover')}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Stack spacing={1} direction="row" flexWrap="wrap" alignItems="center">
                    <Button variant="outlined" size="small" startIcon={<PhotoCameraIcon />} onClick={() => coverInputRef.current?.click()}>
                      {event.coverCloudinaryPublicId && !coverRemoved ? t('events.changeCoverPhoto') : t('events.addCoverPhoto')}
                    </Button>
                    {event.coverCloudinaryPublicId && !coverRemoved && !coverFile && (
                      <Button variant="text" size="small" color="error" onClick={() => setCoverRemoved(true)}>
                        {t('events.removeCover')}
                      </Button>
                    )}
                  </Stack>
                )}
              </Box>
            ) : (
              event.coverCloudinaryPublicId &&
              !coverRemoved && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('events.coverPhotoOptional')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('events.coverEditRequiresCloudinary')}
                  </Typography>
                  <Button variant="text" size="small" color="error" onClick={() => setCoverRemoved(true)}>
                    {t('events.removeCover')}
                  </Button>
                </Box>
              )
            )}

            <FormControl fullWidth>
              <InputLabel>{t('events.type')}</InputLabel>
              <Select value={eventType} label={t('events.type')} onChange={(e) => setEventType(e.target.value as EventType)}>
                {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((et) => (
                  <MenuItem key={et} value={et}>
                    {t(`enums.eventType.${et}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('events.visibility')}</InputLabel>
              <Select value={visibility} label={t('events.visibility')} onChange={(e) => setVisibility(e.target.value as Visibility)}>
                {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((v) => (
                  <MenuItem key={v} value={v}>
                    {t(`enums.visibility.${v}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? t('events.savingEvent') : t('events.saveEventChanges')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
