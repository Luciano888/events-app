import { useState, useRef } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { createEvent } from '../services/eventService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { LocationPicker } from '../components/LocationPicker';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { uploadImage, isUploadConfigured } from '../services/cloudinaryService';
import { EventType, Visibility, EVENT_TYPE_LABELS, VISIBILITY_LABELS } from '../models/enums';

export function CreateEventPage() {
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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (latitude === 0 && longitude === 0) {
      setError('Search for an address above or pick a location on the map.');
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
          address: address.trim() || null,
        },
        user.id
      );
      showMessage('Event created successfully', 'success');
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Create event</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Date and time" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required fullWidth InputLabelProps={{ shrink: true }} />

            <Typography variant="subtitle2">Location — search for an address or click the map</Typography>
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={(lat, lon, displayName) => {
                setLatitude(lat);
                setLongitude(lon);
                setAddress(displayName);
              }}
              label="Address"
              placeholder="Type an address (e.g. street, city)..."
            />
            <LocationPicker latitude={latitude} longitude={longitude} onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />

            <TextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              placeholder="What's it about? Why should people come?"
              fullWidth
            />

            {isUploadConfigured() && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Cover photo (optional)</Typography>
                <input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                />
                {coverFile ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={URL.createObjectURL(coverFile)}
                      alt="Cover preview"
                      sx={{ maxWidth: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setCoverFile(null)}
                      sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Button variant="outlined" size="small" startIcon={<PhotoCameraIcon />} onClick={() => coverInputRef.current?.click()}>
                    Add cover photo
                  </Button>
                )}
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={eventType} label="Type" onChange={(e) => setEventType(e.target.value as EventType)}>
                {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
                  <MenuItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select value={visibility} label="Visibility" onChange={(e) => setVisibility(e.target.value as Visibility)}>
                {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((v) => (
                  <MenuItem key={v} value={v}>{VISIBILITY_LABELS[v]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Creating...' : 'Create event'}</Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
