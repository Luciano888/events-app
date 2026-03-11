-- Allow posts with only media (no text)
ALTER TABLE event_posts ALTER COLUMN content DROP NOT NULL;

-- Attachments: photos/videos stored in Cloudinary; we store public_id + optional thumbnail URL
CREATE TABLE event_post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES event_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  cloudinary_public_id TEXT NOT NULL,
  thumbnail_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_post_attachments_post_id ON event_post_attachments(post_id);

ALTER TABLE event_post_attachments ENABLE ROW LEVEL SECURITY;

-- Same visibility as posts: only who can read the post can read attachments
CREATE POLICY "Read attachments with post access"
  ON event_post_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_posts ep
      WHERE ep.id = event_post_attachments.post_id
      AND (
        EXISTS (SELECT 1 FROM events e WHERE e.id = ep.event_id AND e.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = ep.event_id AND ea.user_id = auth.uid())
      )
    )
  );

-- Only who can insert a post can insert its attachments
CREATE POLICY "Insert attachments with post access"
  ON event_post_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_posts ep
      WHERE ep.id = event_post_attachments.post_id
      AND (
        EXISTS (SELECT 1 FROM events e WHERE e.id = ep.event_id AND e.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = ep.event_id AND ea.user_id = auth.uid())
      )
    )
  );

-- Creator or post author can delete
CREATE POLICY "Creator or author can delete attachment"
  ON event_post_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_posts ep
      JOIN events e ON e.id = ep.event_id
      WHERE ep.id = event_post_attachments.post_id
      AND (ep.user_id = auth.uid() OR e.user_id = auth.uid())
    )
  );
