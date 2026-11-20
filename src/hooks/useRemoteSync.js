import { useEffect, useRef } from "react";
import { STATE_VERSION } from "../config";
import { fetchRemoteProgress, newProfileId, pushRemoteProgress } from "../lib/remoteSync";

const SAVE_DELAY_MS = 900;

/**
 * Oturum açıkken ilerlemeyi SQL Server'a eşitler.
 *  - Açılışta sunucudaki kayıt yereldekinden yeniyse onu yükler.
 *  - Sonraki her değişikliği kısa bir gecikmeyle sunucuya yazar.
 * Sunucu yoksa ya da yanıt vermezse bu oturum boyunca sessizce kapanır;
 * uygulama yerel kayıtla çalışmaya devam eder.
 */
export function useRemoteSync(state, dispatch) {
  const ready = useRef(false);
  const disabled = useRef(false);
  const ignoreNext = useRef(false);
  const email = state.user?.email ?? null;

  // Hesabın eşitleme kimliği yoksa üret.
  useEffect(() => {
    if (email && !state.profileId) dispatch({ type: "SET_PROFILE_ID", profileId: newProfileId() });
  }, [email, state.profileId, dispatch]);

  // Oturum (ya da kimlik) değişince sunucudaki kaydı bir kez oku.
  useEffect(() => {
    ready.current = false;
    if (!email || !state.profileId || disabled.current) return;
    let cancelled = false;
    const localSavedAt = state.savedAt;

    fetchRemoteProgress(state.profileId)
      .then((remote) => {
        if (cancelled) return;
        const r = remote?.state;
        if (r && r.version === STATE_VERSION && (r.savedAt ?? 0) > localSavedAt) {
          ignoreNext.current = true; // sunucudan geleni geri yazma
          dispatch({ type: "HYDRATE", state: { ...r, user: state.user, profileId: state.profileId } });
        }
        ready.current = true;
      })
      .catch(() => {
        if (!cancelled) disabled.current = true;
      });

    return () => {
      cancelled = true;
    };
    // Yalnızca oturum ve kimlik değişince çalışır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, state.profileId]);

  // Değişiklikleri gecikmeli olarak sunucuya yaz.
  useEffect(() => {
    if (!email || !state.profileId || !ready.current || disabled.current) return;
    if (ignoreNext.current) {
      ignoreNext.current = false;
      return;
    }
    const timer = setTimeout(() => {
      pushRemoteProgress(state.profileId, { ...state, savedAt: Date.now() }).catch(() => {
        disabled.current = true;
      });
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, email]);
}
