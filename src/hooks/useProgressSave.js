// İlerlemeyi kaydeder ve cihazlar arasında güncel tutar.
//  * Her değişiklik tarayıcı önbelleğine hemen, Supabase'e kısa bir gecikmeyle yazılır.
//  * Sunucuya yazılamazsa (bağlantı koptu vb.) bir süre sonra ve internet geri gelince yeniden denenir.
//  * Uygulama yeniden öne gelince (sekme değişimi, telefonda uygulamaya dönüş) sunucudaki kayıt
//    bu cihazdakinden yeniyse o yüklenir. Böylece aynı hesap iki cihazda açıkken biri diğerinin
//    ilerlemesini (ve günlük kart sayacını) ezmez.
import { useCallback, useEffect, useRef } from "react";
import { fetchRemoteProgress, localCache, saveRemoteProgress } from "../lib/progress";

const LOCAL_DELAY_MS = 300;
const REMOTE_DELAY_MS = 1500;
const RETRY_MS = 15_000;
const REFRESH_MIN_GAP_MS = 5_000;

export function useProgressSave(state, active, dispatch) {
  const latest = useRef(state);
  latest.current = state;
  const remoteTimer = useRef(null);
  const dirty = useRef(false);
  // Bu cihazın bildiği en son kaydın zamanı (yüklenen ya da yazılan).
  const knownSavedAt = useRef(state.savedAt ?? 0);
  const seenSavedAt = useRef(state.savedAt ?? 0);
  const lastRefresh = useRef(0);

  const stamp = () => ({ ...latest.current, savedAt: Date.now() });

  /** Bekleyen değişikliği hemen sunucuya yazar. Başarılıysa true döner. */
  const flush = useCallback(async () => {
    clearTimeout(remoteTimer.current);
    const s = latest.current;
    if (!s.user || !dirty.current) return true;
    dirty.current = false;
    if (s.user.guest) {
      // Misafir: ilerleme yalnızca bu cihazda.
      localCache.save(s.user.id, stamp());
      return true;
    }
    try {
      const stamped = stamp();
      localCache.save(s.user.id, stamped);
      await saveRemoteProgress(s.user.id, stamped);
      knownSavedAt.current = Math.max(knownSavedAt.current, stamped.savedAt);
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
    // Kayıt yüklendiyse (HYDRATE) bu bir kullanıcı değişikliği değil: geri yazma.
    if ((state.savedAt ?? 0) !== seenSavedAt.current) {
      seenSavedAt.current = state.savedAt ?? 0;
      knownSavedAt.current = Math.max(knownSavedAt.current, seenSavedAt.current);
      return;
    }
    dirty.current = true;
    const localTimer = setTimeout(() => localCache.save(state.user.id, stamp()), LOCAL_DELAY_MS);
    clearTimeout(remoteTimer.current);
    remoteTimer.current = setTimeout(flush, REMOTE_DELAY_MS);
    return () => clearTimeout(localTimer);
  }, [state, active, flush]);

  /** Sunucuda bu cihazdakinden yeni bir kayıt varsa yükler. */
  const refresh = useCallback(async () => {
    const s = latest.current;
    if (!active || !s.user || s.user.guest) return;
    if (dirty.current) {
      await flush(); // önce bu cihazdaki değişiklikleri yaz
      return;
    }
    if (Date.now() - lastRefresh.current < REFRESH_MIN_GAP_MS) return;
    lastRefresh.current = Date.now();
    try {
      const remote = await fetchRemoteProgress(s.user.id);
      const cur = latest.current;
      if (!remote || !cur.user || cur.user.id !== s.user.id || dirty.current) return;
      if ((remote.savedAt ?? 0) > knownSavedAt.current) {
        dispatch({ type: "HYDRATE", state: { ...remote, user: { ...cur.user, name: remote.user?.name || cur.user.name } } });
      }
    } catch {
      // bağlantı yoksa mevcut haliyle devam
    }
  }, [active, dispatch, flush]);

  // Sayfa kapanırken kaydet; öne gelince yenile; internet gelince bekleyeni gönder.
  useEffect(() => {
    const onHide = () => {
      const s = latest.current;
      if (!active || !s.user) return;
      localCache.save(s.user.id, stamp());
      if (dirty.current) flush();
    };
    const onVisible = () => document.visibilityState === "visible" && refresh();
    const onOnline = () => (dirty.current ? flush() : refresh());
    window.addEventListener("pagehide", onHide);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, flush, refresh]);

  useEffect(() => () => clearTimeout(remoteTimer.current), []);

  return flush;
}
