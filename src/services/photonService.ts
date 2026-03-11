/**
 * Photon (Komoot) geocoding API — free, no API key.
 * Used for address autocomplete (search-as-you-type).
 * Fair use: debounce requests and avoid high request rates.
 * @see https://photon.komoot.io/
 */

const PHOTON_BASE = 'https://photon.komoot.io/api';

export interface PhotonFeature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    country?: string;
    countrycode?: string;
    state?: string;
    district?: string;
    locality?: string;
    [key: string]: unknown;
  };
}

export interface PhotonResult {
  lat: number;
  lon: number;
  displayName: string;
  raw: PhotonFeature;
}

function buildDisplayName(f: PhotonFeature): string {
  const p = f.properties;
  const parts = [
    p.name,
    p.street && (p.housenumber ? `${p.street} ${p.housenumber}` : p.street),
    p.locality || p.district,
    p.postcode,
    p.city,
    p.state,
    p.country,
  ].filter(Boolean);
  return parts.join(', ') || 'Unknown';
}

/**
 * Fetches address suggestions from Photon. Returns coordinates and display string.
 * coordinates in GeoJSON are [longitude, latitude].
 */
export async function fetchPhotonSuggestions(query: string, limit = 6): Promise<PhotonResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `${PHOTON_BASE}/?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = data.features ?? [];
  return features.map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return {
      lat,
      lon,
      displayName: buildDisplayName(f),
      raw: f,
    };
  });
}
