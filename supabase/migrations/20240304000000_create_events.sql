-- Event type enum (matches frontend EventType)
CREATE TYPE event_type_enum AS ENUM (
  'social',
  'musical',
  'dance',
  'bar',
  'cultural',
  'general_interest',
  'third_age',
  'children',
  'sport'
);

-- Visibility enum (matches frontend Visibility)
CREATE TYPE visibility_enum AS ENUM (
  'public',
  'private',
  'draft'
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  event_type event_type_enum NOT NULL,
  visibility visibility_enum NOT NULL DEFAULT 'public',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for listing by date and visibility
CREATE INDEX idx_events_date_time ON events(date_time);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_events_user_id ON events(user_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public events: visible to everyone (anon + authenticated)
CREATE POLICY "Public events are visible to all"
  ON events FOR SELECT
  USING (visibility = 'public');

-- Private events: visible only to authenticated users
CREATE POLICY "Private events visible to authenticated"
  ON events FOR SELECT
  TO authenticated
  USING (visibility = 'private');

-- Draft events: visible only to the owner
CREATE POLICY "Draft events visible to owner only"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/update/delete: only authenticated, and for own rows when draft
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
