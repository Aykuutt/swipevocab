// Oturumu izler: Supabase hesabı ya da misafir (hesapsız, yalnızca bu cihazda).
// Oturum açılınca kullanıcının ilerlemesini yükler.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_PREFIX } from "../config";
import { toAppUser } from "../lib/auth";
import { fetchRemoteProgress, loadLegacyProgress, localCache, pendingOnboarding } from "../lib/progress";
import { storage } from "../lib/storage";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { localDayIndex } from "../lib/time";

const GUEST_FLAG = `${STORAGE_PREFIX}:guest`;
export const GUEST_ID = "guest";
const guestUser = () => ({ id: GUEST_ID, email: "", name: "", guest: true });

/** Misafirin kayıtlı ilerlemesi varsa onu, yoksa yeni bir başlangıç. */
function guestAction(now, goal, level) {
  const cached = localCache.load(GUEST_ID);
  if (cached) return { type: "HYDRATE", state: { ...cached, user: guestUser() } };
  return { type: "START_ACCOUNT", user: guestUser(), dayIndex: localDayIndex(now), goal, level };
}

function forgetGuest() {
  storage.remove(GUEST_FLAG);
  localCache.remove(GUEST_ID);
}

/**
 * Oturum açan kullanıcı için başlangıç durumunu bulur:
 * sunucu ya da tarayıcı önbelleğinden hangisi yeniyse o; ikisi de yoksa bu cihazdaki misafir
 * ilerlemesi ya da eski (yalnızca tarayıcıda tutulan) hesap kaydı; o da yoksa yeni hesap.
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
  const found = newest || localCache.load(GUEST_ID) || loadLegacyProgress(user.email);
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
 * status: unconfigured | loading | signedOut | guest | signedIn | error
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
        if (storage.get(GUEST_FLAG)) {
          if (loadedFor.current === GUEST_ID) return;
          loadedFor.current = GUEST_ID;
          dispatch(guestAction(getNow()));
          setStatus("guest");
          return;
        }
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
        forgetGuest(); // misafir ilerlemesi (varsa) artık hesapta
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

  /** Hesap açmadan başla. İlerleme yalnızca bu cihazda tutulur. */
  const startGuest = useCallback(
    (goal, level) => {
      storage.set(GUEST_FLAG, true);
      loadedFor.current = GUEST_ID;
      dispatch(guestAction(getNow(), goal, level));
      setStatus("guest");
    },
    [dispatch, getNow]
  );

  const retry = useCallback(() => handleSession(lastSession.current), [handleSession]);
  const finishRecovery = useCallback(() => setRecovery(false), []);

  return useMemo(
    () => ({ status, recovery, retry, finishRecovery, startGuest }),
    [status, recovery, retry, finishRecovery, startGuest]
  );
}
