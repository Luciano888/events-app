/**
 * User profile (display name, avatar, bio). id = auth.users.id.
 */
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}
