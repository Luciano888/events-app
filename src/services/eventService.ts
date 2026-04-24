import { supabase } from '../lib/supabase';
import { Event } from '../models/Event';
import type { EventRow } from '../models/Event';
import type { CreateEventInput, UpdateEventInput } from '../models/Event';
import { getEventIdsUserIsAttending } from './attendanceService';
import { areFriends } from './friendService';
import { Visibility } from '../models/enums';

/**
 * Fetches events visible to the current user (public, or private if authenticated, or own drafts).
 * RLS on Supabase enforces visibility. We just select and order.
 */
export async function fetchVisibleEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date_time', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map((row) => new Event(row));
}

/**
 * Fetches events that have coordinates (for map). Same visibility rules via RLS.
 */
export async function fetchEventsForMap(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('date_time', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map((row) => new Event(row));
}

const EVENT_IDS_IN_CHUNK = 80;

/**
 * Fetches multiple events by ids. Subject to RLS (visibility). Order not guaranteed.
 * Chunked to avoid PostgREST URL / filter limits with many ids.
 */
export async function fetchEventsByIds(ids: string[]): Promise<Event[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += EVENT_IDS_IN_CHUNK) {
    chunks.push(unique.slice(i, i + EVENT_IDS_IN_CHUNK));
  }
  const rows: EventRow[] = [];
  for (const chunk of chunks) {
    const { data, error } = await supabase.from('events').select('*').in('id', chunk);
    if (error) throw error;
    rows.push(...((data ?? []) as EventRow[]));
  }
  return rows.map((row) => new Event(row));
}

/**
 * Fetches a single event by id. Subject to RLS (visibility).
 */
export async function fetchEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? new Event(data as EventRow) : null;
}

/** Event ids created by the user (any visibility). */
export async function fetchEventIdsCreatedByUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('events').select('id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: { id: string }) => r.id);
}

/**
 * Creates a new event. Requires authenticated user (user_id set server-side or from session).
 */
export async function createEvent(
  input: CreateEventInput,
  userId: string
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      date_time: input.date_time,
      event_type: input.event_type,
      visibility: input.visibility,
      user_id: userId,
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description ?? null,
      cover_cloudinary_public_id: input.cover_cloudinary_public_id ?? null,
      cover_aspect_ratio: input.cover_aspect_ratio ?? null,
      address: input.address ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return new Event(data as EventRow);
}

/** Updates an existing event. RLS: only the owner can update. */
export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({
      name: input.name,
      date_time: input.date_time,
      event_type: input.event_type,
      visibility: input.visibility,
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description ?? null,
      cover_cloudinary_public_id: input.cover_cloudinary_public_id ?? null,
      cover_aspect_ratio: input.cover_aspect_ratio ?? null,
      address: input.address ?? null,
    })
    .eq('id', eventId)
    .select()
    .single();
  if (error) throw error;
  return new Event(data as EventRow);
}

/**
 * Events that user targetUserId is attending, visible to viewerId.
 * If viewer is not the user and not a friend, only public events are returned.
 * Sorted by date_time ascending (next first).
 */
export async function getEventsUserIsAttending(
  targetUserId: string,
  viewerId: string | null
): Promise<Event[]> {
  const eventIds = await getEventIdsUserIsAttending(targetUserId);
  if (eventIds.length === 0) return [];
  const events = await fetchEventsByIds(eventIds);
  const isSelf = viewerId === targetUserId;
  const canSeePrivate = isSelf || (viewerId != null && (await areFriends(viewerId, targetUserId)));
  const filtered = canSeePrivate
    ? events
    : events.filter((e) => e.visibility === Visibility.Public);
  filtered.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  return filtered;
}
