import { useState, useEffect } from 'react';
import { getAttendanceCounts } from '../services/attendanceService';

/**
 * Fetches attendance counts for a list of event IDs. Returns a map eventId -> count.
 */
export function useAttendanceCounts(eventIds: string[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (eventIds.length === 0) {
      setCounts({});
      return;
    }
    getAttendanceCounts(eventIds)
      .then(setCounts)
      .catch(() => setCounts({}));
  }, [eventIds.join(',')]);

  return counts;
}
