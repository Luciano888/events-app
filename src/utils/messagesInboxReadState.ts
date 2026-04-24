const STORAGE_KEY = 'events-app.messagesInboxRead.v1';

function loadMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveMap(map: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Marks everything up to `readUntilIso` as read for this event thread. */
export function markEventThreadRead(eventId: string, readUntilIso: string) {
  const map = loadMap();
  const prev = map[eventId];
  const tNew = new Date(readUntilIso).getTime();
  if (Number.isNaN(tNew)) return;
  const tPrev = prev ? new Date(prev).getTime() : 0;
  map[eventId] = new Date(Math.max(tNew, tPrev)).toISOString();
  saveMap(map);
}

/**
 * True if the latest message looks unread for the current user (client-side).
 * Uses last message time vs last "read" time stored locally.
 */
export function isEventThreadUnread(
  eventId: string,
  lastMessage: { user_id: string; created_at?: string | null } | null | undefined,
  currentUserId: string
): boolean {
  if (!lastMessage?.created_at) return false;
  if (lastMessage.user_id === currentUserId) return false;
  const readAt = loadMap()[eventId];
  if (!readAt) return true;
  return new Date(lastMessage.created_at).getTime() > new Date(readAt).getTime();
}
