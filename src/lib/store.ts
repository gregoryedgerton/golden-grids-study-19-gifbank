import { useMemo, useSyncExternalStore } from "react";
import { ACCOUNTS, build, type AccountId } from "../bank/ledger";

/**
 * Everything a reader changes, kept in this browser's local storage under
 * `gg19b-*` and sent nowhere: whether they have entered the demo, the names
 * of their accounts, and whether balances are hidden. One store per kind,
 * each a value with a setter and a hook, so a change made on one page shows
 * on the others. If storage is unavailable the stores keep their values in
 * memory for the visit. The reader cannot move money or change a
 * preference: the books and each account's delivery are fixed (CLAUDE.md,
 * Safe Browsing remediation).
 */
type Listener = () => void;

export function persisted<T>(key: string, initial: T) {
  const k = `gg19b-${key}`;
  let value: T = initial;
  try { const raw = localStorage.getItem(k); if (raw) { const v = JSON.parse(raw); value = (Array.isArray(initial) ? v : { ...initial, ...v }) as T; } } catch { /* in memory */ }
  const listeners = new Set<Listener>();
  const set = (next: T | ((v: T) => T)) => {
    value = typeof next === "function" ? (next as (v: T) => T)(value) : next;
    try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* in memory */ }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l); }; };
  return { get: () => value, set, use: () => useSyncExternalStore(subscribe, () => value, () => value) };
}

/** In the demo or not. There is no sign-in: Enter's parody notice is the way in, and `?demo` in a page's address enters, for captures. */
export const session = persisted<{ in: boolean; at: number }>("session", { in: false, at: 0 });
if (typeof location !== "undefined" && new URLSearchParams(location.search).has("demo") && !session.get().in) session.set({ in: true, at: Date.now() });
export const enterDemo = () => session.set({ in: true, at: Date.now() });
export const exitDemo = () => session.set((s) => ({ ...s, in: false }));

/** The names the reader gives their accounts. */
export const nicknames = persisted<Partial<Record<AccountId, string>>>("nicknames", {});

export interface Settings {
  theme: "device" | "light" | "dark";
  hideBalances: boolean;
}
export const settings = persisted<Settings>("settings", { theme: "device", hideBalances: false });

/** The display follows the device; a light or dark choice kept from the removed settings page is cleared. */
delete document.documentElement.dataset.theme;

/** The books, built once per page: the reader cannot change them. */
const BOOKS = build();
export const useBooks = () => BOOKS;
/** The accounts with the reader's names for them. */
export function useAccounts() {
  const names = nicknames.use();
  return useMemo(() => ACCOUNTS.map((a) => ({ ...a, nickname: names[a.id] || a.nickname })), [names]);
}

/** Everything this study keeps, cleared. */
export function resetAll() {
  try { Object.keys(localStorage).filter((k) => k.startsWith("gg19b-")).forEach((k) => localStorage.removeItem(k)); } catch { /* nothing kept */ }
}
