import { useState, useEffect, useCallback } from 'react';
import {
  getEventMessages,
  sendEventMessage,
  sendEventMessageWithImage,
  subscribeEventMessages,
  isChatOpen,
} from '../services/eventMessageService';
import type { EventMessageRow } from '../models/EventMessage';

function getSendErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return fallback;
}

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
      .catch((e) => setError(getSendErrorMessage(e, 'Failed to load messages')))
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
    async (body: string, options?: { imageCloudinaryPublicId?: string; imageThumbnailUrl?: string | null }) => {
      if (!eventId || !userId) return;
      const trimmed = body.trim();
      const hasImage = !!options?.imageCloudinaryPublicId;
      if (!trimmed && !hasImage) return;
      setSending(true);
      setError(null);
      try {
        const newMsg = hasImage
          ? await sendEventMessageWithImage(
            eventId,
            userId,
            trimmed,
            options.imageCloudinaryPublicId as string,
            options.imageThumbnailUrl ?? null
          )
          : await sendEventMessage(eventId, userId, trimmed);
        setMessages((prev) => [...prev, newMsg]);
      } catch (e) {
        setError(getSendErrorMessage(e, 'Failed to send'));
        throw e;
      } finally {
        setSending(false);
      }
    },
    [eventId, userId]
  );

  return { messages, loading, sending, error, refetch, send, chatOpen };
}
