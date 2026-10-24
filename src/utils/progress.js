const LEAGUE_BOTS = ["Ayşe K.", "Mehmet Y.", "Elif D.", "Can T.", "Zeynep A.", "Deniz S.", "Kerem B.", "Naz Ç."];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function buildLeague(weekNumber, userXp, userName) {
  const bots = LEAGUE_BOTS.map((name, i) => ({
    name,
    xp: Math.round(30 + seededRandom(weekNumber * 37 + i * 7) * 160),
    isUser: false,
  }));
  const rows = [...bots, { name: userName || "Sen", xp: userXp, isUser: true }];
  rows.sort((a, b) => b.xp - a.xp);
  return rows;
}

// Duolingo tarzı kademeli rozetler: her rozetin birden fazla seviyesi var,
// bir sonraki eşiğe olan ilerleme yüzde olarak hesaplanır.
export const TIERED_BADGES = [
  { key: "streak", icon: "🔥", title: "İstikrarlı", tiers: [3, 7, 14, 30], desc: (n) => `${n} günlük bir seriye ulaş` },
  { key: "xp", icon: "🧙", title: "Bilge", tiers: [50, 150, 400, 1000], desc: (n) => `${n} Puan kazan` },
  { key: "words", icon: "📚", title: "Kelime Ustası", tiers: [5, 15, 40, 90], desc: (n) => `${n} kelime öğren` },
  { key: "top3", icon: "🏆", title: "Şampiyon", tiers: [1, 3, 6, 10], desc: (n) => `Ligde ilk 3'e ${n} kez gir` },
];

export function tierInfo(value, tiers) {
  const level = tiers.filter((t) => value >= t).length;
  const maxed = level >= tiers.length;
  const next = maxed ? tiers[tiers.length - 1] : tiers[level];
  const prevThreshold = level > 0 ? tiers[level - 1] : 0;
  const progress = maxed ? 100 : Math.round(((value - prevThreshold) / (next - prevThreshold)) * 100);
  return { level, maxed, next, progress };
}

