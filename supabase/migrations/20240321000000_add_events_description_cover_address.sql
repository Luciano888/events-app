-- Add description, optional cover image (Cloudinary public_id), and human-readable address to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS cover_cloudinary_public_id TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;
