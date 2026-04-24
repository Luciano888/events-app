-- Only the post author may update event_posts (content, type). Event host pin/unpin uses RPC.
DROP POLICY IF EXISTS "Creator or author can update event post" ON event_posts;

CREATE POLICY "Post author can update own post"
  ON event_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Host-only: flip pinned without broad UPDATE rights on others' rows.
CREATE OR REPLACE FUNCTION public.toggle_event_post_pinned(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT event_id INTO v_event_id FROM public.event_posts WHERE id = p_post_id;
  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = v_event_id AND e.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.event_posts SET pinned = NOT pinned WHERE id = p_post_id;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_event_post_pinned(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_event_post_pinned(uuid) TO authenticated;

-- Only the post author can add attachments (prevents attaching media to someone else's post).
DROP POLICY IF EXISTS "Insert attachments with post access" ON event_post_attachments;

CREATE POLICY "Post author can insert attachments"
  ON event_post_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_posts ep
      WHERE ep.id = event_post_attachments.post_id
      AND ep.user_id = auth.uid()
    )
  );
