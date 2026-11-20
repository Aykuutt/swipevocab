// Supabase oturumunu izler ve oturum açılınca kullanıcının ilerlemesini yükler.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toAppUser } from "../lib/auth";
import { fetchRemoteProgress, loadLegacyProgress, localCache, pendingOnboarding } from "../lib/progress";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { localDayIndex } from "../lib/time";

/**
 * Oturum açan kullanıcı için başlangıç durumunu bulur:
 * sunucu ya da tarayıcı önbelleğinden hangisi yeniyse o; ikisi de yoksa eski (yalnızca
 * tarayıcıda tutulan) hesap kaydı; o da yoksa yeni hesap.
 */
async function loadAccount(authUser, now) {
  const user = toAppUser(authUser);
  const cached = localCache.load(user.id);
  // Sunucuya ulaşılamazsa ve elde önbellek yoksa yeni hesap AÇMA: boş ilerleme
  // sunucudaki gerçek kaydın üstüne yazılırdı. Bunun yerine hata göster.
  let remote;
  try {
    remote = await fetchRemoteProgress(user.id);
  } catch (err) {
    if (!cached) throw err;
    remote = null;
  }

  const newest = [cached, remote].filter(Boolean).sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))[0];
  const found = newest || loadLegacyProgress(user.email);
  if (found) {
    return { type: "HYDRATE", state: { ...found, user: { ...user, name: found.user?.name || user.name } } };
  }

  const pending = pendingOnboarding.load();
  pendingOnboarding.clear();
  return {
    type: "START_ACCOUNT",
    user,
    dayIndex: localDayIndex(now),
    goal: pending?.goal,
    level: pending?.level,
  };
}

/**
 * status: unconfigured | loading | signedOut | signedIn | error
 * recovery: şifre sıfırlama bağlantısıyla gelindi, yeni şifre sorulmalı
 */
export function useAccount({ dispatch, getNow }) {
  const [status, setStatus] = useState(isSupabaseConfigured ? "loading" : "unconfigured");
  const [recovery, setRecovery] = useState(false);
  const loadedFor = useRef(null);
  const lastSession = useRef(null);

  const handleSession = useCallback(
    async (session) => {
      lastSession.current = session;
      const authUser = session?.user;
      if (!authUser) {
        loadedFor.current = null;
        dispatch({ type: "SIGN_OUT" });
        setStatus("signedOut");
        return;
      }
      if (loadedFor.current === authUser.id) return; // token yenilemesi vb.
      loadedFor.current = authUser.id;
      setStatus("loading");
      try {
        const action = await loadAccount(authUser, getNow());
        if (loadedFor.current !== authUser.id) return;
        dispatch(action);
        setStatus("signedIn");
      } catch {
        if (loadedFor.current !== authUser.id) return;
        loadedFor.current = null;
        setStatus("error");
      }
    },
    [dispatch, getNow]
  );

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      // Supabase, bu geri çağrının içinde başka auth çağrısı beklenmemesini önerir.
      setTimeout(() => handleSession(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [handleSession]);

  const retry = useCallback(() => handleSession(lastSession.current), [handleSession]);
  const finishRecovery = useCallback(() => setRecovery(false), []);

  return useMemo(() => ({ status, recovery, retry, finishRecovery }), [status, recovery, retry, finishRecovery]);
}
