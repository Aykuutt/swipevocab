// Kart'ın köyü: haritaya yerleştirilen bina ve süsler. Puan köyün parasıdır.
// Kurallar saf fonksiyonlardır (test edilebilir); durum state.village içinde tutulur:
//   { v: 2, items: [{ id, type, x, y, level }], nextId, land: { x0, y0, x1, y1 }, collected: { itemId: gün },
//     villagers: { köylüId: { talks, last } }, orders: { köylüId: sipariş } }
// Harita MAP_MIN..MAP_MAX karedir (negatif koordinat olabilir); yalnızca `land` içindeki kareler kullanılabilir.
// Arazi puanla kenarlardan 2'şer sıra genişletilir (expansions: kaç kez genişletildi).

export const MAX_LEVEL = 3;
export const MAP_MIN = -4;
export const MAP_MAX = 24;
export const MAP_SIZE = MAP_MAX - MAP_MIN;

/**
 * Nesne türleri. w x d: kaç kare yer kaplar.
 * Binalar (costs var): costs[i] = i+1. seviyeye çıkmanın bedeli; costs[0] aynı zamanda ilk kurulum bedelidir
 * (ikinci kopya katı kadar). Süsler ve yollar sabit `price` ile satılır.
 * harvest[i]: (i+1). seviyede günlük hasat. discount[i]: Pazar'ın (i+1). seviyedeki indirimi.
 * shop: dükkândaki sekme; yoksa dükkânda satılmaz (ev ve pazar başlangıçta hazır gelir).
 */
export const TYPES = {
  home: {
    id: "home",
    kind: "building",
    name: "Kart'ın evi",
    short: "Ev",
    role: "Köyün merkezi. Evin seviyesi, diğer binaların en fazla kaçıncı seviyeye çıkabileceğini belirler.",
    w: 2,
    d: 2,
    max: 1,
    costs: [0, 200, 550],
    essential: true,
  },
  market: {
    id: "market",
    kind: "building",
    name: "Pazar",
    short: "Pazar",
    role: "Can yenileme ve 2 kat puan burada satılır. Pazar büyüdükçe fiyatlar düşer.",
    w: 2,
    d: 2,
    max: 1,
    costs: [0, 150, 450],
    discount: [0, 0.1, 0.2],
    essential: true,
  },
  bakery: {
    id: "bakery",
    kind: "building",
    name: "Fırın",
    short: "Fırın",
    role: "Her sabah taze ekmek çıkar. Her gün puan hasat edersin.",
    w: 2,
    d: 2,
    max: 2,
    costs: [100, 250, 650],
    harvest: [2, 3, 5],
    shop: "buildings",
  },
  garden: {
    id: "garden",
    kind: "building",
    name: "Bahçe",
    short: "Bahçe",
    role: "Sebzeler her gün olgunlaşır. Fırından pahalı ama daha çok verir.",
    w: 2,
    d: 2,
    max: 2,
    costs: [150, 350, 800],
    harvest: [2, 4, 6],
    shop: "buildings",
  },
  fountain: {
    id: "fountain",
    kind: "building",
    name: "Çeşme",
    short: "Çeşme",
    role: "Köy meydanının kalbi. Her gün küçük bir dilek puanı bırakır.",
    w: 2,
    d: 2,
    max: 1,
    costs: [80, 220, 600],
    harvest: [1, 2, 3],
    shop: "buildings",
  },
  tree: { id: "tree", kind: "deco", name: "Meşe ağacı", short: "Meşe", w: 1, d: 1, max: 80, price: 20, shop: "decor" },
  pine: { id: "pine", kind: "deco", name: "Çam ağacı", short: "Çam", w: 1, d: 1, max: 80, price: 20, shop: "decor" },
  flowers: { id: "flowers", kind: "deco", name: "Çiçek tarhı", short: "Çiçek", w: 1, d: 1, max: 80, price: 25, shop: "decor" },
  hedge: { id: "hedge", kind: "deco", name: "Çit", short: "Çit", w: 1, d: 1, max: 80, price: 15, shop: "decor" },
  bench: { id: "bench", kind: "deco", name: "Bank", short: "Bank", w: 1, d: 1, max: 40, price: 50, shop: "decor" },
  lamp: { id: "lamp", kind: "deco", name: "Sokak lambası", short: "Lamba", w: 1, d: 1, max: 40, price: 60, shop: "decor" },
  road: { id: "road", kind: "road", name: "Taş yol", short: "Yol", w: 1, d: 1, max: 300, price: 5, shop: "roads" },
};

export const SHOP_TABS = [
  { id: "buildings", label: "Binalar" },
  { id: "decor", label: "Süsler" },
  { id: "roads", label: "Yollar" },
];

export const getType = (type) => TYPES[type];
export const isBuilding = (type) => !!TYPES[type]?.costs;

/* ---------- başlangıç köyü ve eski kayıtların taşınması ---------- */

const DEFAULT_LAND = { x0: 4, y0: 4, x1: 16, y1: 16 };

// Yeni oyuncunun köyü: ev, pazar, bir yol ve birkaç ağaç. Kalan arazi boş.
const START_ITEMS = [
  { id: "home", type: "home", x: 7, y: 6, level: 1 },
  { id: "market", type: "market", x: 11, y: 6, level: 1 },
  ...Array.from({ length: 8 }, (_, i) => ({ id: `s-road-${i}`, type: "road", x: 6 + i, y: 8, level: 1 })),
  { id: "s-tree-1", type: "tree", x: 5, y: 5, level: 1 },
  { id: "s-tree-2", type: "tree", x: 14, y: 5, level: 1 },
  { id: "s-pine-1", type: "pine", x: 5, y: 14, level: 1 },
  { id: "s-tree-3", type: "tree", x: 14, y: 14, level: 1 },
  { id: "s-flowers-1", type: "flowers", x: 9, y: 11, level: 1 },
  { id: "s-flowers-2", type: "flowers", x: 10, y: 11, level: 1 },
];

// Eski (sabit binalı) köydeki binaların yeni haritadaki yeri.
const LEGACY_SLOTS = { bakery: { x: 6, y: 10 }, garden: { x: 11, y: 10 }, fountain: { x: 8, y: 12 } };

export const initialVillage = () => ({
  v: 2,
  items: START_ITEMS.map((i) => ({ ...i })),
  nextId: 1,
  land: { ...DEFAULT_LAND },
  collected: {},
  villagers: {}, // köylü id -> { talks: sohbet sayısı, last: son sohbet günü }
  expansions: 0,
  orders: {}, // köylü id -> günün siparişi (bkz. orders.js)
});

/** Kayıtlı köyü açar: yeni biçim olduğu gibi, eski biçim (sabit bina seviyeleri) haritaya taşınır. */
export function migrateVillage(saved) {
  if (Array.isArray(saved?.items)) {
    return {
      v: 2,
      items: saved.items.filter((i) => TYPES[i.type]).map((i) => ({ level: 1, ...i })),
      nextId: saved.nextId ?? saved.items.length + 1,
      land: { ...DEFAULT_LAND, ...saved.land },
      collected: { ...saved.collected },
      villagers: { ...saved.villagers },
      expansions: saved.expansions ?? 0,
      orders: { ...saved.orders },
    };
  }
  const village = initialVillage();
  const levels = saved?.levels;
  if (!levels) return village;
  village.items = village.items.map((i) =>
    i.type === "home" || i.type === "market" ? { ...i, level: Math.min(MAX_LEVEL, Math.max(1, levels[i.type] ?? 1)) } : i
  );
  for (const [type, slot] of Object.entries(LEGACY_SLOTS)) {
    if ((levels[type] ?? 0) > 0) village.items.push({ id: type, type, ...slot, level: Math.min(MAX_LEVEL, levels[type]) });
  }
  village.collected = { ...saved.collected };
  return village;
}

/* ---------- sorgular ---------- */

export const itemById = (village, id) => village?.items?.find((i) => i.id === id);
export const itemsOfType = (village, type) => (village?.items ?? []).filter((i) => i.type === type);
const levelOfType = (village, type) => itemsOfType(village, type)[0]?.level ?? 1;
export const homeLevel = (village) => levelOfType(village, "home");
export const marketLevel = (village) => levelOfType(village, "market");

/** Köy seviyesi: bütün binaların seviyelerinin toplamı. */
export const villageLevel = (village) =>
  (village?.items ?? []).filter((i) => isBuilding(i.type)).reduce((n, i) => n + i.level, 0);

/** Bir kopyası için üst seviye sınırı: ev hariç hepsi evin bir üstüne kadar. */
export const levelCap = (village, item) =>
  item.type === "home" ? MAX_LEVEL : Math.min(MAX_LEVEL, homeLevel(village) + 1);

/** Sonraki seviyenin bedeli; en üst seviyedeyse (ya da süsse) null. */
export function upgradeCost(item) {
  const t = TYPES[item?.type];
  if (!t?.costs || item.level >= MAX_LEVEL) return null;
  return t.costs[item.level];
}

/**
 * Yükseltme yapılabilir mi? null: yapılabilir. Aksi halde neden:
 * "none" böyle bir bina yok, "max" en üst seviyede, "cap" önce evin büyümesi gerekiyor, "xp" puan yetmiyor.
 */
export function upgradeBlock(state, id) {
  const item = itemById(state.village, id);
  if (!item) return "none";
  const cost = upgradeCost(item);
  if (cost === null) return "max";
  if (item.level >= levelCap(state.village, item)) return "cap";
  if (state.xp < cost) return "xp";
  return null;
}

export const harvestAmount = (item) => TYPES[item?.type]?.harvest?.[item.level - 1] ?? 0;

/** Bugün toplanmayı bekleyen hasatlar: [{ id, amount }] */
export function pendingHarvests(state) {
  const { items, collected } = state.village;
  return items
    .map((i) => ({ id: i.id, amount: harvestAmount(i) }))
    .filter((h) => h.amount > 0 && collected[h.id] !== state.day);
}

/** Pazar indirimiyle fiyat. */
export function marketPrice(base, village) {
  const discount = TYPES.market.discount[Math.max(0, marketLevel(village) - 1)] ?? 0;
  return Math.round(base * (1 - discount));
}

/* ---------- yerleştirme, satın alma, satış ---------- */

/** Dükkândaki fiyat: binaların ikinci kopyası bir kat daha pahalı. */
export function buyPrice(type, village) {
  const t = TYPES[type];
  return t.costs ? t.costs[0] * (itemsOfType(village, type).length + 1) : t.price;
}

/** Satın alınabilir mi? null: evet. "none" dükkânda yok, "max" üst sınır, "xp" puan yetmiyor. */
export function buyBlock(state, type) {
  const t = TYPES[type];
  if (!t?.shop) return "none";
  if (itemsOfType(state.village, type).length >= t.max) return "max";
  if (state.xp < buyPrice(type, state.village)) return "xp";
  return null;
}

/** Bu türden bir nesne (x, y) noktasına konabilir mi? `ignoreId`: taşınan nesne kendisiyle çakışmaz. */
export function canPlace(village, type, x, y, ignoreId = null) {
  const t = TYPES[type];
  const { x0, y0, x1, y1 } = village.land;
  if (!t || x < x0 || y < y0 || x + t.w > x1 || y + t.d > y1) return false;
  return village.items.every((i) => {
    if (i.id === ignoreId) return true;
    const o = TYPES[i.type];
    return x + t.w <= i.x || i.x + o.w <= x || y + t.d <= i.y || i.y + o.d <= y;
  });
}

export const canSell = (item) => !TYPES[item.type]?.essential;

/** Satınca geri gelen puan: yatırımın yarısı. */
export function sellValue(item) {
  const t = TYPES[item.type];
  if (!t || t.essential) return 0;
  if (t.costs) return Math.floor(t.costs.slice(0, item.level).reduce((a, b) => a + b, 0) / 2);
  return Math.floor(t.price / 2);
}

/* ---------- arazi genişletme ---------- */

export const EXPAND_STEP = 2;
// Ekranda bakılan yöne göre: x azalınca sol üste, y azalınca sağ üste, x artınca sağ alta, y artınca sol alta gidilir.
export const SIDES = [
  { id: "x0", label: "Sol üst" },
  { id: "y0", label: "Sağ üst" },
  { id: "x1", label: "Sağ alt" },
  { id: "y1", label: "Sol alt" },
];

/** n. genişletmenin bedeli (n: şimdiye kadar yapılan genişletme sayısı). */
export const expandCost = (n) => Math.round((250 * 1.6 ** n) / 10) * 10;
/** n. genişletme için evin en az kaçıncı seviyede olması gerektiği. */
export const expandRequirement = (n) => Math.min(MAX_LEVEL, 1 + Math.floor(n / 2));

export const expandedLand = (land, side) => ({
  x0: side === "x0" ? land.x0 - EXPAND_STEP : land.x0,
  y0: side === "y0" ? land.y0 - EXPAND_STEP : land.y0,
  x1: side === "x1" ? land.x1 + EXPAND_STEP : land.x1,
  y1: side === "y1" ? land.y1 + EXPAND_STEP : land.y1,
});

/** Genişletmeyle eklenecek şerit (önizleme için). */
export function expandStrip(land, side) {
  const e = expandedLand(land, side);
  if (side === "x0") return { x0: e.x0, y0: land.y0, x1: land.x0, y1: land.y1 };
  if (side === "y0") return { x0: land.x0, y0: e.y0, x1: land.x1, y1: land.y0 };
  if (side === "x1") return { x0: land.x1, y0: land.y0, x1: e.x1, y1: land.y1 };
  return { x0: land.x0, y0: land.y1, x1: land.x1, y1: e.y1 };
}

/**
 * Genişletme yapılabilir mi? null: yapılabilir. Aksi halde neden:
 * "edge" haritanın kenarına geldi, "level" önce ev yükselmeli, "xp" puan yetmiyor.
 */
export function expandBlock(state, side) {
  const { village } = state;
  const n = village.expansions ?? 0;
  const next = expandedLand(village.land, side);
  if (next.x0 < MAP_MIN + 1 || next.y0 < MAP_MIN + 1 || next.x1 > MAP_MAX - 1 || next.y1 > MAP_MAX - 1) return "edge";
  if (homeLevel(village) < expandRequirement(n)) return "level";
  if (state.xp < expandCost(n)) return "xp";
  return null;
}

/** Saate göre köyün görünümü. */
export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 7 && h < 18) return "day";
  if ((h >= 18 && h < 21) || (h >= 5 && h < 7)) return "dusk";
  return "night";
}
