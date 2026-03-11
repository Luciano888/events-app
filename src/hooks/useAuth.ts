import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
