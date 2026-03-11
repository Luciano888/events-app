import { useState, useEffect, useCallback } from 'react';
import { getEventPosts } from '../services/eventPostService';
import type { EventPostRow } from '../models/EventPost';

export function useEventPosts(eventId: string | null) {
  const [posts, setPosts] = useState<EventPostRow[]>([]);
  const [loading, setLoading] = useState(!!eventId);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    getEventPosts(eventId)
      .then(setPosts)
      .catch((e) => setError(e.message ?? 'Failed to load posts'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    refetch();
  }, [eventId, refetch]);

  return { posts, loading, error, refetch };
}
