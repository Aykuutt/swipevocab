// Gelen arkadaşlık isteği sayısı: Profil sekmesinde ve Arkadaşlarım satırında bildirim noktası için.
// Uygulama açıkken bir dakikada bir ve uygulamaya geri dönülünce yenilenir.
import { useCallback, useEffect, useState } from "react";
import { FEATURES } from "../config";
import { countFriends, countIncoming } from "../lib/friends";

const EVERY_MS = 60_000;

export function useFriendRequests(state, active, dispatch) {
  const [count, setCount] = useState(0);
  const user = state.user;
  const enabled = FEATURES.friends && active && !!user && !user.guest;

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const [incoming, friends] = await Promise.all([countIncoming(), countFriends()]);
      setCount(incoming);
      dispatch({ type: "SET_FRIENDS_COUNT", count: friends });
    } catch {
      // bağlantı yoksa bir sonraki denemede
    }
  }, [enabled, dispatch]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const timer = setInterval(refresh, EVERY_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, refresh]);

  return { incoming: enabled ? count : 0, setIncoming: setCount, refreshIncoming: refresh };
}
