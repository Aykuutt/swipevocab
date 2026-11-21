// Başarımlar: her birinin birkaç düzeyi vardır. Değerler uygulama durumundan hesaplanır.
import { currentStreak } from "../../state/selectors";

export const BADGES = [
  { key: "streak", icon: "flame", title: "İstikrarlı", tiers: [3, 7, 14, 30], desc: (n) => `${n} günlük bir seriye ulaş` },
  { key: "xp", icon: "star", title: "Bilge", tiers: [50, 150, 400, 1000], desc: (n) => `${n} puan kazan` },
  { key: "words", icon: "book", title: "Kelime ustası", tiers: [5, 15, 40, 90], desc: (n) => `${n} kelime öğren` },
  { key: "units", icon: "path", title: "Yol gezgini", tiers: [1, 3, 6, 12], desc: (n) => `${n} ünite tamamla` },
  { key: "languages", icon: "game", title: "Dil meraklısı", tiers: [2, 3, 4], desc: (n) => `${n} farklı dilde kelime öğren` },
  { key: "top3", icon: "trophy", title: "Şampiyon", tiers: [1, 3, 6, 10], desc: (n) => `Ligde ilk 3'e ${n} kez gir` },
];

/** Her başarım için o anki değer. */
export function badgeValues(state) {
  const learned = [state.knownIds.length, ...Object.values(state.languages || {}).map((l) => l.knownIds?.length ?? 0)];
  return {
    streak: currentStreak(state),
    xp: state.xpTotal ?? state.xp,
    words: state.knownIds.length,
    units: state.completedUnits.length,
    languages: learned.filter((n) => n > 0).length,
    top3: state.top3Finishes,
  };
}

export function badgeProgress(value, tiers) {
  const level = tiers.filter((t) => value >= t).length;
  const maxed = level >= tiers.length;
  const next = maxed ? tiers[tiers.length - 1] : tiers[level];
  const prev = level > 0 ? tiers[level - 1] : 0;
  const progress = maxed ? 100 : Math.round(((value - prev) / (next - prev)) * 100);
  return { level, maxed, next, progress, total: tiers.length };
}
