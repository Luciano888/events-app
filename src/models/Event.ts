import { EventType } from './enums';
import { Visibility } from './enums';

/**
 * Geolocation data for an event (latitude, longitude).
 */
export interface GeolocationData {
  latitude: number;
  longitude: number;
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

  get createdAt(): string | undefined {
    return this.row.created_at;
  }

  /** Returns geolocation for map markers. */
  getGeolocation(): GeolocationData {
    return { latitude: this.row.latitude, longitude: this.row.longitude };
  }

  /** Parses date_time for display. */
  getDisplayDate(): string {
    return new Date(this.row.date_time).toLocaleString();
  }
}
