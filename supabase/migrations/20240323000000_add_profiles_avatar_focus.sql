-- Optional avatar focal point for user profiles (0-100 percentages).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_position_x SMALLINT,
  ADD COLUMN IF NOT EXISTS avatar_position_y SMALLINT;
