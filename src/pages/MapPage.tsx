import { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button, Skeleton } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../hooks/useGeolocation';
import { fetchEventsForMap } from '../services/eventService';
import { Event } from '../models/Event';
import { isSupabaseConfigured } from '../lib/supabase';

function CenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 || lng !== 0) map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);
  return null;
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function MapPage() {
  const { t, i18n } = useTranslation();
  const { latitude, longitude, error: geoError } = useGeolocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchEventsForMap()
      .then(setEvents)
      .catch((e) => setError(e.message ?? t('events.failedToLoadEvents')))
      .finally(() => setLoading(false));
  }, []);

  const centerLat = latitude !== 0 ? latitude : -34.6;
  const centerLng = longitude !== 0 ? longitude : -58.4;

  if (!isSupabaseConfigured) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>{t('events.map')}</Typography>
        <Typography color="text.secondary">{t('events.configureMapSupabase')}</Typography>
      </Box>
    );
  }
  if (loading) return <Skeleton variant="rounded" height={420} />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{t('events.map')}</Typography>
      {geoError && <Alert severity="warning" sx={{ mb: 1 }}>{t('events.locationWarning', { error: geoError })}</Alert>}
      {error && <Alert severity="error" action={<Button size="small" onClick={() => window.location.reload()}>{t('events.retry')}</Button>} sx={{ mb: 1 }}>{error}</Alert>}
      <Box sx={{ height: 400, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer center={[centerLat, centerLng]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <CenterMap lat={latitude} lng={longitude} />
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {events.map((event) => (
            <Marker key={event.id} position={[event.latitude, event.longitude]} icon={defaultIcon}>
              <Popup>
                <strong>{event.name}</strong><br />
                {event.getDisplayDate(i18n.language)}<br />
                {t(`enums.eventType.${event.eventType}`)}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
}
