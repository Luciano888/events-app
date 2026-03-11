import { supabase } from '../lib/supabase';
import type { Profile, ProfileUpdate } from '../models/Profile';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getProfilesByIds(userIds: string[]): Promise<Profile[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** Get or create profile for current user. Returns profile; creates one with defaults if missing. */
export async function getOrCreateProfile(userId: string): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, update: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
