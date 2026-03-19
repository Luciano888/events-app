import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { createEvent } from '../services/eventService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { LocationPicker } from '../components/LocationPicker';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { FocalPointEditor, type FocalPoint, type CoverAspectRatio } from '../components/FocalPointEditor';
import { uploadImage, isUploadConfigured } from '../services/cloudinaryService';
import { COVER_ASPECT_RATIOS } from '../models/Event';
import { EventType, Visibility, EVENT_TYPE_LABELS, VISIBILITY_LABELS } from '../models/enums';

export function CreateEventPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();
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
  const [coverPosition, setCoverPosition] = useState<FocalPoint>({ x: 50, y: 50 });
  const [coverAspectRatio, setCoverAspectRatio] = useState<CoverAspectRatio>('1:1');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (latitude === 0 && longitude === 0) {
      setError(t('events.searchAddressRequired'));
      return;
    }
    setLoading(true);
    try {
      let coverPublicId: string | null = null;
      if (coverFile && isUploadConfigured()) {
        const result = await uploadImage(coverFile);
        coverPublicId = result.public_id;
      }
      await createEvent(
        {
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
        },
        user.id
      );
      showMessage(t('events.eventCreated'), 'success');
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('events.failedToCreateEvent'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>{t('events.createEventTitle')}</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label={t('events.name')} value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label={t('events.dateAndTime')} type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required fullWidth InputLabelProps={{ shrink: true }} />

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
            <LocationPicker latitude={latitude} longitude={longitude} onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />

            <TextField
              label={t('events.descriptionOptional')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              placeholder={t('events.descriptionPlaceholder')}
              fullWidth
            />

            {isUploadConfigured() && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>{t('events.coverPhotoOptional')}</Typography>
                <input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setCoverFile(file);
                  if (file) setCoverPosition({ x: 50, y: 50 });
                }}
                />
                {coverFile && coverPreviewUrl ? (
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
                      src={coverPreviewUrl}
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
                      onClick={() => setCoverFile(null)}
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Button variant="outlined" size="small" startIcon={<PhotoCameraIcon />} onClick={() => coverInputRef.current?.click()}>
                    {t('events.addCoverPhoto')}
                  </Button>
                )}
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>{t('events.type')}</InputLabel>
              <Select value={eventType} label={t('events.type')} onChange={(e) => setEventType(e.target.value as EventType)}>
                {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((eventType) => (
                  <MenuItem key={eventType} value={eventType}>{t(`enums.eventType.${eventType}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('events.visibility')}</InputLabel>
              <Select value={visibility} label={t('events.visibility')} onChange={(e) => setVisibility(e.target.value as Visibility)}>
                {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((v) => (
                  <MenuItem key={v} value={v}>{t(`enums.visibility.${v}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading}>{loading ? t('events.creating') : t('events.createEvent')}</Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
