-- Profiles: one per auth user (display name, avatar, bio).
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (for public profile page).
CREATE POLICY "Profiles are readable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert/update/update only their own profile.
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Friend requests: pending -> accept/reject. One row per (from, to) with status.
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status friend_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can see requests they sent or received.
CREATE POLICY "Users can read own friend requests"
  ON friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can insert requests they send (from_user_id = self).
CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id AND from_user_id != to_user_id);

-- Recipient can update (accept/reject) requests sent to them.
CREATE POLICY "Recipient can update friend request"
  ON friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (to_user_id = auth.uid());
