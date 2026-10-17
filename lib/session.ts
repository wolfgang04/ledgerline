import type { User } from "@/features/auth/types";

export const SESSION_EVENT = "ledgerline-session-change";
const TOKEN_KEY = "financial-operations-token";
const USER_KEY = "financial-operations-user";

export function parseStoredUser(raw: string | null | undefined): User | null {
  if (!raw) return null;
  try {
    const user: unknown = JSON.parse(raw);
    if (!user || typeof user !== "object") return null;
    const candidate = user as Record<string, unknown>;
    if (
      !Number.isSafeInteger(candidate.id) ||
      Number(candidate.id) <= 0 ||
      typeof candidate.name !== "string" ||
      typeof candidate.email !== "string" ||
      typeof candidate.role !== "string" ||
      ![
        "employee",
        "finance",
        "manager",
        "organization_admin",
        "platform_admin",
      ].includes(String(candidate.role))
    )
      return null;
    return candidate as User;
  } catch {
    return null;
  }
}

export function getToken() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem(TOKEN_KEY);
}

export function getSessionSnapshot() {
  return getToken() ? window.localStorage.getItem(USER_KEY) : null;
}

export function saveSession(token: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function subscribeSession(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === USER_KEY || event.key === null)
      callback();
  };
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
