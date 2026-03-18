-- Add optional cover aspect ratio for event cover image (e.g. '1:1', '4:5', '3:4')
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cover_aspect_ratio TEXT;
