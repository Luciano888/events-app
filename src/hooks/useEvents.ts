import { useState, useEffect, useCallback } from 'react';
import { Event } from '../models/Event';
import { fetchVisibleEvents } from '../services/eventService';
import { isSupabaseConfigured } from '../lib/supabase';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);
    fetchVisibleEvents()
      .then(setEvents)
      .catch((e) => setError(e.message ?? 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVisibleEvents()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? 'Failed to load events');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error, refetch };
}
