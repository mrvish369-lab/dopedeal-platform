import type { LockFunc } from "@supabase/auth-js";

// Cross-tab lock that does NOT rely on navigator.locks (which can hang/abort in embedded iframes).
// Uses localStorage with TTL + an in-memory queue for same-tab serialization.

const INSTANCE_ID =
  (globalThis.crypto && "randomUUID" in globalThis.crypto)
    ? globalThis.crypto.randomUUID()
    : `inst_${Math.random().toString(16).slice(2)}_${Date.now()}`;

type LockRecord = { owner: string; expiresAt: number };

const inTabQueues = new Map<string, Promise<unknown>>();

function canUseLocalStorage(): boolean {
  try {
    const k = "__dd_lock_test__";
    globalThis.localStorage?.setItem(k, "1");
    globalThis.localStorage?.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const HAS_LOCAL_STORAGE = canUseLocalStorage();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function now() {
  return Date.now();
}

function readRecord(key: string): LockRecord | null {
  if (!HAS_LOCAL_STORAGE) return null;
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LockRecord;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.owner !== "string") return null;
    if (typeof parsed.expiresAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRecord(key: string, rec: LockRecord) {
  if (!HAS_LOCAL_STORAGE) return;
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(rec));
  } catch {
    // ignore
  }
}

function removeRecordIfOwned(key: string) {
  if (!HAS_LOCAL_STORAGE) return;
  try {
    const current = readRecord(key);
    if (current?.owner === INSTANCE_ID) {
      globalThis.localStorage?.removeItem(key);
    }
  } catch {
    // ignore
  }
}

async function withInTabQueue<R>(name: string, fn: () => Promise<R>): Promise<R> {
  const prev = inTabQueues.get(name) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  const current = prev.then(() => next);
  inTabQueues.set(name, current);

  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (inTabQueues.get(name) === current) inTabQueues.delete(name);
  }
}


export const supabaseAuthLock: LockFunc = async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => {
  return withInTabQueue(name, async () => {
    const key = `__dd_supabase_lock__:${name}`;

    // Translate timeout semantics; avoid indefinite waits in client UI.
    const timeoutMs = acquireTimeout < 0 ? 15000 : acquireTimeout;
    const start = now();
    const ttlMs = Math.max(5000, timeoutMs + 5000);

    while (true) {
      const current = readRecord(key);
      const expired = !current || current.expiresAt <= now();
      const ownedByUs = current?.owner === INSTANCE_ID;

      if (expired || ownedByUs) {
        writeRecord(key, { owner: INSTANCE_ID, expiresAt: now() + ttlMs });

        // Verify ownership (handles races)
        const verify = readRecord(key);
        if (verify?.owner === INSTANCE_ID) break;
      }

      if (timeoutMs === 0) {
        const err = new Error("Lock acquire timeout");
        // @ts-expect-error - supabase auth checks this shape
        err.isAcquireTimeout = true;
        throw err;
      }

      if (now() - start > timeoutMs) {
        const err = new Error("Lock acquire timeout");
        // @ts-expect-error - supabase auth checks this shape
        err.isAcquireTimeout = true;
        throw err;
      }

      await sleep(75);
    }

    try {
      return await fn();
    } finally {
      removeRecordIfOwned(key);
    }
  });
};
