import { supabase } from '../lib/supabase';
import type { EventPostRow, CreateEventPostInput, EventPostReactionRow } from '../models/EventPost';
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

/** Event host only; SECURITY DEFINER RPC (migration 20260406120000). */
export async function togglePostPinned(postId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_event_post_pinned', { p_post_id: postId });
  if (error) throw error;
}

/**
 * Deletes attachments not listed in keepIdsOrdered, then inserts new rows.
 * keepIdsOrdered: ids to keep, in display order.
 */
export async function syncEventPostAttachments(
  postId: string,
  keepIdsOrdered: string[],
  newAttachments: Omit<CreateEventPostAttachmentInput, 'post_id'>[]
): Promise<void> {
  const { data: current, error: selErr } = await supabase
    .from('event_post_attachments')
    .select('id')
    .eq('post_id', postId);
  if (selErr) throw selErr;
  const currentIds = new Set((current ?? []).map((r) => (r as { id: string }).id));
  for (const kid of keepIdsOrdered) {
    if (!currentIds.has(kid)) {
      throw new Error('Invalid attachment id for this post');
    }
  }
  const toDelete = [...currentIds].filter((id) => !keepIdsOrdered.includes(id));
  if (toDelete.length > 0) {
    const { error: delErr } = await supabase.from('event_post_attachments').delete().in('id', toDelete);
    if (delErr) throw delErr;
  }
  if (newAttachments.length === 0) return;
  const baseOrder = keepIdsOrdered.length;
  const rows = newAttachments.map((a, i) => ({
    post_id: postId,
    type: a.type,
    cloudinary_public_id: a.cloudinary_public_id,
    thumbnail_url: a.thumbnail_url ?? null,
    order: baseOrder + i,
  }));
  const { error: insErr } = await supabase.from('event_post_attachments').insert(rows);
  if (insErr) throw insErr;
}

export async function updateEventPost(
  postId: string,
  patch: Partial<Pick<EventPostRow, 'content' | 'type'>>
): Promise<EventPostRow> {
  const { data, error } = await supabase
    .from('event_posts')
    .update({
      ...(patch.content !== undefined ? { content: patch.content?.trim() || null } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
    })
    .eq('id', postId)
    .select()
    .single();
  if (error) throw error;
  return data as EventPostRow;
}

export async function deleteEventPost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('event_posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}

export async function getReactionsByPostIds(postIds: string[]): Promise<EventPostReactionRow[]> {
  if (postIds.length === 0) return [];
  const { data, error } = await supabase
    .from('event_post_reactions')
    .select('*')
    .in('post_id', postIds);
  if (error) throw error;
  return (data ?? []) as EventPostReactionRow[];
}

export async function addReaction(postId: string, userId: string, emoji: string): Promise<void> {
  const { error } = await supabase
    .from('event_post_reactions')
    .insert({ post_id: postId, user_id: userId, emoji });
  if (error) throw error;
}

export async function removeReaction(postId: string, userId: string, emoji: string): Promise<void> {
  const { error } = await supabase
    .from('event_post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('emoji', emoji);
  if (error) throw error;
}
