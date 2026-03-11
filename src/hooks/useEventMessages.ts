import { useState, useEffect, useCallback } from 'react';
import {
  getEventMessages,
  sendEventMessage,
  subscribeEventMessages,
  isChatOpen,
} from '../services/eventMessageService';
import type { EventMessageRow } from '../models/EventMessage';

export function useEventMessages(eventId: string | null, eventDateTime: string | null, userId: string | null) {
  const [messages, setMessages] = useState<EventMessageRow[]>([]);
  const [loading, setLoading] = useState(!!eventId);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatOpen = eventDateTime ? isChatOpen(eventDateTime) : false;

  const refetch = useCallback(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    getEventMessages(eventId)
      .then(setMessages)
      .catch((e) => setError(e.message ?? 'Failed to load messages'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    refetch();
  }, [eventId, refetch]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeEventMessages(eventId, (payload) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.new.id)) return prev;
        return [...prev, payload.new];
      });
    });
    return unsub;
  }, [eventId]);

  const send = useCallback(
    async (body: string) => {
      if (!eventId || !userId || !body.trim()) return;
      setSending(true);
      setError(null);
      try {
        const newMsg = await sendEventMessage(eventId, userId, body);
        setMessages((prev) => [...prev, newMsg]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send');
        throw e;
      } finally {
        setSending(false);
      }
    },
    [eventId, userId]
  );

  return { messages, loading, sending, error, refetch, send, chatOpen };
}
