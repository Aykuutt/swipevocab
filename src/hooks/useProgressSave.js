// İlerlemeyi kaydeder: tarayıcı önbelleğine hemen, Supabase'e kısa bir gecikmeyle.
// Sunucuya yazılamazsa (bağlantı koptu vb.) bir süre sonra ve internet geri gelince yeniden dener.
import { useCallback, useEffect, useRef } from "react";
import { localCache, saveRemoteProgress } from "../lib/progress";

const LOCAL_DELAY_MS = 300;
const REMOTE_DELAY_MS = 1500;
const RETRY_MS = 15_000;

export function useProgressSave(state, active) {
  const latest = useRef(state);
  latest.current = state;
  const remoteTimer = useRef(null);
  const dirty = useRef(false);

  const stamp = () => ({ ...latest.current, savedAt: Date.now() });

  /** Bekleyen değişikliği hemen sunucuya yazar. Başarılıysa true döner. */
  const flush = useCallback(async () => {
    clearTimeout(remoteTimer.current);
    const s = latest.current;
    if (!s.user || !dirty.current) return true;
    dirty.current = false;
    try {
      const stamped = stamp();
      localCache.save(s.user.id, stamped);
      await saveRemoteProgress(s.user.id, stamped);
      return true;
    } catch {
      dirty.current = true;
      remoteTimer.current = setTimeout(flush, RETRY_MS);
      return false;
    }
  }, []);

  // Her değişiklikte: önbelleğe yaz, sunucu yazımını zamanla.
  useEffect(() => {
    if (!active || !state.user) return;
    dirty.current = true;
    const localTimer = setTimeout(() => localCache.save(state.user.id, stamp()), LOCAL_DELAY_MS);
    clearTimeout(remoteTimer.current);
    remoteTimer.current = setTimeout(flush, REMOTE_DELAY_MS);
    return () => clearTimeout(localTimer);
  }, [state, active, flush]);

  // Sayfa kapanırken önbelleğe yaz ve sunucuya göndermeyi dene; internet gelince tekrar dene.
  useEffect(() => {
    const onHide = () => {
      const s = latest.current;
      if (!active || !s.user) return;
      localCache.save(s.user.id, stamp());
      if (dirty.current) flush();
    };
    const onOnline = () => dirty.current && flush();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("online", onOnline);
    };
  }, [active, flush]);

  useEffect(() => () => clearTimeout(remoteTimer.current), []);

  return flush;
}
