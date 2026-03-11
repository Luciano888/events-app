import { useState, useEffect, useMemo } from 'react';
import { getAttachmentsByPostIds } from '../services/eventPostService';
import type { EventPostAttachmentRow } from '../models/EventPostAttachment';

/** Returns a map postId -> attachments[] for the given post ids. */
export function useEventPostAttachments(postIds: string[]) {
  const [attachmentsByPost, setAttachmentsByPost] = useState<Record<string, EventPostAttachmentRow[]>>({});
  const [loading, setLoading] = useState(false);

  const key = useMemo(() => postIds.slice().sort().join(','), [postIds]);

  useEffect(() => {
    if (postIds.length === 0) {
      setAttachmentsByPost({});
      return;
    }
    setLoading(true);
    getAttachmentsByPostIds(postIds)
      .then((list) => {
        const map: Record<string, EventPostAttachmentRow[]> = {};
        postIds.forEach((id) => { map[id] = []; });
        list.forEach((a) => {
          if (!map[a.post_id]) map[a.post_id] = [];
          map[a.post_id].push(a);
        });
        setAttachmentsByPost(map);
      })
      .catch(() => setAttachmentsByPost({}))
      .finally(() => setLoading(false));
  }, [key]);

  return { attachmentsByPost, loading };
}
