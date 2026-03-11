import { supabase } from '../lib/supabase';
import type { FriendRequestRow, FriendConnectionStatus } from '../models/FriendRequest';
import { getProfilesByIds } from './profileService';
import type { Profile } from '../models/Profile';

export async function getConnectionStatus(
  viewerId: string,
  targetUserId: string
): Promise<FriendConnectionStatus> {
  if (viewerId === targetUserId) return 'friends';
  const { data, error } = await supabase
    .from('friend_requests')
    .select('from_user_id, to_user_id, status')
    .or(`and(from_user_id.eq.${viewerId},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${viewerId})`);
  if (error) throw error;
  const rows = (data ?? []) as FriendRequestRow[];
  const accepted = rows.find((r) => r.status === 'accepted');
  if (accepted) return 'friends';
  const viewerSent = rows.find((r) => r.from_user_id === viewerId && r.status === 'pending');
  if (viewerSent) return 'pending_sent';
  const viewerReceived = rows.find((r) => r.to_user_id === viewerId && r.status === 'pending');
  if (viewerReceived) return 'pending_received';
  return 'none';
}

export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  if (userId1 === userId2) return true;
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id')
    .or(`and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`)
    .eq('status', 'accepted')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
  if (fromUserId === toUserId) throw new Error('Cannot send request to yourself');
  const { error } = await supabase.from('friend_requests').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: 'pending',
  });
  if (error) {
    if (error.code === '23505') throw new Error('Request already exists');
    throw error;
  }
}

export async function acceptFriendRequest(requestId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .eq('to_user_id', userId);
  if (error) throw error;
}

export async function rejectFriendRequest(requestId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .eq('to_user_id', userId);
  if (error) throw error;
}

export async function getPendingReceived(userId: string): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FriendRequestRow[];
}

export async function getPendingSent(userId: string): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('from_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FriendRequestRow[];
}

/** Cancel (delete) a pending request the user sent. */
export async function cancelSentRequest(requestId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)
    .eq('from_user_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
}

/** Returns profiles of users that are connected (accepted) with the given user. */
export async function getFriends(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('from_user_id, to_user_id')
    .eq('status', 'accepted')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
  if (error) throw error;
  const rows = (data ?? []) as { from_user_id: string; to_user_id: string }[];
  const friendIds = rows.map((r) => (r.from_user_id === userId ? r.to_user_id : r.from_user_id));
  const uniqueIds = [...new Set(friendIds)];
  if (uniqueIds.length === 0) return [];
  return getProfilesByIds(uniqueIds);
}

export async function getFriendsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('friend_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
  if (error) throw error;
  return count ?? 0;
}
