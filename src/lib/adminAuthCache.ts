/**
 * Admin auth cache utilities.
 *
 * Security model:
 * - Cache is stored in sessionStorage (cleared on tab/browser close, not persisted).
 * - Cache is treated as a UX performance hint ONLY — it never grants access by itself.
 * - AdminAuthContext always performs a background RPC re-verification even when the
 *   cache is fresh, and always re-verifies on any sensitive action.
 * - The cache value is bound to the authenticated userId; a mismatch invalidates it.
 */

export type AdminAccessCache = {
  userId: string;
  isAdmin: boolean;
  email?: string;
  checkedAt: number; // epoch ms
  version: number; // cache schema version for migration support
};

const ADMIN_CACHE_KEY = "dd_admin_access_cache_v2"; // Incremented for versioning
const DEVICE_ID_KEY = "dd_device_id_v1";
const CURRENT_CACHE_VERSION = 2;

// How long we trust cached admin access before requiring a fresh RPC.
// Kept short (5 min) so a revoked admin loses access quickly.
export const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (down from 30)

export function getOrCreateDeviceId(): string {
  try {
    // Device ID is stored in localStorage for persistence across sessions.
    // It is used for auditing only — NOT for authorization decisions.
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const id =
      globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `dev_ephemeral_${Date.now()}`;
  }
}

/** Read the admin cache from sessionStorage (cleared on tab close). */
export function readAdminAccessCache(): AdminAccessCache | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminAccessCache;

    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.userId || typeof parsed.userId !== "string") return null;
    if (typeof parsed.isAdmin !== "boolean") return null;
    if (typeof parsed.checkedAt !== "number") return null;

    // Version check - invalidate cache if version mismatch
    if (!parsed.version || parsed.version !== CURRENT_CACHE_VERSION) {
      clearAdminAccessCache();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/** Write the admin cache to sessionStorage (atomic operation). */
export function writeAdminAccessCache(cache: Omit<AdminAccessCache, 'version'>): void {
  try {
    // Add version to cache data
    const versionedCache: AdminAccessCache = {
      ...cache,
      version: CURRENT_CACHE_VERSION,
    };
    
    // Atomic write - sessionStorage.setItem is synchronous and atomic
    sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(versionedCache));
  } catch {
    // ignore — cache is optional
  }
}

/** Clear the admin cache from sessionStorage. */
export function clearAdminAccessCache(): void {
  try {
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns true only when the cache is fresh AND belongs to the current user.
 * A stale or mismatched cache is always treated as invalid.
 */
export function isAdminCacheFresh(
  cache: AdminAccessCache | null,
  userId: string
): boolean {
  if (!cache) return false;
  if (cache.userId !== userId) return false;
  return Date.now() - cache.checkedAt < ADMIN_CACHE_TTL_MS;
}
