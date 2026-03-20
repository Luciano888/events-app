import { supabase } from '../lib/supabase';
import type { EventMessageRow } from '../models/EventMessage';

// Chat remains open up to 24 hours after the event starts.
// Opening before event is now controlled by attendance (I'm going).
const CHAT_CLOSE_HOURS_AFTER = 24;

/** Chat is open until 24h after event date_time. */
export function isChatOpen(eventDateTime: string): boolean {
  const t = new Date(eventDateTime).getTime();
  const now = Date.now();
  const closeAt = t + CHAT_CLOSE_HOURS_AFTER * 60 * 60 * 1000;
  return now <= closeAt;
}

export async function getEventMessages(eventId: string): Promise<EventMessageRow[]> {
  const { data, error } = await supabase
    .from('event_messages')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventMessageRow[];
}

/**
 * Latest message per event (for inbox). Fetches recent rows and picks first per event_id.
 */
export async function getLastMessagesForEvents(eventIds: string[]): Promise<Partial<Record<string, EventMessageRow>>> {
  if (eventIds.length === 0) return {};
  const limit = Math.min(500, Math.max(eventIds.length * 25, 50));
  const { data, error } = await supabase
    .from('event_messages')
    .select('*')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const map: Partial<Record<string, EventMessageRow>> = {};
  for (const row of (data ?? []) as EventMessageRow[]) {
    if (map[row.event_id] === undefined) map[row.event_id] = row;
  }
  return map;
}

export async function sendEventMessage(eventId: string, userId: string, body: string): Promise<EventMessageRow> {
  const { data, error } = await supabase
    .from('event_messages')
    .insert({ event_id: eventId, user_id: userId, body: body.trim() })
    .select()
    .single();
  if (error) throw error;
  return data as EventMessageRow;
}

export async function sendEventMessageWithImage(
  eventId: string,
  userId: string,
  body: string,
  imageCloudinaryPublicId: string,
  imageThumbnailUrl?: string | null
): Promise<EventMessageRow> {
  const { data, error } = await supabase
    .from('event_messages')
    .insert({
      event_id: eventId,
      user_id: userId,
      body: body.trim(),
      image_cloudinary_public_id: imageCloudinaryPublicId,
      image_thumbnail_url: imageThumbnailUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventMessageRow;
}

/** Subscribe to new messages for an event (Realtime). Returns unsubscribe function. */
export function subscribeEventMessages(
  eventId: string,
  onInsert: (payload: { new: EventMessageRow }) => void
): () => void {
  const channel = supabase
    .channel(`event_messages:${eventId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `event_id=eq.${eventId}` },
      (payload) => onInsert({ new: payload.new as EventMessageRow })
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
