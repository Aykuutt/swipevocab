// Kart'ın köyü: kazanılan puanlarla kurulan ve büyütülen binalar.
// Puan köyün parasıdır. Bina kurmak ve yükseltmek puan harcar; bazı binalar her gün hasat verir.
// Kurallar saf fonksiyonlardır (test edilebilir); durum state.village içinde tutulur.

export const MAX_LEVEL = 3;

/**
 * costs[i]: i. seviyeden (i+1). seviyeye çıkmanın bedeli (0 -> 1 kurulum demektir).
 * Başlangıçta kurulu gelen binaların costs[0] değeri kullanılmaz.
 * harvest[i]: (i+1). seviyede günlük hasat. discount[i]: Pazar'ın (i+1). seviyedeki indirimi.
 */
export const BUILDINGS = [
  {
    id: "home",
    name: "Kart'ın evi",
    short: "Ev",
    role: "Köyün merkezi. Evin seviyesi, diğer binaların en fazla kaçıncı seviyeye çıkabileceğini belirler.",
    costs: [0, 80, 220],
    start: 1,
  },
  {
    id: "market",
    name: "Pazar",
    short: "Pazar",
    role: "Can yenileme ve 2 kat puan burada satılır. Pazar büyüdükçe fiyatlar düşer.",
    costs: [0, 60, 180],
    start: 1,
    discount: [0, 0.1, 0.2],
  },
  {
    id: "bakery",
    name: "Fırın",
    short: "Fırın",
    role: "Her sabah taze ekmek çıkar. Her gün puan hasat edersin.",
    costs: [40, 100, 260],
    harvest: [3, 6, 10],
  },
  {
    id: "garden",
    name: "Bahçe",
    short: "Bahçe",
    role: "Sebzeler her gün olgunlaşır. Fırından pahalı ama daha çok verir.",
    costs: [60, 140, 320],
    harvest: [4, 8, 12],
  },
  {
    id: "fountain",
    name: "Çeşme",
    short: "Çeşme",
    role: "Köy meydanının kalbi. Her gün küçük bir dilek puanı bırakır.",
    costs: [30, 90, 240],
    harvest: [2, 4, 7],
  },
];

export const getBuilding = (id) => BUILDINGS.find((b) => b.id === id);

/** Yeni oyuncunun köyü: ev ve pazar kurulu, diğerleri boş arsa. */
export const initialVillage = () => ({
  levels: Object.fromEntries(BUILDINGS.map((b) => [b.id, b.start ?? 0])),
  collected: {}, // bina id -> en son hasat edildiği gün (state.day)
});

export const levelOf = (village, id) => village?.levels?.[id] ?? getBuilding(id)?.start ?? 0;

/** Bir binanın çıkabileceği en yüksek seviye: ev hariç hepsi evin bir üstüne kadar. */
export const levelCap = (village, id) => (id === "home" ? MAX_LEVEL : Math.min(MAX_LEVEL, levelOf(village, "home") + 1));

/** Sonraki seviyenin bedeli; en üst seviyedeyse null. */
export function upgradeCost(id, level) {
  const b = getBuilding(id);
  if (!b || level >= MAX_LEVEL) return null;
  return b.costs[level];
}

/**
 * Yükseltme yapılabilir mi? null: yapılabilir. Aksi halde neden:
 * "max" en üst seviyede, "cap" önce evin büyümesi gerekiyor, "xp" puan yetmiyor.
 */
export function upgradeBlock(state, id) {
  const level = levelOf(state.village, id);
  const cost = upgradeCost(id, level);
  if (cost === null) return "max";
  if (level >= levelCap(state.village, id)) return "cap";
  if (state.xp < cost) return "xp";
  return null;
}

export const harvestAmount = (id, level) => (level > 0 ? getBuilding(id)?.harvest?.[level - 1] ?? 0 : 0);

/** Bugün toplanmayı bekleyen hasatlar: [{ id, amount }] */
export function pendingHarvests(state) {
  return BUILDINGS.map((b) => ({ id: b.id, amount: harvestAmount(b.id, levelOf(state.village, b.id)) })).filter(
    (h) => h.amount > 0 && state.village?.collected?.[h.id] !== state.day
  );
}

/** Pazar indirimiyle fiyat. */
export function marketPrice(base, village) {
  const level = levelOf(village, "market");
  const discount = getBuilding("market").discount[Math.max(0, level - 1)] ?? 0;
  return Math.round(base * (1 - discount));
}

/** Köy seviyesi: bütün binaların seviyelerinin toplamı. */
export const villageLevel = (village) => BUILDINGS.reduce((n, b) => n + levelOf(village, b.id), 0);
export const MAX_VILLAGE_LEVEL = BUILDINGS.length * MAX_LEVEL;

/** Saate göre köyün görünümü. */
export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 7 && h < 18) return "day";
  if ((h >= 18 && h < 21) || (h >= 5 && h < 7)) return "dusk";
  return "night";
}
