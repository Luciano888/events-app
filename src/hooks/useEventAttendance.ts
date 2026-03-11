import { useState, useEffect, useCallback } from 'react';
import {
  getAttendanceCount,
  getCurrentUserAttendance,
  setAttendance as setAttendanceApi,
} from '../services/attendanceService';

export function useEventAttendance(eventId: string | undefined, userId: string | null) {
  const [count, setCount] = useState(0);
  const [isGoing, setIsGoing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [c, going] = await Promise.all([
        getAttendanceCount(eventId),
        getCurrentUserAttendance(eventId, userId),
      ]);
      setCount(c);
      setIsGoing(going);
    } catch {
      setCount(0);
      setIsGoing(false);
    } finally {
      setLoading(false);
    }
  }, [eventId, userId]);

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
