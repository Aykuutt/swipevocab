// Gün ve süre hesapları. Günler yerel saat dilimine göre sayılır.

const DAY_MS = 86_400_000;

/** Yerel takvime göre 1970'ten bu yana geçen gün sayısı. */
export function localDayIndex(ms) {
  const offset = new Date(ms).getTimezoneOffset() * 60_000;
  return Math.floor((ms - offset) / DAY_MS);
}

/** Bir sonraki gece yarısına kalan milisaniye. */
export function msUntilMidnight(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime() - ms;
}

/** Uygulamadaki gün numarasından (1'den başlar) hafta numarası. */
export function weekOfDay(day) {
  return Math.floor((day - 1) / 7) + 1;
}

/** Kalan süreyi "2s 15dk", "40dk" ya da "30sn" biçiminde yazar. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}s ${m}dk`;
  if (m > 0) return `${m}dk`;
  return `${s}sn`;
}

export const formatMinutes = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
