/*
 * A tiny, SSR-safe, typed wrapper over localStorage (spec §3 — all user data
 * stays on device). The /learn progress and shield score are small and simple,
 * so localStorage is enough and keeps us dependency-free. Every call is guarded:
 * on the server, in private mode, or with storage disabled it degrades to a
 * no-op / default rather than throwing.
 */

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked — safe to ignore for this use.
  }
}
