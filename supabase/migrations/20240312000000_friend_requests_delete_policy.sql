-- Sender can delete (cancel) their own pending friend request.
CREATE POLICY "Sender can delete own pending request"
  ON friend_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id AND status = 'pending');
