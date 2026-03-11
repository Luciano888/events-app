export type EventPostType = 'announcement' | 'post' | 'question';

export interface EventPostRow {
  id: string;
  event_id: string;
  user_id: string;
  content: string | null;
  type: EventPostType;
  pinned: boolean;
  created_at?: string;
}

export interface CreateEventPostInput {
  event_id: string;
  user_id: string;
  content: string | null;
  type: EventPostType;
  pinned?: boolean;
}
