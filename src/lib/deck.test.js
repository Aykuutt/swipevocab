// Uzun süreli kullanım simülasyonu: her gün yeni gün başlar, kartlar kaydırılır, bazıları "bilmiyorum" denir,
// pekiştirme yapılır. Her gün günün hedefi kadar kart gelmeli (kelimeler bitse bile tekrarlarla).
import { describe, expect, it } from "vitest";
import { WORDS as EN } from "../data/langs/en";
import { WORDS as DE } from "../data/langs/de";
import { WORDS as ES } from "../data/langs/es";
import { WORDS as FR } from "../data/langs/fr";
import { initialState, reducer } from "../state/reducer";
import { buildDeck } from "./deck";

const PACKS = { en: EN, de: DE, es: ES, fr: FR };

function start(language, goal, level = "A1") {
  let s = reducer(initialState, {
    type: "START_ACCOUNT",
    user: { id: "sim", email: "", name: "Sim", guest: true },
    dayIndex: 20000,
    level,
    language,
  });
  s = reducer(s, { type: "SET_SETTING", key: "dailyGoal", value: goal });
  return reducer(s, { type: "SET_DECK", deck: buildDeck(s, PACKS[language]) });
}

/** Bir günü oynar: kartları kaydırır (her 4. karta "bilmiyorum"), pekiştirmeyi bitirir. */
function playDay(s) {
  let i = 0;
  while (s.phase === "swipe" && s.deck.length > 0 && i < 200) {
    s = reducer(s, { type: "SWIPE", dir: i % 4 === 3 ? "discard" : "keep" });
    i++;
  }
  if (s.phase === "reinforce") s = reducer(s, { type: "REINFORCE_DONE" });
  return [s, i];
}

describe("her gün yeni kartlar gelir", () => {
  it.each([
    ["en", 10],
    ["de", 10],
    ["es", 20],
    ["fr", 30],
  ])("%s, günde %i kart: 120 gün boyunca her gün tam hedef kadar kart", (language, goal) => {
    const words = PACKS[language];
    let s = start(language, goal);
    for (let day = 1; day <= 120; day++) {
      if (day > 1) s = reducer(s, { type: "SYNC_DAY", day, deck: buildDeck(s, words, day) });
      expect(s.day).toBe(day);
      expect(s.phase, `gün ${day}`).toBe("swipe");
      expect(s.deck.length, `gün ${day} destesi`).toBe(goal);
      let n;
      [s, n] = playDay(s);
      expect(n, `gün ${day} kaydırılan`).toBe(goal);
      expect(s.lastCompletedDay, `gün ${day} tamamlandı`).toBe(day);
    }
    // Kelimeler çok görüldükten sonra da desteler tekrarlarla dolmaya devam etti.
    expect(s.knownIds.length).toBeGreaterThan(100);
  });

  it("birkaç gün girilmese de (aradan günler geçse de) yeni gün kartları gelir", () => {
    let s = start("en", 10);
    [s] = playDay(s);
    for (const day of [2, 5, 6, 30, 31, 90]) {
      s = reducer(s, { type: "SYNC_DAY", day, deck: buildDeck(s, EN, day) });
      expect(s.deck.length, `gün ${day}`).toBe(10);
      [s] = playDay(s);
    }
  });

  it("gün ortasında yarım bırakılan deste ertesi gün tazelenir", () => {
    let s = start("en", 10);
    s = reducer(s, { type: "SWIPE", dir: "keep" });
    s = reducer(s, { type: "SWIPE", dir: "discard" });
    s = reducer(s, { type: "SYNC_DAY", day: 2, deck: buildDeck(s, EN, 2) });
    expect(s.swipedToday).toBe(0);
    expect(s.deck.length).toBe(10);
    expect(s.phase).toBe("swipe");
  });
});
