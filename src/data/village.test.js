import { describe, expect, it } from "vitest";
import { BUILDINGS, MAX_LEVEL, initialVillage, levelCap, marketPrice, timeOfDay, upgradeBlock, upgradeCost, villageLevel } from "./village";

describe("köy kuralları", () => {
  it("ev ve pazar kurulu başlar, diğerleri arsa", () => {
    const v = initialVillage();
    expect(v.levels).toEqual({ home: 1, market: 1, bakery: 0, garden: 0, fountain: 0 });
    expect(villageLevel(v)).toBe(2);
  });

  it("her binanın her seviye için bedeli var, hasatlı binalar artan hasat verir", () => {
    for (const b of BUILDINGS) {
      expect(b.costs).toHaveLength(MAX_LEVEL);
      if (b.harvest) expect(b.harvest).toEqual([...b.harvest].sort((x, y) => x - y));
    }
    expect(upgradeCost("bakery", 0)).toBe(40);
    expect(upgradeCost("bakery", MAX_LEVEL)).toBeNull();
  });

  it("evden başka bina evin bir üstüne kadar çıkar", () => {
    const v = initialVillage();
    expect(levelCap(v, "bakery")).toBe(2);
    expect(levelCap(v, "home")).toBe(MAX_LEVEL);
    const state = { xp: 1000, village: { ...v, levels: { ...v.levels, bakery: 2 } } };
    expect(upgradeBlock(state, "bakery")).toBe("cap");
    expect(upgradeBlock({ ...state, xp: 0 }, "garden")).toBe("xp");
    expect(upgradeBlock(state, "garden")).toBeNull();
  });

  it("pazar indirimi fiyatı düşürür", () => {
    const v = initialVillage();
    expect(marketPrice(30, v)).toBe(30);
    expect(marketPrice(30, { ...v, levels: { ...v.levels, market: 2 } })).toBe(27);
    expect(marketPrice(30, { ...v, levels: { ...v.levels, market: 3 } })).toBe(24);
  });

  it("saate göre gün, alacakaranlık, gece", () => {
    expect(timeOfDay(new Date(2026, 0, 1, 12))).toBe("day");
    expect(timeOfDay(new Date(2026, 0, 1, 19))).toBe("dusk");
    expect(timeOfDay(new Date(2026, 0, 1, 6))).toBe("dusk");
    expect(timeOfDay(new Date(2026, 0, 1, 23))).toBe("night");
  });
});
