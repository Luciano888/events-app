import { useState, useEffect } from 'react';
import { getEventsUserIsAttending } from '../services/eventService';
import type { Event } from '../models/Event';

export function useEventsUserIsAttending(targetUserId: string | null, viewerId: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(!!targetUserId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUserId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getEventsUserIsAttending(targetUserId, viewerId)
      .then(setEvents)
      .catch((e) => setError(e.message ?? 'Failed to load events'))
      .finally(() => setLoading(false));
  }, [targetUserId, viewerId]);

  return { events, loading, error };
}
