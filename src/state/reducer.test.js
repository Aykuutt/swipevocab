import { describe, expect, it } from "vitest";
import { WORDS } from "../data/langs/en";
import { WORDS as DE_WORDS } from "../data/langs/de";
import { buildDeck, topUpCards } from "../lib/deck";
import { hydrate, initialState, reducer } from "./reducer";
import { dailyCardLimit } from "./selectors";

function newUser(goal = 10) {
  let s = reducer(initialState, {
    type: "START_ACCOUNT",
    user: { id: "u1", email: "a@b.c", name: "Test" },
    dayIndex: 20000,
    level: "A2",
  });
  s = reducer(s, { type: "SET_SETTING", key: "dailyGoal", value: goal });
  return reducer(s, { type: "SET_DECK", deck: buildDeck(s, WORDS) });
}

/** Uygulamadaki gibi kaydırır; sınırsız planda azalan desteye ek kart da ekler. */
function swipeAll(s, dir = "keep", max = 100) {
  let n = 0;
  while (s.phase === "swipe" && s.deck.length > 0 && n < max) {
    s = reducer(s, { type: "SWIPE", dir });
    n++;
    if (dailyCardLimit(s) === null && s.phase === "swipe" && s.deck.length <= 5) {
      s = reducer(s, { type: "TOPUP_DECK", cards: topUpCards(s, WORDS) });
    }
  }
  return [s, n];
}

describe("günlük kart sınırı", () => {
  it.each([5, 10, 20])("hedef %i: tam o kadar kart çıkar ve devam edilemez", (goal) => {
    let s = newUser(goal);
    expect(s.deck).toHaveLength(goal);
    let n;
    [s, n] = swipeAll(s, "keep");
    expect(n).toBe(goal);
    expect(s.swipedToday).toBe(goal);
    expect(s.phase).toBe("limit");
    expect(reducer(s, { type: "CONTINUE_SWIPING" }).phase).toBe("limit");
  });

  it("bilmediği kelime varsa önce pekiştirme açılır, sonra devam yok", () => {
    let [s, n] = swipeAll(newUser(10), "discard");
    expect(n).toBe(10);
    expect(s.phase).toBe("reinforce");
    s = reducer(s, { type: "REINFORCE_DONE" });
    expect(s.phase).toBe("done");
    expect(s.learningIds).toHaveLength(0);
    expect(reducer(s, { type: "CONTINUE_SWIPING" }).phase).toBe("done");
  });

  it("sınır uygulanmadan önce kaydedilmiş, sınırı aşmış kayıt yüklenince gün kapanır", () => {
    const s = newUser(10);
    const old = { ...s, swipedToday: 35, phase: "swipe" };
    expect(reducer(initialState, { type: "HYDRATE", state: old }).phase).not.toBe("swipe");
  });

  it("hedef gün içinde yükseltilirse kalan kartlar açılır", () => {
    let [s] = swipeAll(newUser(5), "keep");
    s = reducer(s, { type: "SET_SETTING", key: "dailyGoal", value: 20 });
    expect(s.phase).toBe("swipe");
    s = reducer(s, { type: "SET_DECK", deck: buildDeck(s, WORDS) });
    expect(s.deck).toHaveLength(15);
    [s] = swipeAll(s, "keep");
    expect(s.swipedToday).toBe(20);
    expect(s.phase).toBe("limit");
  });

  it("ertesi gün sayaç sıfırlanır ve yeni deste gelir", () => {
    let [s] = swipeAll(newUser(10), "keep");
    s = reducer(s, { type: "SYNC_DAY", day: 2, deck: buildDeck(s, WORDS, 2) });
    expect(s.phase).toBe("swipe");
    expect(s.swipedToday).toBe(0);
    expect(s.deck.length).toBeGreaterThan(0);
    expect(s.deck.length).toBeLessThanOrEqual(10);
  });
});

describe("seri ve puan", () => {
  it("günü bitirmek seriyi 1 yapar ve gün puanı verir", () => {
    const [s] = swipeAll(newUser(5), "keep");
    expect(s.streak).toBe(1);
    expect(s.lastCompletedDay).toBe(1);
    expect(s.xp).toBeGreaterThan(5 * 2); // kaydırma puanı + gün puanı
  });

  it("bir gün atlanırsa seri 1'den başlar", () => {
    let [s] = swipeAll(newUser(5), "keep");
    s = reducer(s, { type: "SYNC_DAY", day: 3, deck: buildDeck(s, WORDS, 3) });
    [s] = swipeAll(s, "keep");
    expect(s.streak).toBe(1);
  });

  it("ardışık günlerde seri artar", () => {
    let [s] = swipeAll(newUser(5), "keep");
    s = reducer(s, { type: "SYNC_DAY", day: 2, deck: buildDeck(s, WORDS, 2) });
    [s] = swipeAll(s, "keep");
    expect(s.streak).toBe(2);
  });
});

describe("canlar", () => {
  it("yanlış cevap can götürür, 0'ın altına inmez", () => {
    let s = newUser();
    for (let i = 0; i < 5; i++) s = reducer(s, { type: "LOSE_LIFE", now: 1000 });
    expect(s.lives).toBe(0);
    expect(s.regenAt).not.toBeNull();
  });

  it("canlar zamanla yenilenir", () => {
    let s = newUser();
    s = reducer(s, { type: "LOSE_LIFE", now: 0 });
    s = reducer(s, { type: "LOSE_LIFE", now: 0 });
    s = reducer(s, { type: "HEARTS_TICK", now: 4 * 3600_000 });
    expect(s.lives).toBe(2);
    s = reducer(s, { type: "HEARTS_TICK", now: 8 * 3600_000 });
    expect(s.lives).toBe(3);
    expect(s.regenAt).toBeNull();
  });

  it("puan yetmiyorsa can satın alınamaz", () => {
    let s = newUser();
    s = reducer(s, { type: "LOSE_LIFE", now: 0 });
    const before = s.lives;
    s = reducer({ ...s, xp: 0 }, { type: "BUY_HEARTS" });
    expect(s.lives).toBe(before);
  });
});

describe("dil değiştirme", () => {
  it("her dilin ilerlemesi ayrı, XP ve seri ortak", () => {
    let s = newUser(5);
    [s] = swipeAll(s, "keep");
    const enKnown = s.knownIds.length;
    const xp = s.xp;
    expect(s.phase).toBe("limit");

    s = reducer(s, { type: "SET_LANGUAGE", language: "de" });
    expect(s.language).toBe("de");
    expect(s.knownIds).toEqual([]);
    expect(s.swipedToday).toBe(0);
    expect(s.phase).toBe("swipe");
    expect(s.placementLevel).toBe("A1");
    expect(s.xp).toBe(xp);
    expect(s.streak).toBe(1);

    s = reducer(s, { type: "SET_DECK", deck: buildDeck(s, DE_WORDS) });
    expect(s.deck).toHaveLength(5);
    [s] = swipeAll(s, "keep");
    expect(s.phase).toBe("limit");
    expect(s.streak).toBe(1); // aynı gün ikinci dil seriyi iki kez artırmaz

    s = reducer(s, { type: "SET_LANGUAGE", language: "en" });
    expect(s.knownIds).toHaveLength(enKnown);
    expect(s.phase).toBe("limit"); // aynı gün geri dönünce sınır korunur
    expect(s.languages.de.knownIds).toHaveLength(5);
  });

  it("başka bir günde geri dönülen dilin günlük kartları yenilenir", () => {
    let s = newUser(5);
    [s] = swipeAll(s, "keep");
    s = reducer(s, { type: "SET_LANGUAGE", language: "fr" });
    s = reducer(s, { type: "SYNC_DAY", day: 2, deck: [] });
    s = reducer(s, { type: "SET_LANGUAGE", language: "en" });
    expect(s.swipedToday).toBe(0);
    expect(s.phase).toBe("swipe");
    expect(s.deck).toEqual([]);
    expect(s.knownIds).toHaveLength(5);
  });

  it("bilinmeyen dil yok sayılır, eski kayıtlar İngilizce açılır", () => {
    const s = newUser(5);
    expect(reducer(s, { type: "SET_LANGUAGE", language: "xx" })).toBe(s);
    const { language, languages, ...old } = s;
    const h = hydrate({ ...old, settings: { ...old.settings, voiceURI: "v1", voices: undefined } });
    expect(h.language).toBe("en");
    expect(h.languages).toEqual({});
    expect(h.settings.voices).toEqual({ en: "v1" });
  });
});
