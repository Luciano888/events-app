import { supabase } from '../lib/supabase';

/**
 * Returns the number of users who marked "I'm going" for an event.
 */
export async function getAttendanceCount(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Returns whether the current user is attending the event (if authenticated).
 */
export async function getCurrentUserAttendance(
  eventId: string,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('event_attendees')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * Returns attendance counts for multiple events in one call.
 */
export async function getAttendanceCounts(eventIds: string[]): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};
  const { data, error } = await supabase
    .from('event_attendees')
    .select('event_id')
    .in('event_id', eventIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  eventIds.forEach((id) => { counts[id] = 0; });
  (data ?? []).forEach((row: { event_id: string }) => {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  });
  return counts;
}

/**
 * Returns event ids that the given user is attending (going).
 */
export async function getEventIdsUserIsAttending(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: { event_id: string }) => row.event_id);
}

/**
 * Returns user ids of attendees (going) for an event. Use for creator-only attendee list.
 */
export async function getAttendeeUserIds(eventId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_attendees')
    .select('user_id')
    .eq('event_id', eventId);
  if (error) throw error;
  return (data ?? []).map((row: { user_id: string }) => row.user_id);
}

/**
 * Set attendance: going = true to add, going = false to remove.
 */
export async function setAttendance(
  eventId: string,
  userId: string,
  going: boolean
): Promise<void> {
  if (going) {
    const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId });
    if (error) {
      if (error.code === '23505') return; // unique violation = already attending
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
