"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearSession,
  getSessionSnapshot,
  parseStoredUser,
  saveSession,
  subscribeSession,
} from "@/lib/session";
import type { AuthResponse, User } from "./types";

type Session = {
  user: User | null;
  ready: boolean;
  signIn: (response: AuthResponse) => void;
  signOut: () => void;
};
const SessionContext = createContext<Session | null>(null);
const serverSnapshot = () => undefined;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const subscribe = useCallback(
    (onChange: () => void) =>
      subscribeSession(() => {
        void queryClient.cancelQueries();
        queryClient.clear();
        onChange();
      }),
    [queryClient],
  );
  const raw = useSyncExternalStore(
    subscribe,
    getSessionSnapshot,
    serverSnapshot,
  );
  const user = useMemo(() => parseStoredUser(raw), [raw]);
  const signIn = useCallback(
    ({ token, user }: AuthResponse) => saveSession(token, user),
    [],
  );
  return (
    <SessionContext.Provider
      value={{ user, ready: raw !== undefined, signIn, signOut: clearSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession requires SessionProvider");
  return session;
}
