// Durumdan türetilen değerler. Hepsi saf fonksiyondur.
import { FEATURES, FREE_LEVELS } from "../config";

/** Pro özellikleri kapalıysa herkes tam erişime sahiptir. */
export const hasFullAccess = (s) => !FEATURES.pro || s.isPro;
export const hasUnlimitedLives = (s) => FEATURES.pro && s.isPro;
export const hasStreakFreeze = (s) => FEATURES.pro && s.isPro;

/** Kartlarda çıkacak seviyeler. */
export const activeLevels = (s) => (hasFullAccess(s) ? s.settings.selectedLevels : FREE_LEVELS);

/** Seçili seviyelerdeki kelimeler. */
export const wordPool = (s, words) => {
  const levels = activeLevels(s);
  return words.filter((w) => levels.includes(w.level));
};

/** Bugün itibarıyla geçerli seri (kaçırılan gün varsa sıfır). */
export function currentStreak(s) {
  if (s.lastCompletedDay === 0) return 0;
  const missed = s.day - s.lastCompletedDay - 1;
  return missed <= 0 || (hasStreakFreeze(s) && s.freezes >= missed) ? s.streak : 0;
}

/** Öğrenme yolundaki bir ünitenin durumu: done | current | locked */
export function unitStatus(units, completed, index) {
  const done = completed.includes(units[index].id);
  const unlocked = index === 0 || completed.includes(units[index - 1].id);
  return done ? "done" : unlocked ? "current" : "locked";
}

/** Tamamlanmamış ilk ünitenin sırası (hepsi bittiyse sonuncusu). */
export function currentUnitIndex(units, completed) {
  const i = units.findIndex((u) => !completed.includes(u.id));
  return i === -1 ? units.length - 1 : i;
}

const WEEK_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/** Bu haftanın (Pazartesi-Pazar) her günü için durum. */
export function weekStrip(s) {
  if (s.startDayIndex === null) return [];
  const doneDays = new Set(s.completedDays);
  // Eski kayıtlarda completedDays yoksa seriden tahmin et.
  if (s.completedDays.length === 0 && s.streak > 0 && s.lastCompletedDay > 0) {
    for (let d = s.lastCompletedDay - s.streak + 1; d <= s.lastCompletedDay; d++) doneDays.add(d);
  }
  const todayIndex = s.startDayIndex + s.day - 1;
  const mondayIndex = todayIndex - ((todayIndex + 3) % 7);

  return WEEK_LABELS.map((label, i) => {
    const dayNo = mondayIndex + i - s.startDayIndex + 1;
    let status;
    if (dayNo < 1) status = "before";
    else if (dayNo > s.day) status = "future";
    else if (dayNo === s.day) status = doneDays.has(dayNo) ? "today-done" : "today";
    else status = doneDays.has(dayNo) ? "done" : "missed";
    return { label, status, dayNo };
  });
}
