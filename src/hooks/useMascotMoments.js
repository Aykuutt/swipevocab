// Dilbaz'ın kendiliğinden konuştuğu anlar: selamlama, yarı yol, seri rekoru, canların bitmesi.
import { useEffect, useRef } from "react";
import { STORAGE_PREFIX } from "../config";
import { mascotSay } from "../lib/mascot";
import { storage } from "../lib/storage";
import { useApp } from "../state/AppContext";
import { currentStreak, dailyCardLimit } from "../state/selectors";

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];
const GREET_DELAY_MS = 900;

function greeting(state, limit) {
  const name = state.user?.name ? `, ${state.user.name}` : "";
  // İlk günlerde kendini tanıtır.
  const hello = state.knownIds.length === 0 ? `Merhaba${name}, ben Dilbaz!` : `Merhaba${name}!`;
  const away = state.lastCompletedDay > 0 ? state.day - state.lastCompletedDay : 0;
  if (away >= 3) return { text: `Seni özledim${name}! Kaldığımız yerden devam edelim mi?`, mood: "wave" };
  if (state.phase === "swipe" && state.swipedToday === 0 && limit) {
    const streak = currentStreak(state);
    return {
      text: streak > 0 ? `${hello} ${streak} günlük serini sürdürmek için ${limit} kart seni bekliyor.` : `${hello} Bugün ${limit} kart seni bekliyor.`,
      mood: "wave",
    };
  }
  return null;
}

export function useMascotMoments() {
  const { state } = useApp();
  const userId = state.user?.id;
  const limit = dailyCardLimit(state);
  const prev = useRef(null);

  // Günde bir kez (cihaz başına) selam ver.
  useEffect(() => {
    if (!userId) return;
    const key = `${STORAGE_PREFIX}:greeted:${userId}`;
    if (storage.get(key) === state.day) return;
    const g = greeting(state, limit);
    if (!g) return;
    // İşaret, balon gerçekten gösterilince konur (ekran hemen kapanırsa bir dahakine selam verilir).
    const t = setTimeout(() => {
      storage.set(key, state.day);
      mascotSay(g.text, { mood: g.mood, duration: 5500 });
    }, GREET_DELAY_MS);
    return () => clearTimeout(t);
    // Yalnızca kullanıcı ya da gün değişince.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, state.day]);

  // Durum değişimlerine tepki ver.
  useEffect(() => {
    const now = {
      userId,
      day: state.day,
      swiped: state.swipedToday,
      streak: state.lastCompletedDay === state.day ? state.streak : -1,
      lives: state.lives,
    };
    const p = prev.current;
    prev.current = now;
    if (!p || p.userId !== userId || p.day !== now.day) return; // ilk yükleme ya da yeni gün

    const half = limit ? Math.ceil(limit / 2) : null;
    if (half && limit >= 6 && p.swiped < half && now.swiped >= half && now.swiped < limit) {
      mascotSay("Yarıladın! Böyle devam 💪", { mood: "cheer", duration: 3000 });
    } else if (now.streak > p.streak && STREAK_MILESTONES.includes(now.streak)) {
      mascotSay(`${now.streak} günlük seri! Muhteşemsin 🔥`, { mood: "cheer", duration: 5000 });
    } else if (p.lives > 0 && now.lives === 0) {
      mascotSay("Canların bitti. Eşleştir oyununda can gitmez, oradan devam edebilirsin.", {
        mood: "sad",
        duration: 6000,
      });
    }
  }, [userId, state.day, state.swipedToday, state.streak, state.lastCompletedDay, state.lives, limit]);
}
