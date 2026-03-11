import { useState, useEffect } from 'react';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  error: string | null;
}

/**
 * Hook to get the user's current geolocation.
 * Returns latitude, longitude, and optional error message.
 */
export function useGeolocation(): GeoPosition {
  const [position, setPosition] = useState<GeoPosition>({
    latitude: 0,
    longitude: 0,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition((p) => ({ ...p, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
        });
      },
      (err) => {
        setPosition((p) => ({
          ...p,
          error: err.message || 'Failed to get location',
        }));
      }
    );
  }, []);

  return position;
}
