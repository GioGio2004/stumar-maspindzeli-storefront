"use client";

import { ConvexError } from "convex/values";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

/**
 * What a guest may do on this page. The room token comes from the tag; the
 * key comes from unlocking with the stay PIN and is remembered per room.
 */
type GuestAccess = {
  token: string | null;
  hasStay: boolean;
  pinRequired: boolean;
  key: string | null;
  saveKey: (key: string) => void;
  clearKey: () => void;
};

const GuestAccessContext = createContext<GuestAccess>({
  token: null,
  hasStay: false,
  pinRequired: false,
  key: null,
  saveKey: () => {},
  clearKey: () => {},
});

const EVENT = "stumar-guest-key";
const storageKey = (token: string) => `stumar.guestKey.${token}`;

function read(token: string | null): string | null {
  if (!token) return null;
  try {
    return window.localStorage.getItem(storageKey(token));
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function GuestAccessProvider({
  token,
  hasStay,
  pinRequired,
  children,
}: {
  token: string | null;
  hasStay: boolean;
  pinRequired: boolean;
  children: ReactNode;
}) {
  const key = useSyncExternalStore(subscribe, () => read(token), () => null);

  const saveKey = useCallback(
    (value: string) => {
      if (!token) return;
      try {
        window.localStorage.setItem(storageKey(token), value);
      } catch {
        // private mode: the guest just enters the PIN again next time
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [token],
  );

  const clearKey = useCallback(() => {
    if (!token) return;
    try {
      window.localStorage.removeItem(storageKey(token));
    } catch {
      // nothing stored
    }
    window.dispatchEvent(new Event(EVENT));
  }, [token]);

  const value = useMemo(
    () => ({ token, hasStay, pinRequired, key, saveKey, clearKey }),
    [token, hasStay, pinRequired, key, saveKey, clearKey],
  );
  return <GuestAccessContext.Provider value={value}>{children}</GuestAccessContext.Provider>;
}

export function useGuestAccess() {
  const access = useContext(GuestAccessContext);
  // "Unlocked" when the hotel doesn't ask for a PIN, or the phone has the key.
  const unlocked = access.hasStay && (!access.pinRequired || Boolean(access.key));
  return { ...access, unlocked, keyArg: access.key ?? undefined };
}

/** The backend's guest-readable message, never the raw transport error. */
export function errorInfo(error: unknown): { code?: string; message: string } {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; message?: string } | string;
    if (typeof data === "string") return { message: data };
    return { code: data.code, message: data.message ?? "Something went wrong. Please try again." };
  }
  return { message: "Something went wrong. Please check your connection and try again." };
}
