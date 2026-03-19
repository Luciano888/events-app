import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAttendanceCount,
  getCurrentUserAttendance,
  setAttendance as setAttendanceApi,
} from '../services/attendanceService';

/**
 * @param authLoading When true, skips fetch until session is known (avoids treating "user not loaded yet" as not going).
 */
export function useEventAttendance(
  eventId: string | undefined,
  userId: string | null,
  authLoading = false
) {
  const [count, setCount] = useState(0);
  const [isGoing, setIsGoing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const refreshSeqRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!eventId || authLoading) return;
    const seq = ++refreshSeqRef.current;
    setLoading(true);
    try {
      const goingPromise = userId
        ? getCurrentUserAttendance(eventId, userId)
        : Promise.resolve<boolean | null>(null);
      const [c, going] = await Promise.all([getAttendanceCount(eventId), goingPromise]);
      if (seq !== refreshSeqRef.current) return;
      setCount(c);
      setIsGoing(going);
    } catch {
      if (seq !== refreshSeqRef.current) return;
      setCount(0);
      setIsGoing(null);
    } finally {
      if (seq === refreshSeqRef.current) setLoading(false);
    }
  }, [eventId, userId, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setGoing = useCallback(
    async (going: boolean) => {
      if (!eventId || !userId) return;
      setAttendanceError(null);
      setUpdating(true);
      try {
        await setAttendanceApi(eventId, userId, going);
        await refresh();
      } catch (e: unknown) {
        const err = e as { message?: string; error_description?: string };
        const message =
          typeof err?.message === 'string'
            ? err.message
            : typeof err?.error_description === 'string'
              ? err.error_description
              : e instanceof Error
                ? e.message
                : 'Failed to update attendance. If the table does not exist, run the migration supabase/migrations/20240305000000_create_event_attendees.sql in Supabase SQL Editor.';
        setAttendanceError(message);
      } finally {
        setUpdating(false);
      }
    },
    [eventId, userId, refresh]
  );

  const clearError = useCallback(() => setAttendanceError(null), []);

  return { count, isGoing, loading, updating, setGoing, refresh, attendanceError, clearError };
}
