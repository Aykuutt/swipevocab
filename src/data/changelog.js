// "Neler yeni": uygulama güncellenince ekranda çıkan kartta gösterilir (en yenisi en üstte).
// Yeni sürüm yayınlarken buraya kısa, kullanıcının anlayacağı maddeler ekle. config.js'teki APP_VERSION ile aynı sürüm.
export const CHANGELOG = [
  {
    version: "0.20.0",
    items: ["Arkadaşlarla haftalık lig: bu hafta en çok puanı kim toplayacak? Her Pazartesi sıfırlanır.", "Davet bağlantısı: paylaş, bağlantıyla yeni gelen arkadaşınla otomatik arkadaş olun.", "Köye ücretsiz dostluk süsleri: 1 arkadaşla Dostluk ağacı, 3 arkadaşla Dostluk kemeri."],
  },
  {
    version: "0.19.1",
    items: ["Güncelleme gelince artık bu kartla haber veriyoruz.", "Uygulama açılır açılmaz yeni sürümü kontrol ediyor."],
  },
  {
    version: "0.19.0",
    items: ["Köye ilk girişte Dilbaz'la kısa tur.", "Köyde ? düğmesi: o an ne yapacağını Dilbaz söyler.", "Haftalık büyük sipariş artık sayfa yenilenince sıfırlanmıyor."],
  },
  {
    version: "0.18.2",
    items: ["Her gün mutlaka hedef kadar kart geliyor (kelimeler bitse bile tekrarlarla).", "Telefonda köy haritasının donması düzeltildi."],
  },
  {
    version: "0.18.0",
    items: ["Arkadaşlar: arkadaş koduyla ekle, köylerini gez, beğeni bırak."],
  },
  {
    version: "0.17.0",
    items: ["Köylü hikâyeleri: her köylünün 3 bölümlük hikâyesi, kalp kazandıkça açılır."],
  },
  {
    version: "0.16.0",
    items: ["Kelime defteri: öğrendiğin kelimeler, arama, dinleme ve \"tekrar sor\"."],
  },
];

const parse = (v) => (v || "0").split(".").map((n) => parseInt(n, 10) || 0);
/** a, b'den yeni mi? */
export function isNewer(a, b) {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  }
  return false;
}

/** Görülen sürümden sonra gelen yenilikler (en fazla `max` madde). seen null ise yalnızca en son sürüm. */
export function changesSince(seen, max = 6) {
  const list = seen ? CHANGELOG.filter((c) => isNewer(c.version, seen)) : CHANGELOG.slice(0, 1);
  return list.flatMap((c) => c.items).slice(0, max);
}
