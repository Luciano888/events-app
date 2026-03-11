import { supabase } from '../lib/supabase';
import type { EventMessageRow } from '../models/EventMessage';

// Chat window: open from X before event until Y after. Use 24/24 for production; wider for testing.
const CHAT_OPEN_HOURS_BEFORE = 24 * 30;  // 30 days before (was 24 for prod)
const CHAT_CLOSE_HOURS_AFTER = 24 * 30;  // 30 days after (was 24 for prod)

/** Chat is open in the configured window around event date_time. */
export function isChatOpen(eventDateTime: string): boolean {
  const t = new Date(eventDateTime).getTime();
  const now = Date.now();
  const openAt = t - CHAT_OPEN_HOURS_BEFORE * 60 * 60 * 1000;
  const closeAt = t + CHAT_CLOSE_HOURS_AFTER * 60 * 60 * 1000;
  return now >= openAt && now <= closeAt;
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

export async function sendEventMessage(eventId: string, userId: string, body: string): Promise<EventMessageRow> {
  const { data, error } = await supabase
    .from('event_messages')
    .insert({ event_id: eventId, user_id: userId, body: body.trim() })
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
