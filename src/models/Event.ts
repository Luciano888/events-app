import { EventType } from './enums';
import { Visibility } from './enums';

/**
 * Geolocation data for an event (latitude, longitude).
 */
export interface GeolocationData {
  latitude: number;
  longitude: number;
}

/** Supported cover crop aspect ratios (Instagram-style). */
export type CoverAspectRatio = '1:1' | '4:5' | '3:4';

export const COVER_ASPECT_RATIOS: CoverAspectRatio[] = ['1:1', '4:5', '3:4'];

/** CSS aspect-ratio value for a given CoverAspectRatio. */
export function getCoverAspectRatioCss(ratio: CoverAspectRatio | null | undefined): string {
  if (!ratio) return '1'; // default square
  switch (ratio) {
    case '1:1': return '1';
    case '4:5': return '4 / 5';
    case '3:4': return '3 / 4';
    default: return '1';
  }
}

/**
 * Event entity. Matches the Supabase `events` table.
 * All code and documentation in English (OOP model).
 */
export interface EventRow {
  id: string;
  name: string;
  date_time: string;
  event_type: EventType;
  visibility: Visibility;
  user_id: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  cover_cloudinary_public_id?: string | null;
  cover_aspect_ratio?: string | null;
  address?: string | null;
  created_at?: string;
}

/**
 * Input shape for creating a new event.
 */
export interface CreateEventInput {
  name: string;
  date_time: string;
  event_type: EventType;
  visibility: Visibility;
  latitude: number;
  longitude: number;
  description?: string | null;
  cover_cloudinary_public_id?: string | null;
  cover_aspect_ratio?: CoverAspectRatio | null;
  address?: string | null;
}

/**
 * Event class (OOP). Wraps row data and provides helpers.
 */
export class Event {
  constructor(public readonly row: EventRow) {}

  get id(): string {
    return this.row.id;
  }

  get name(): string {
    return this.row.name;
  }

  get dateTime(): string {
    return this.row.date_time;
  }

  get eventType(): EventType {
    return this.row.event_type;
  }

  get visibility(): Visibility {
    return this.row.visibility;
  }

  get userId(): string {
    return this.row.user_id;
  }

  get latitude(): number {
    return this.row.latitude;
  }

  get longitude(): number {
    return this.row.longitude;
  }

  get description(): string | null | undefined {
    return this.row.description;
  }

  get coverCloudinaryPublicId(): string | null | undefined {
    return this.row.cover_cloudinary_public_id;
  }

  get coverAspectRatio(): CoverAspectRatio | null | undefined {
    const r = this.row.cover_aspect_ratio;
    if (r === '1:1' || r === '4:5' || r === '3:4') return r;
    return undefined;
  }

  get address(): string | null | undefined {
    return this.row.address;
  }

  get createdAt(): string | undefined {
    return this.row.created_at;
  }

  /** Returns geolocation for map markers. */
  getGeolocation(): GeolocationData {
    return { latitude: this.row.latitude, longitude: this.row.longitude };
  }

  /** Parses date_time for display (e.g. "March 15, 2026, 10:00 PM"). */
  getDisplayDate(): string {
    const d = new Date(this.row.date_time);
    const dateStr = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  }
}
