import { useMemo, useSyncExternalStore } from "react";
import { ACCOUNTS, build, type AccountId, type Transfer } from "../bank/ledger";
import { CUSTOMER } from "../content";

/**
 * Everything a reader changes, kept in this browser's local storage under
 * `gg19b-*` and sent nowhere: whether they are signed in, the transfers they
 * make, the names they give their accounts, and their settings. One store
 * per kind, each a value with a setter and a hook, so a change made on one
 * page shows on the others. If storage is unavailable the stores keep their
 * values in memory for the visit.
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

/** Signed in or not. The demo sign-in is the only one; `?demo` in a page's address signs in, for captures. */
export const session = persisted<{ in: boolean; at: number; remember: boolean }>("session", { in: false, at: 0, remember: false });
if (typeof location !== "undefined" && new URLSearchParams(location.search).has("demo") && !session.get().in) session.set({ in: true, at: Date.now(), remember: false });
export const logIn = (remember: boolean) => session.set({ in: true, at: Date.now(), remember });
export const logOut = () => session.set((s) => ({ ...s, in: false }));

/** The reader's own transfers, all dated today. */
export const transfers = persisted<Transfer[]>("transfers", []);
/** The names the reader gives their accounts. */
export const nicknames = persisted<Partial<Record<AccountId, string>>>("nicknames", {});

export interface Settings {
  theme: "device" | "light" | "dark";
  hideBalances: boolean;
  language: "English" | "Español";
  delivery: Record<AccountId, "online" | "paper">;
  alerts: { lowBalance: boolean; lowAmount: number; deposit: boolean; largePurchase: boolean; largeAmount: number; due: boolean; channel: "email" | "text" | "both" };
  twoStep: boolean;
  email: string;
  mobile: string;
  address: typeof CUSTOMER.address;
}
export const settings = persisted<Settings>("settings", {
  theme: "device", hideBalances: false, language: "English",
  delivery: { checking: "online", savings: "online", card: "paper", mortgage: "paper" },
  alerts: { lowBalance: true, lowAmount: 50000, deposit: true, largePurchase: false, largeAmount: 50000, due: true, channel: "email" },
  twoStep: true, email: CUSTOMER.email, mobile: CUSTOMER.mobile, address: CUSTOMER.address,
});

/** Applies the Display setting to the page: an explicit light or dark, or the device's own. */
export function applyTheme(t: Settings["theme"]) {
  const root = document.documentElement;
  if (t === "device") delete root.dataset.theme; else root.dataset.theme = t;
}
applyTheme(settings.get().theme);

/** The books as they stand, with the reader's transfers, recomputed when those change. */
export function useBooks() {
  const own = transfers.use();
  return useMemo(() => build(own), [own]);
}
/** The accounts with the reader's names for them. */
export function useAccounts() {
  const names = nicknames.use();
  return useMemo(() => ACCOUNTS.map((a) => ({ ...a, nickname: names[a.id] || a.nickname })), [names]);
}

/** Everything this study keeps, cleared. */
export function resetAll() {
  try { Object.keys(localStorage).filter((k) => k.startsWith("gg19b-")).forEach((k) => localStorage.removeItem(k)); } catch { /* nothing kept */ }
}
