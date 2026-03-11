import { supabase } from '../lib/supabase';
import type { EventPostRow, CreateEventPostInput } from '../models/EventPost';
import type { EventPostAttachmentRow, CreateEventPostAttachmentInput } from '../models/EventPostAttachment';

export async function getEventPosts(eventId: string): Promise<EventPostRow[]> {
  const { data, error } = await supabase
    .from('event_posts')
    .select('*')
    .eq('event_id', eventId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventPostRow[];
}

export async function getAttachmentsByPostIds(postIds: string[]): Promise<EventPostAttachmentRow[]> {
  if (postIds.length === 0) return [];
  const { data, error } = await supabase
    .from('event_post_attachments')
    .select('*')
    .in('post_id', postIds)
    .order('order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventPostAttachmentRow[];
}

export async function createEventPost(input: CreateEventPostInput): Promise<EventPostRow> {
  const { data, error } = await supabase
    .from('event_posts')
    .insert({
      event_id: input.event_id,
      user_id: input.user_id,
      content: input.content?.trim() || null,
      type: input.type,
      pinned: input.pinned ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventPostRow;
}

export async function createEventPostWithAttachments(
  input: CreateEventPostInput,
  attachments: Omit<CreateEventPostAttachmentInput, 'post_id'>[]
): Promise<EventPostRow> {
  const post = await createEventPost(input);
  if (attachments.length === 0) return post;
  const rows = attachments.map((a, i) => ({
    post_id: post.id,
    type: a.type,
    cloudinary_public_id: a.cloudinary_public_id,
    thumbnail_url: a.thumbnail_url ?? null,
    order: a.order ?? i,
  }));
  const { error } = await supabase.from('event_post_attachments').insert(rows);
  if (error) throw error;
  return post;
}

export async function togglePostPinned(postId: string): Promise<EventPostRow> {
  const { data: existing } = await supabase
    .from('event_posts')
    .select('pinned')
    .eq('id', postId)
    .single();
  if (!existing) throw new Error('Post not found');
  const { data, error } = await supabase
    .from('event_posts')
    .update({ pinned: !(existing as { pinned: boolean }).pinned })
    .eq('id', postId)
    .select()
    .single();
  if (error) throw error;
  return data as EventPostRow;
}
