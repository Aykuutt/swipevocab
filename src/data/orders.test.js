import { describe, expect, it } from "vitest";
import { ORDER_KINDS, ORDER_PREFS, claimableOrders, makeOrder, makeWeekly, needsNewOrder, needsNewWeekly, orderDone, orderProgress, orderText, orderTier, weeklyClaimable, weeklyDaysLeft, weeklyText } from "./orders";
import { VILLAGERS } from "./villagers";
import { initialVillage } from "./village";

const state = (over = {}) => ({ day: 3, village: initialVillage(), counters: { cards: 0, correct: 0, learned: 0, units: 0 }, ...over });

describe("köylü siparişleri", () => {
  it("her köylünün tercih ettiği türler geçerli", () => {
    for (const v of VILLAGERS) {
      expect(ORDER_PREFS[v.id]?.length).toBeGreaterThan(0);
      for (const kind of ORDER_PREFS[v.id]) expect(ORDER_KINDS[kind]).toBeTruthy();
    }
  });

  it("aynı gün ve köylü için hep aynı sipariş, farklı günlerde çeşitlenir", () => {
    const v = VILLAGERS[1];
    const a = makeOrder(state(), v);
    expect(makeOrder(state(), v)).toEqual(a);
    const kinds = new Set(Array.from({ length: 40 }, (_, d) => makeOrder(state({ day: d + 1 }), v).kind));
    expect(kinds.size).toBeGreaterThan(1);
    for (const kind of kinds) expect(ORDER_PREFS[v.id]).toContain(kind);
  });

  it("hedef ve ödül oyuncu ilerledikçe büyür", () => {
    const v = VILLAGERS[0];
    const day = Array.from({ length: 30 }, (_, i) => i + 1).find((d) => makeOrder(state({ day: d }), v).kind === "correct");
    const low = makeOrder(state({ day }), v);
    const big = state({ day, counters: { cards: 0, correct: 0, learned: 200, units: 0 } });
    const high = makeOrder(big, v);
    expect(orderTier(big)).toBeGreaterThan(orderTier(state()));
    expect(high.target).toBeGreaterThan(low.target);
    expect(high.reward).toBeGreaterThan(low.reward);
  });

  it("ilerleme sayaçtan ve sipariş anındaki değerden ölçülür", () => {
    const s = state({ counters: { cards: 10, correct: 7, learned: 0, units: 0 } });
    const order = { kind: "correct", target: 5, base: 7, reward: 18, day: 3, claimed: false };
    expect(orderProgress(s, order)).toBe(0);
    const later = { ...s, counters: { ...s.counters, correct: 10 } };
    expect(orderProgress(later, order)).toBe(3);
    expect(orderDone(later, order)).toBe(false);
    const done = { ...s, counters: { ...s.counters, correct: 20 } };
    expect(orderProgress(done, order)).toBe(5); // hedefi aşmaz
    expect(orderDone(done, order)).toBe(true);
    expect(orderText(order)).toContain("5");
  });

  it("yenileme: eski gün yenilenir, ama bitmiş teslim edilmemiş sipariş korunur", () => {
    const s = state({ day: 4, counters: { cards: 0, correct: 20, learned: 0, units: 0 } });
    const old = { kind: "correct", target: 5, base: 0, reward: 18, day: 3, claimed: false };
    expect(needsNewOrder(s, undefined)).toBe(true);
    expect(needsNewOrder(s, old)).toBe(false); // bitmiş, bekliyor
    expect(needsNewOrder(s, { ...old, claimed: true })).toBe(true);
    expect(needsNewOrder(s, { ...old, base: 100 })).toBe(true); // bitmemiş ve eski
    expect(needsNewOrder(s, { ...old, day: 4, claimed: true })).toBe(false); // bugünün
  });

  it("teslim bekleyenler listelenir", () => {
    const s = state({ counters: { cards: 0, correct: 20, learned: 0, units: 0 } });
    s.village.orders = { merchant: { kind: "correct", target: 5, base: 0, reward: 18, day: 3, claimed: false } };
    expect(claimableOrders(s).map((x) => x.villager.id)).toEqual(["merchant"]);
  });
});

describe("haftalık büyük sipariş", () => {
  it("aynı hafta içinde hep aynı, haftalar arasında türü değişir", () => {
    const a = makeWeekly(state({ day: 1 }));
    expect(makeWeekly(state({ day: 7 }))).toEqual({ ...a });
    const kinds = new Set(Array.from({ length: 20 }, (_, i) => makeWeekly(state({ day: i * 7 + 1 })).kind));
    expect(kinds.size).toBeGreaterThan(1);
    expect(weeklyText(a)).toMatch(/Bu hafta/);
    expect(a.reward).toBeGreaterThanOrEqual(60);
  });

  it("ilerler, bitince teslim edilebilir; hafta dönünce bitmemişse yenilenir", () => {
    const s = state({ day: 2 });
    const w = makeWeekly(s);
    const village = { ...s.village, weekly: w };
    expect(weeklyClaimable({ ...s, village })).toBe(false);
    const done = { ...s, village, counters: { ...s.counters, [w.kind]: w.target } };
    expect(weeklyClaimable(done)).toBe(true);
    expect(needsNewWeekly({ ...done, day: 9 }, w)).toBe(false); // bitmiş, teslim bekliyor
    expect(needsNewWeekly({ ...s, day: 9 }, w)).toBe(true); // bitmemiş, yeni hafta
    expect(needsNewWeekly(s, w)).toBe(false);
    expect(weeklyDaysLeft(state({ day: 1 }))).toBe(7);
    expect(weeklyDaysLeft(state({ day: 7 }))).toBe(1);
  });
});
