import { useEffect, useState, useCallback } from 'react';
import type { EventPostReactionRow } from '../models/EventPost';
import { addReaction, getReactionsByPostIds, removeReaction } from '../services/eventPostService';

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
}

export function useEventPostReactions(postIds: string[], currentUserId: string | null) {
  const [reactionsByPost, setReactionsByPost] = useState<Record<string, ReactionSummary[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSummary = useCallback((rows: EventPostReactionRow[]) => {
    const map: Record<string, Map<string, { count: number; reactedByCurrentUser: boolean }>> = {};
    for (const r of rows) {
      if (!map[r.post_id]) map[r.post_id] = new Map();
      const bucket = map[r.post_id];
      const prev = bucket.get(r.emoji) ?? { count: 0, reactedByCurrentUser: false };
      bucket.set(r.emoji, {
        count: prev.count + 1,
        reactedByCurrentUser: prev.reactedByCurrentUser || (currentUserId != null && r.user_id === currentUserId),
      });
    }
    const out: Record<string, ReactionSummary[]> = {};
    for (const [postId, bucket] of Object.entries(map)) {
      out[postId] = Array.from(bucket.entries())
        .map(([emoji, v]) => ({ emoji, count: v.count, reactedByCurrentUser: v.reactedByCurrentUser }))
        .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
    }
    return out;
  }, [currentUserId]);

  const refetch = useCallback(async () => {
    if (postIds.length === 0) {
      setReactionsByPost({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await getReactionsByPostIds(postIds);
      setReactionsByPost(buildSummary(rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reactions');
      setReactionsByPost({});
    } finally {
      setLoading(false);
    }
  }, [postIds, buildSummary]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const toggleReaction = useCallback(async (postId: string, emoji: string) => {
    if (!currentUserId) return;
    const current = reactionsByPost[postId] ?? [];
    const existing = current.find((r) => r.emoji === emoji);
    const alreadyReacted = existing?.reactedByCurrentUser ?? false;
    if (alreadyReacted) await removeReaction(postId, currentUserId, emoji);
    else await addReaction(postId, currentUserId, emoji);
    await refetch();
  }, [currentUserId, reactionsByPost, refetch]);

  return { reactionsByPost, loading, error, toggleReaction, refetch };
}
