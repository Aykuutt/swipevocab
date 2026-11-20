// İlerleme kaydı: asıl kopya Supabase'deki `progress` tablosunda, ayrıca hızlı açılış ve
// kısa süreli bağlantı kopukluklarına karşı tarayıcıda bir önbellek tutulur.
import { STATE_VERSION, STORAGE_PREFIX } from "../config";
import { storage } from "./storage";
import { supabase } from "./supabase";

const cacheKey = (userId) => `${STORAGE_PREFIX}:cache:${userId}`;
const PENDING_KEY = `${STORAGE_PREFIX}:pending-onboarding`;

const isCurrent = (s) => s && s.version === STATE_VERSION;

export const localCache = {
  load: (userId) => {
    const s = storage.get(cacheKey(userId));
    return isCurrent(s) ? s : null;
  },
  save: (userId, state) => storage.set(cacheKey(userId), state),
  remove: (userId) => storage.remove(cacheKey(userId)),
};

/** Supabase'den önceki, yalnızca tarayıcıda tutulan hesap sisteminin kaydı (e-postaya göre). */
export function loadLegacyProgress(email) {
  const s = storage.get(`${STORAGE_PREFIX}:progress:${email.trim().toLowerCase()}`);
  return isCurrent(s) ? s : null;
}

/** Kayıt sırasında seçilen amaç, seviye ve dil; e-posta onayından dönünce kullanılır. */
export const pendingOnboarding = {
  save: (value) => storage.set(PENDING_KEY, value),
  load: () => storage.get(PENDING_KEY),
  clear: () => storage.remove(PENDING_KEY),
};

export async function fetchRemoteProgress(userId) {
  const { data, error } = await supabase.from("progress").select("state").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return isCurrent(data?.state) ? data.state : null;
}

export async function saveRemoteProgress(userId, state) {
  const { error } = await supabase
    .from("progress")
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}
