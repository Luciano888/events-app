-- Idempotent: fixes PGRST204 when image columns were never applied on remote DB.
ALTER TABLE public.event_messages
  ADD COLUMN IF NOT EXISTS image_cloudinary_public_id TEXT,
  ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;
