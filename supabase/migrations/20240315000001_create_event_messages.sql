-- Event chat: one thread per event. Open from 24h before until 24h after event (enforced in app).
CREATE TABLE event_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_messages_event_id ON event_messages(event_id);
CREATE INDEX idx_event_messages_created_at ON event_messages(created_at ASC);

ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Only attendees and event creator can read messages
CREATE POLICY "Attendees and creator can read event messages"
  ON event_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_messages.event_id AND e.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = event_messages.event_id AND ea.user_id = auth.uid())
  );

-- Only attendees and creator can insert
CREATE POLICY "Attendees and creator can insert event messages"
  ON event_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM events e WHERE e.id = event_messages.event_id AND e.user_id = auth.uid())
     OR EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = event_messages.event_id AND ea.user_id = auth.uid()))
    AND user_id = auth.uid()
  );

-- Enable Realtime for event_messages so clients can subscribe to new messages
ALTER PUBLICATION supabase_realtime ADD TABLE event_messages;
