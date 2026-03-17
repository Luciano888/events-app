import type { Event } from '../models/Event';

export interface UpcomingBuckets {
  today: Event[];
  thisWeek: Event[];
  thisMonth: Event[];
  thisYear: Event[];
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function endOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

/**
 * Groups upcoming events into Today, This week, This month, This year.
 * Each bucket is sorted by date ascending.
 */
export function groupUpcomingByTime(events: Event[]): UpcomingBuckets {
  const now = new Date();

  const startToday = startOfDay(now);
  const endToday = endOfDay(now);
  const endOfSevenDays = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  const endOfCurrentMonth = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const endOfCurrentYear = endOfDay(new Date(now.getFullYear(), 11, 31));

  const today: Event[] = [];
  const thisWeek: Event[] = [];
  const thisMonth: Event[] = [];
  const thisYear: Event[] = [];

  for (const e of events) {
    const t = new Date(e.dateTime).getTime();
    if (t >= startToday && t <= endToday) {
      today.push(e);
    } else if (t > endToday && t <= endOfSevenDays) {
      thisWeek.push(e);
    } else if (t <= endOfCurrentMonth) {
      thisMonth.push(e);
    } else if (t <= endOfCurrentYear) {
      thisYear.push(e);
    }
  }

  const sortByDate = (a: Event, b: Event) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  today.sort(sortByDate);
  thisWeek.sort(sortByDate);
  thisMonth.sort(sortByDate);
  thisYear.sort(sortByDate);

  return { today, thisWeek, thisMonth, thisYear };
}
