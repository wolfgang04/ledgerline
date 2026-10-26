const prefix = "ledgerline-conversation-read:";
const eventName = "ledgerline-conversation-read-change";
const fallback = new Map<string, string>();

export function conversationReadKey(
  userId: number,
  organizationId: number,
  planId: number,
  departmentId: number | null,
  round: number,
) {
  return `${prefix}${userId}:${organizationId}:${planId}:${departmentId ?? "company"}:${round}`;
}

export function parseReadIds(value: string | null): number[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0)
      : [];
  } catch {
    return [];
  }
}

export function readSnapshot(key: string) {
  if (typeof window === "undefined") return "[]";
  const memory = fallback.get(key);
  if (memory !== undefined) return memory;
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return fallback.get(key) ?? "[]";
  }
}

export function markMessagesRead(key: string, ids: number[]) {
  if (typeof window === "undefined" || !ids.length) return;
  const current = readSnapshot(key);
  const next = JSON.stringify(
    [...new Set([...parseReadIds(current), ...ids])].sort((a, b) => a - b),
  );
  if (JSON.stringify(parseReadIds(current).sort((a, b) => a - b)) === next)
    return;
  try {
    window.localStorage.setItem(key, next);
    fallback.delete(key);
  } catch {
    fallback.set(key, next);
  }
  window.dispatchEvent(new Event(eventName));
}

export function subscribeConversationReads(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key !== null && !event.key.startsWith(prefix)) return;
    if (event.key === null) fallback.clear();
    else fallback.delete(event.key);
    callback();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(eventName, callback);
  };
}

export function unreadMessages<T extends { id: number; created_by: number }>(
  messages: T[],
  userId: number,
  readIds: number[],
) {
  const read = new Set(readIds);
  return messages.filter(
    (message) => message.created_by !== userId && !read.has(message.id),
  );
}
