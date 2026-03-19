-- Optional image attachment for event chat messages.
ALTER TABLE event_messages
  ADD COLUMN IF NOT EXISTS image_cloudinary_public_id TEXT,
  ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;
