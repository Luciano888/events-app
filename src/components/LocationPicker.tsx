import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number;
}

/**
 * Map with a draggable marker; on drag end or click, calls onLocationChange.
 */
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ latitude, longitude, onLocationChange, height = 280 }: LocationPickerProps) {
  const hasPosition = latitude !== 0 || longitude !== 0;
  const centerLat = hasPosition ? latitude : -34.6;
  const centerLng = hasPosition ? longitude : -58.4;

  return (
    <div style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer center={[centerLat, centerLng]} zoom={hasPosition ? 14 : 10} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <MapClickHandler onLocationChange={onLocationChange} />
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {hasPosition && (
          <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const pos = e.target.getLatLng();
                onLocationChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
