import { describe, expect, it } from "vitest";
import {
  MAX_LEVEL,
  TYPES,
  buyBlock,
  buyPrice,
  canPlace,
  MAP_MAX,
  MAP_MIN,
  canSell,
  expandBlock,
  expandCost,
  expandRequirement,
  expandedLand,
  expandStrip,
  initialVillage,
  levelCap,
  marketPrice,
  migrateVillage,
  sellValue,
  timeOfDay,
  upgradeBlock,
  upgradeCost,
  villageLevel,
} from "./village";

const overlaps = (items) => {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const ta = TYPES[a.type];
      const tb = TYPES[b.type];
      if (a.x < b.x + tb.w && b.x < a.x + ta.w && a.y < b.y + tb.d && b.y < a.y + ta.d) return [a.id, b.id];
    }
  }
  return null;
};

describe("köy kuralları", () => {
  it("başlangıç köyü: ev ve pazar kurulu, hiçbir şey üst üste değil, hepsi arazide", () => {
    const v = initialVillage();
    expect(v.items.find((i) => i.type === "home").level).toBe(1);
    expect(v.items.find((i) => i.type === "market").level).toBe(1);
    expect(new Set(v.items.map((i) => i.id)).size).toBe(v.items.length);
    expect(overlaps(v.items)).toBeNull();
    for (const i of v.items) expect(canPlace({ ...v, items: v.items.filter((x) => x.id !== i.id) }, i.type, i.x, i.y)).toBe(true);
    expect(villageLevel(v)).toBe(2);
  });

  it("eski (sabit binalı) kayıt haritaya taşınır, seviyeler ve hasat günleri korunur", () => {
    const v = migrateVillage({
      levels: { home: 2, market: 1, bakery: 2, garden: 0, fountain: 1 },
      collected: { bakery: 5 },
    });
    const byType = (t) => v.items.filter((i) => i.type === t);
    expect(byType("home")[0].level).toBe(2);
    expect(byType("bakery")).toHaveLength(1);
    expect(byType("bakery")[0]).toMatchObject({ id: "bakery", level: 2 });
    expect(byType("fountain")[0].level).toBe(1);
    expect(byType("garden")).toHaveLength(0);
    expect(v.collected).toEqual({ bakery: 5 });
    expect(overlaps(v.items)).toBeNull();
  });

  it("yeni kayıt olduğu gibi açılır, bilinmeyen türler atılır; kayıt yoksa başlangıç köyü gelir", () => {
    const saved = { v: 2, items: [{ id: "a", type: "tree", x: 5, y: 5, level: 1 }, { id: "b", type: "dragon", x: 1, y: 1 }], nextId: 9, land: { x0: 4, y0: 4, x1: 16, y1: 16 }, collected: {} };
    const v = migrateVillage(saved);
    expect(v.items.map((i) => i.id)).toEqual(["a"]);
    expect(v.nextId).toBe(9);
    expect(migrateVillage(undefined).items.length).toBe(initialVillage().items.length);
  });

  it("yerleştirme: boş kareye konur; dolu, taşan ve arazi dışı olmaz; taşırken kendisiyle çakışmaz", () => {
    const v = initialVillage();
    expect(canPlace(v, "tree", 9, 12)).toBe(true);
    expect(canPlace(v, "tree", 7, 6)).toBe(false); // evin üstü
    expect(canPlace(v, "bakery", 6, 7)).toBe(false); // evle çakışır
    expect(canPlace(v, "tree", 3, 8)).toBe(false); // arazi dışı
    expect(canPlace(v, "bakery", 15, 15)).toBe(false); // 2x2 taşar
    expect(canPlace(v, "home", 7, 6, "home")).toBe(true);
    expect(canPlace(v, "home", 8, 6, "home")).toBe(true); // yana kayınca kendisiyle çakışmaz
  });

  it("dükkân: ikinci kopya iki kat, üst sınırda ve puansızken satılmaz", () => {
    const v = initialVillage();
    expect(buyPrice("bakery", v)).toBe(100);
    const two = { ...v, items: [...v.items, { id: "x", type: "bakery", x: 6, y: 10, level: 1 }] };
    expect(buyPrice("bakery", two)).toBe(200);
    expect(buyBlock({ xp: 1000, village: v }, "bakery")).toBeNull();
    expect(buyBlock({ xp: 10, village: v }, "bakery")).toBe("xp");
    const full = { ...two, items: [...two.items, { id: "y", type: "bakery", x: 11, y: 10, level: 1 }] };
    expect(buyBlock({ xp: 1000, village: full }, "bakery")).toBe("max");
    expect(buyBlock({ xp: 1000, village: v }, "home")).toBe("none");
  });

  it("evden başka bina evin bir üstüne kadar çıkar", () => {
    const v = initialVillage();
    const bakery = { id: "b", type: "bakery", x: 6, y: 10, level: 2 };
    const state = { xp: 1000, village: { ...v, items: [...v.items, bakery] } };
    expect(levelCap(state.village, bakery)).toBe(2);
    expect(levelCap(state.village, state.village.items[0])).toBe(MAX_LEVEL);
    expect(upgradeBlock(state, "b")).toBe("cap");
    expect(upgradeBlock({ ...state, xp: 0 }, "home")).toBe("xp");
    expect(upgradeBlock(state, "home")).toBeNull();
    expect(upgradeBlock(state, "yok")).toBe("none");
    expect(upgradeCost(bakery)).toBe(650);
  });

  it("satış: ev ve pazar satılmaz, binada yatırımın yarısı, süste fiyatın yarısı geri gelir", () => {
    expect(canSell({ type: "home" })).toBe(false);
    expect(sellValue({ type: "home", level: 3 })).toBe(0);
    expect(sellValue({ type: "bakery", level: 2 })).toBe(175);
    expect(sellValue({ type: "tree", level: 1 })).toBe(10);
    expect(sellValue({ type: "road", level: 1 })).toBe(2);
  });

  it("pazar indirimi fiyatı düşürür", () => {
    const v = initialVillage();
    const lvl = (level) => ({ ...v, items: v.items.map((i) => (i.type === "market" ? { ...i, level } : i)) });
    expect(marketPrice(30, lvl(1))).toBe(30);
    expect(marketPrice(30, lvl(2))).toBe(27);
    expect(marketPrice(30, lvl(3))).toBe(24);
  });

  it("arazi genişletme: bedel artar, ev şartı gelir, haritanın kenarında durur", () => {
    expect([0, 1, 2, 3].map(expandCost)).toEqual([250, 400, 640, 1020]);
    expect([0, 1, 2, 3, 4, 9].map(expandRequirement)).toEqual([1, 1, 2, 2, 3, 3]);
    const v = initialVillage();
    expect(expandedLand(v.land, "x1")).toEqual({ x0: 4, y0: 4, x1: 18, y1: 16 });
    expect(expandStrip(v.land, "x0")).toEqual({ x0: 2, y0: 4, x1: 4, y1: 16 });
    expect(expandBlock({ xp: 1000, village: v }, "x1")).toBeNull();
    expect(expandBlock({ xp: 10, village: v }, "x1")).toBe("xp");
    // 3. genişletme için ev 2. seviyede olmalı
    const third = { ...v, expansions: 2 };
    expect(expandBlock({ xp: 5000, village: third }, "x1")).toBe("level");
    const home2 = { ...third, items: third.items.map((i) => (i.type === "home" ? { ...i, level: 2 } : i)) };
    expect(expandBlock({ xp: 5000, village: home2 }, "x1")).toBeNull();
    // kenar: arazi haritanın dışına taşamaz
    const wide = { ...v, land: { x0: MAP_MIN + 1, y0: 4, x1: MAP_MAX - 1, y1: 16 } };
    expect(expandBlock({ xp: 5000, village: wide }, "x0")).toBe("edge");
    expect(expandBlock({ xp: 5000, village: wide }, "x1")).toBe("edge");
  });

  it("saate göre gün, alacakaranlık, gece", () => {
    expect(timeOfDay(new Date(2026, 0, 1, 12))).toBe("day");
    expect(timeOfDay(new Date(2026, 0, 1, 19))).toBe("dusk");
    expect(timeOfDay(new Date(2026, 0, 1, 6))).toBe("dusk");
    expect(timeOfDay(new Date(2026, 0, 1, 23))).toBe("night");
  });
});
