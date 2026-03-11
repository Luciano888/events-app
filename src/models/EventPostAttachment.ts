export type EventPostAttachmentType = 'image' | 'video';

export interface EventPostAttachmentRow {
  id: string;
  post_id: string;
  type: EventPostAttachmentType;
  cloudinary_public_id: string;
  thumbnail_url: string | null;
  order: number;
  created_at?: string;
}

export interface CreateEventPostAttachmentInput {
  post_id: string;
  type: EventPostAttachmentType;
  cloudinary_public_id: string;
  thumbnail_url?: string | null;
  order: number;
}
