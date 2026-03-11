import { useState, useEffect } from 'react';
import { getConnectionStatus, getFriendsCount } from '../services/friendService';
import type { FriendConnectionStatus } from '../models/FriendRequest';

export function useConnectionStatus(viewerId: string | null, targetUserId: string | null) {
  const [status, setStatus] = useState<FriendConnectionStatus | null>(null);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!(viewerId && targetUserId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerId || !targetUserId) {
      setStatus(null);
      setFriendsCount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getConnectionStatus(viewerId, targetUserId),
      getFriendsCount(targetUserId),
    ])
      .then(([s, c]) => {
        setStatus(s);
        setFriendsCount(c);
      })
      .catch((e) => setError(e.message ?? 'Failed to load connection status'))
      .finally(() => setLoading(false));
  }, [viewerId, targetUserId]);

  return { status, friendsCount, loading, error };
}
