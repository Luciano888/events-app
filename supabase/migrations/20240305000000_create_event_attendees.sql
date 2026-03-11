-- RSVP: users mark they are going to an event.
-- One row per (event, user) = "I'm going".
CREATE TABLE event_attendees (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Anyone can read attendees (to show count and list)
CREATE POLICY "Anyone can read attendees"
  ON event_attendees FOR SELECT
  USING (true);

-- Only authenticated users can add themselves
CREATE POLICY "Users can insert own attendance"
  ON event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can remove themselves
CREATE POLICY "Users can delete own attendance"
  ON event_attendees FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
