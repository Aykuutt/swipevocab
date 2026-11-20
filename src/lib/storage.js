// localStorage sarmalayıcısı. Tarayıcı depolamaya izin vermezse
// (gizli pencere vb.) veriler bellekte tutulur.
import { STATE_VERSION, STORAGE_PREFIX } from "../config";

const memory = new Map();
let backend;

function getBackend() {
  if (backend !== undefined) return backend;
  try {
    const probe = "__swipevocab_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    backend = window.localStorage;
  } catch {
    backend = null;
  }
  return backend;
}

export const storage = {
  get(key) {
    try {
      const store = getBackend();
      const raw = store ? store.getItem(key) : memory.get(key) ?? null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    const raw = JSON.stringify(value);
    const store = getBackend();
    if (store) {
      try {
        store.setItem(key, raw);
        return;
      } catch {
        // depolama dolu: belleğe düş
      }
    }
    memory.set(key, raw);
  },
  remove(key) {
    const store = getBackend();
    if (store) {
      try {
        store.removeItem(key);
      } catch {
        // yok say
      }
    }
    memory.delete(key);
  },
};

const SESSION_KEY = `${STORAGE_PREFIX}:session`;
const progressKey = (email) => `${STORAGE_PREFIX}:progress:${email}`;

/** Açık oturum ve kullanıcı başına ilerleme kaydı. */
export const progressStore = {
  getSession() {
    return storage.get(SESSION_KEY)?.email ?? null;
  },
  setSession(email) {
    storage.set(SESSION_KEY, { email });
  },
  clearSession() {
    storage.remove(SESSION_KEY);
  },
  load(email) {
    const saved = storage.get(progressKey(email));
    return saved && saved.version === STATE_VERSION ? saved : null;
  },
  save(email, state) {
    storage.set(progressKey(email), state);
  },
};
