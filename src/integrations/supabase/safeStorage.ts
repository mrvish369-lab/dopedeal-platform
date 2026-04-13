// Robust storage adapter for environments where localStorage may be blocked (e.g. embedded iframes).
// Falls back to in-memory storage so Supabase Auth never hangs.

const memory = new Map<string, string>();

function canUseLocalStorage(): boolean {
  try {
    const k = "__dd_ls_test__";
    globalThis.localStorage?.setItem(k, "1");
    globalThis.localStorage?.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = canUseLocalStorage();

export const safeBrowserStorage: Storage = {
  get length() {
    try {
      return hasLocalStorage ? globalThis.localStorage.length : memory.size;
    } catch {
      return memory.size;
    }
  },
  clear() {
    try {
      if (hasLocalStorage) globalThis.localStorage.clear();
    } catch {
      // ignore
    }
    memory.clear();
  },
  getItem(key: string) {
    try {
      const v = hasLocalStorage ? globalThis.localStorage.getItem(key) : null;
      if (v !== null) return v;
    } catch {
      // ignore
    }
    return memory.get(key) ?? null;
  },
  key(index: number) {
    try {
      if (hasLocalStorage) return globalThis.localStorage.key(index);
    } catch {
      // ignore
    }
    return Array.from(memory.keys())[index] ?? null;
  },
  removeItem(key: string) {
    try {
      if (hasLocalStorage) globalThis.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    memory.delete(key);
  },
  setItem(key: string, value: string) {
    try {
      if (hasLocalStorage) {
        globalThis.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // ignore
    }
    memory.set(key, value);
  },
};
