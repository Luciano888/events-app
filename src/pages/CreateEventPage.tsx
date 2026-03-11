import { useState } from 'react';
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
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { createEvent } from '../services/eventService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { LocationPicker } from '../components/LocationPicker';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
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
      await createEvent(
        {
          name,
          date_time: new Date(dateTime).toISOString(),
          event_type: eventType,
          visibility,
          latitude,
          longitude,
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

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Creating...' : 'Create event'}</Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
