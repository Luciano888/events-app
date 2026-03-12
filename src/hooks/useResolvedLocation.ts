import { useState, useEffect } from 'react';
import { reverseGeocode } from '../services/photonService';

/**
 * Returns a display address: stored address, or reverse-geocoded from coordinates, or fallback coords string.
 * Used so event cards and detail show the same readable location (e.g. in My profile and Home).
 */
export function useResolvedLocation(
  latitude: number,
  longitude: number,
  storedAddress: string | null | undefined
): string {
  const [resolved, setResolved] = useState<string | null>(null);
  const hasStored = Boolean(storedAddress?.trim());

  useEffect(() => {
    if (hasStored) return;
    let cancelled = false;
    reverseGeocode(latitude, longitude)
      .then((addr) => {
        if (!cancelled) setResolved(addr);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, hasStored]);

  return storedAddress?.trim() || resolved || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
