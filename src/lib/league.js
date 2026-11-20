// Haftalık lig: kullanıcıyı sabit isimli rakiplerle karşılaştırır.
// Rakip puanları hafta numarasından türetildiği için her hafta değişir
// ama aynı hafta içinde sabit kalır.

const RIVALS = ["Ayşe K.", "Mehmet Y.", "Elif D.", "Can T.", "Zeynep A.", "Deniz S.", "Kerem B.", "Naz Ç."];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10_000;
  return x - Math.floor(x);
}

export function leagueTable(week, userXp, userName) {
  const rows = [
    ...RIVALS.map((name, i) => ({
      name,
      xp: Math.round(30 + seededRandom(week * 37 + i * 7) * 160),
      isUser: false,
    })),
    { name: userName || "Sen", xp: userXp, isUser: true },
  ];
  rows.sort((a, b) => b.xp - a.xp);
  return rows;
}

/** Kullanıcının sırası (0'dan başlar). */
export function leagueRank(week, userXp, userName) {
  return leagueTable(week, userXp, userName).findIndex((r) => r.isUser);
}
