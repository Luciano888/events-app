-- Emoji reactions for event wall posts (Slack-like).
CREATE TABLE event_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES event_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

CREATE INDEX idx_event_post_reactions_post ON event_post_reactions(post_id);
CREATE INDEX idx_event_post_reactions_post_emoji ON event_post_reactions(post_id, emoji);

ALTER TABLE event_post_reactions ENABLE ROW LEVEL SECURITY;

-- Read reactions only when user can access that event wall (creator or attendee).
CREATE POLICY "Attendees and creator can read event post reactions"
  ON event_post_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM event_posts ep
      JOIN events e ON e.id = ep.event_id
      WHERE ep.id = event_post_reactions.post_id
        AND (
          e.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = auth.uid())
        )
    )
  );

-- Attendees and creator can react as themselves.
CREATE POLICY "Attendees and creator can insert reactions"
  ON event_post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM event_posts ep
      JOIN events e ON e.id = ep.event_id
      WHERE ep.id = event_post_reactions.post_id
        AND (
          e.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = auth.uid())
        )
    )
  );

-- Users can remove only their own reactions.
CREATE POLICY "Users can delete own reactions"
  ON event_post_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
