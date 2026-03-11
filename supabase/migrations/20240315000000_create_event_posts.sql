-- Event wall: posts (announcements by creator, posts/questions by attendees). Coordination + memory.
CREATE TYPE event_post_type AS ENUM ('announcement', 'post', 'question');

CREATE TABLE event_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type event_post_type NOT NULL DEFAULT 'post',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_posts_event_id ON event_posts(event_id);
CREATE INDEX idx_event_posts_created_at ON event_posts(created_at DESC);

ALTER TABLE event_posts ENABLE ROW LEVEL SECURITY;

-- Only attendees and event creator can read posts
CREATE POLICY "Attendees and creator can read event posts"
  ON event_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_posts.event_id AND e.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = event_posts.event_id AND ea.user_id = auth.uid())
  );

-- Attendees and creator can insert; only creator can insert type = announcement
CREATE POLICY "Attendees and creator can insert event posts"
  ON event_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM events e WHERE e.id = event_posts.event_id AND e.user_id = auth.uid())
     OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = event_posts.event_id AND ea.user_id = auth.uid()))
    AND (type != 'announcement' OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_posts.event_id AND e.user_id = auth.uid()))
    AND user_id = auth.uid()
  );

-- Creator can update any (e.g. pin); author can update own
CREATE POLICY "Creator or author can update event post"
  ON event_posts FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_posts.event_id AND e.user_id = auth.uid())
  )
  WITH CHECK (true);

-- Creator or author can delete
CREATE POLICY "Creator or author can delete event post"
  ON event_posts FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_posts.event_id AND e.user_id = auth.uid())
  );
