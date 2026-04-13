// Enterprise-friendly admin auth cache utilities.
// Keeps UI responsive by avoiding repeated admin RPC checks on every navigation.

export type AdminAccessCache = {
  userId: string;
  isAdmin: boolean;
  email?: string;
  checkedAt: number; // epoch ms
};

const ADMIN_CACHE_KEY = "dd_admin_access_cache_v1";
const DEVICE_ID_KEY = "dd_device_id_v1";

// How long we trust cached admin access before requiring a fresh RPC.
export const ADMIN_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const id = (globalThis.crypto && "randomUUID" in globalThis.crypto)
      ? globalThis.crypto.randomUUID()
      : `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // If storage is blocked, fall back to an ephemeral id.
    return `dev_ephemeral_${Date.now()}`;
  }
}

export function readAdminAccessCache(): AdminAccessCache | null {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminAccessCache;

    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.userId || typeof parsed.userId !== "string") return null;
    if (typeof parsed.isAdmin !== "boolean") return null;
    if (typeof parsed.checkedAt !== "number") return null;

    return parsed;
  } catch {
    return null;
  }
}

export function writeAdminAccessCache(cache: AdminAccessCache): void {
  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export function clearAdminAccessCache(): void {
  try {
    localStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {
    // ignore
  }
}

export function isAdminCacheFresh(cache: AdminAccessCache | null, userId: string): boolean {
  if (!cache) return false;
  if (cache.userId !== userId) return false;
  return Date.now() - cache.checkedAt < ADMIN_CACHE_TTL_MS;
}
