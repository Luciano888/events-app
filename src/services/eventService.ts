import { supabase } from '../lib/supabase';
import { Event } from '../models/Event';
import type { EventRow } from '../models/Event';
import type { CreateEventInput } from '../models/Event';
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

/**
 * Fetches multiple events by ids. Subject to RLS (visibility). Order not guaranteed.
 */
export async function fetchEventsByIds(ids: string[]): Promise<Event[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return (data as EventRow[]).map((row) => new Event(row));
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
    })
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
