export interface EventMessageRow {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  image_cloudinary_public_id?: string | null;
  image_thumbnail_url?: string | null;
  created_at?: string;
}
