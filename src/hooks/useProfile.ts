import { useState, useEffect } from 'react';
import { getProfile, getOrCreateProfile } from '../services/profileService';
import type { Profile } from '../models/Profile';

export function useProfile(userId: string | null, createIfMissing = false) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const fetch = createIfMissing ? getOrCreateProfile(userId) : getProfile(userId);
    fetch
      .then(setProfile)
      .catch((e) => setError(e.message ?? 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [userId, createIfMissing]);

  return { profile, loading, error };
}
