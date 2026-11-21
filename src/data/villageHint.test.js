import { describe, expect, it } from "vitest";
import { villageHint } from "./villageHint";
import { initialVillage } from "./village";

const base = (over = {}) => ({
  day: 4,
  xp: 0,
  lastCompletedDay: 4,
  swipedToday: 10,
  settings: { dailyGoal: 10 },
  counters: { cards: 0, correct: 0, learned: 0, units: 0 },
  village: { ...initialVillage(), villagers: { merchant: { talks: 0, last: 4 } } },
  ...over,
});

describe("köy ipucu", () => {
  it("teslim edilecek sipariş her şeyden önce gelir", () => {
    const s = base();
    s.village.orders = { merchant: { kind: "cards", target: 5, base: 0, reward: 7, day: 4, claimed: false } };
    s.counters.cards = 5;
    expect(villageHint(s)).toMatchObject({ action: "orders" });
    expect(villageHint(s).text).toMatch(/Tomas/);
  });

  it("çalışılmadıysa hasat kilitli: önce kartlar", () => {
    const s = base({ lastCompletedDay: 3, swipedToday: 4 });
    s.village.items.push({ id: "b", type: "bakery", x: 6, y: 10, level: 1 });
    expect(villageHint(s)).toMatchObject({ action: "learn", mood: "think" });
    expect(villageHint(s).text).toMatch(/4\/10/);
    expect(villageHint({ ...s, lastCompletedDay: 4 })).toMatchObject({ action: "harvest" });
  });

  it("konuşulmamış köylü, sonra alınabilecek bina, sonra her şey yolunda", () => {
    const talk = base({ village: { ...initialVillage(), villagers: {} } });
    expect(villageHint(talk).text).toMatch(/Tomas seninle konuşmak/);
    const rich = base({ xp: 120 });
    expect(villageHint(rich)).toMatchObject({ action: "shop" });
    expect(villageHint(base())).toMatchObject({ mood: "wave" });
  });
});
