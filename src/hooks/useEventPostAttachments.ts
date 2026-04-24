import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAttachmentsByPostIds } from '../services/eventPostService';
import type { EventPostAttachmentRow } from '../models/EventPostAttachment';

/** Map postId -> attachments[]. Bump refreshKey after edits so lists reload without post id changes. */
export function useEventPostAttachments(postIds: string[], refreshKey = 0) {
  const [attachmentsByPost, setAttachmentsByPost] = useState<Record<string, EventPostAttachmentRow[]>>({});
  const [loading, setLoading] = useState(false);

  const key = useMemo(() => postIds.slice().sort().join(','), [postIds]);

  const refetch = useCallback(() => {
    if (postIds.length === 0) {
      setAttachmentsByPost({});
      setLoading(false);
      return;
    }
    setLoading(true);
    getAttachmentsByPostIds(postIds)
      .then((list) => {
        const map: Record<string, EventPostAttachmentRow[]> = {};
        postIds.forEach((id) => {
          map[id] = [];
        });
        list.forEach((a) => {
          if (!map[a.post_id]) map[a.post_id] = [];
          map[a.post_id].push(a);
        });
        setAttachmentsByPost(map);
      })
      .catch(() => setAttachmentsByPost({}))
      .finally(() => setLoading(false));
  }, [postIds]);

  useEffect(() => {
    refetch();
  }, [key, refreshKey, refetch]);

  return { attachmentsByPost, loading, refetch };
}
