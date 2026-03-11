export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequestRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: FriendRequestStatus;
  created_at?: string;
}

export type FriendConnectionStatus =
  | 'friends'
  | 'pending_sent'
  | 'pending_received'
  | 'none';
