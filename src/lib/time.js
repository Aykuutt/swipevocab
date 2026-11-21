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

/** Çok kısa süre gösterimi (üst çubuktaki canlar için): "45sn", "36dk", "1s12". */
export function formatShort(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}s${String(m).padStart(2, "0")}`;
  if (m > 0) return `${m}dk`;
  return `${total}sn`;
}

/** Takvim haftası (Pazartesi başlangıçlı, ISO): "2026-W47". Arkadaş ligi bununla sayılır. */
export function isoWeekKey(ms) {
  const d = new Date(ms);
  const day = (d.getDay() + 6) % 7; // Pazartesi = 0
  // O haftanın Perşembesi hangi yıldaysa hafta o yılındır; yılın kaçıncı günü / 7 = hafta.
  const thursday = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() - day + 3);
  const year = new Date(thursday).getUTCFullYear();
  const week = 1 + Math.floor((thursday - Date.UTC(year, 0, 1)) / 86_400_000 / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Ligin bitmesine (Pazartesi 00:00) kalan gün sayısı, bugün dahil. */
export function daysLeftInWeek(ms) {
  return 7 - ((new Date(ms).getDay() + 6) % 7);
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
