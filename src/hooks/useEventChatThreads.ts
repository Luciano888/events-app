import { useState, useEffect, useCallback } from 'react';
import { getEventIdsUserIsAttending } from '../services/attendanceService';
import { fetchEventsByIds, fetchEventIdsCreatedByUser } from '../services/eventService';
import { getLastMessagesForEvents } from '../services/eventMessageService';
import type { Event } from '../models/Event';
import type { EventMessageRow } from '../models/EventMessage';

export type EventChatThread = {
  event: Event;
  lastMessage: EventMessageRow | null;
};

/**
 * Loads events the user attends or created, with last chat message preview for inbox.
 */
export function useEventChatThreads(userId: string | null) {
  const [threads, setThreads] = useState<EventChatThread[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [attending, createdIds] = await Promise.all([
        getEventIdsUserIsAttending(userId),
        fetchEventIdsCreatedByUser(userId),
      ]);
      const uniqueIds = [...new Set([...attending, ...createdIds])];
      if (uniqueIds.length === 0) {
        setThreads([]);
        return;
      }
      const [events, lastByEvent] = await Promise.all([
        fetchEventsByIds(uniqueIds),
        getLastMessagesForEvents(uniqueIds),
      ]);
      const list: EventChatThread[] = events.map((event) => ({
        event,
        lastMessage: lastByEvent[event.id] ?? null,
      }));
      list.sort((a, b) => {
        const ta = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
        const tb = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
        if (tb !== ta) return tb - ta;
        return new Date(b.event.dateTime).getTime() - new Date(a.event.dateTime).getTime();
      });
      setThreads(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load messages';
      setError(msg);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { threads, loading, error, refetch };
}
