// Davet bağlantısı: https://.../?davet=KOD. Bağlantıyla açılınca kod saklanır, adres çubuğundan silinir.
// Kullanıcı hesap açıp giriş yapınca davet edenle arkadaş olur (yeni hesapsa doğrudan, değilse istekle).
import { STORAGE_PREFIX } from "../config";
import { storage } from "./storage";

const KEY = `${STORAGE_PREFIX}:invite`;
const PARAM = "davet";

/** Sayfa açılışında çağrılır: bağlantıdaki davet kodunu saklar ve adresi temizler. */
export function captureInvite() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const code = (url.searchParams.get(PARAM) || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return;
    storage.set(KEY, code);
    url.searchParams.delete(PARAM);
    window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
  } catch {
    // adres okunamadıysa davet yok sayılır
  }
}

export const pendingInvite = {
  get: () => storage.get(KEY),
  clear: () => storage.remove(KEY),
};

/** Paylaşılacak davet bağlantısı. */
export const inviteUrl = (code) => `${window.location.origin}/?${PARAM}=${code}`;
