import { describe, expect, it } from "vitest";
import { WORDS } from "../data/langs/en";
import { WORDS as DE_WORDS } from "../data/langs/de";
import { itemById, pendingHarvests } from "../data/village";
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

describe("oyun rekorları", () => {
  it("yalnızca daha yüksek skor rekoru günceller", () => {
    let s = newUser(5);
    s = reducer(s, { type: "SET_RECORD", key: "timed:en", value: 120 });
    expect(s.records["timed:en"]).toBe(120);
    const same = reducer(s, { type: "SET_RECORD", key: "timed:en", value: 90 });
    expect(same).toBe(s);
    s = reducer(s, { type: "SET_RECORD", key: "timed:de", value: 40 });
    expect(s.records).toEqual({ "timed:en": 120, "timed:de": 40 });
  });
});

describe("Kart'ın köyü", () => {
  const rich = (xp = 400) => reducer(newUser(5), { type: "AWARD_XP", xp });
  const place = (s, itemType, x, y) => reducer(s, { type: "VILLAGE_PLACE", itemType, x, y });
  const first = (s, type) => s.village.items.find((i) => i.type === type);

  it("dükkândan alınan bina haritaya konur; puan harcanır ama ömür boyu puan düşmez", () => {
    let s = place(rich(), "bakery", 6, 10);
    const bakery = first(s, "bakery");
    expect(bakery).toMatchObject({ x: 6, y: 10, level: 1 });
    expect(s.xp).toBe(360);
    expect(s.xpTotal).toBe(400);
    s = place(s, "bakery", 11, 10); // ikinci kopya iki kat
    expect(s.xp).toBe(280);
    expect(place(s, "bakery", 8, 12)).toBe(s); // üst sınır: en çok 2 fırın
  });

  it("dolu ya da arazi dışı yere ve puansızken konmaz", () => {
    const s = rich();
    expect(place(s, "bakery", 7, 6)).toBe(s); // evin üstü
    expect(place(s, "tree", 2, 2)).toBe(s); // arazi dışı
    const poor = newUser(5);
    expect(place(poor, "bakery", 6, 10)).toBe(poor);
  });

  it("nesne boş yere taşınır, dolu yere taşınmaz", () => {
    const s = place(rich(), "tree", 9, 12);
    const tree = first(s, "tree") && s.village.items.find((i) => i.x === 9 && i.y === 12);
    const moved = reducer(s, { type: "VILLAGE_MOVE", id: tree.id, x: 12, y: 13 });
    expect(itemById(moved.village, tree.id)).toMatchObject({ x: 12, y: 13 });
    expect(reducer(moved, { type: "VILLAGE_MOVE", id: tree.id, x: 7, y: 6 })).toBe(moved);
  });

  it("satış yatırımın yarısını geri verir (kazanç sayılmaz); ev ve pazar satılmaz", () => {
    let s = place(rich(), "bakery", 6, 10);
    const id = first(s, "bakery").id;
    s = reducer(s, { type: "VILLAGE_UPGRADE", id });
    const before = s.xp;
    const total = s.xpTotal;
    s = reducer(s, { type: "VILLAGE_SELL", id });
    expect(s.xp).toBe(before + 70);
    expect(s.xpTotal).toBe(total);
    expect(first(s, "bakery")).toBeUndefined();
    expect(reducer(s, { type: "VILLAGE_SELL", id: "home" })).toBe(s);
  });

  it("evin sınırı aşılamaz; ev büyüyünce diğer binalar da büyür", () => {
    let s = reducer(newUser(5), { type: "AWARD_XP", xp: 800 });
    s = place(s, "bakery", 6, 10);
    const id = first(s, "bakery").id;
    s = reducer(s, { type: "VILLAGE_UPGRADE", id }); // 2
    expect(itemById(s.village, id).level).toBe(2);
    expect(reducer(s, { type: "VILLAGE_UPGRADE", id })).toBe(s); // ev 1 iken 3. seviye yok
    s = reducer(s, { type: "VILLAGE_UPGRADE", id: "home" });
    s = reducer(s, { type: "VILLAGE_UPGRADE", id });
    expect(itemById(s.village, id).level).toBe(3);
  });

  it("hasat günde bir kez toplanır, ertesi gün yeniden hazır olur, güçlendirici katlamaz", () => {
    let s = place(rich(), "bakery", 6, 10);
    const id = first(s, "bakery").id;
    s = { ...s, xpBoost: true };
    const before = s.xp;
    expect(pendingHarvests(s)).toEqual([{ id, amount: 3 }]);
    s = reducer(s, { type: "VILLAGE_HARVEST" });
    expect(s.xp).toBe(before + 3);
    expect(s.xpTotal).toBe(400 + 3);
    expect(pendingHarvests(s)).toEqual([]);
    expect(reducer(s, { type: "VILLAGE_HARVEST" })).toBe(s);
    s = reducer(s, { type: "SYNC_DAY", day: s.day + 1, deck: [] });
    expect(pendingHarvests(s)).toHaveLength(1);
  });

  it("Pazar büyüyünce can yenileme ucuzlar", () => {
    let s = rich();
    s = reducer(s, { type: "VILLAGE_UPGRADE", id: "market" }); // 2. seviye: %10 indirim
    s = { ...s, lives: 1, xp: 27 };
    s = reducer(s, { type: "BUY_HEARTS" });
    expect(s.lives).toBe(3);
    expect(s.xp).toBe(0);
  });

  it("eski kayıtlar köy ve ömür boyu puanla açılır; eski sabit binalar haritaya taşınır", () => {
    const { village, xpTotal, ...old } = newUser(5);
    const h = hydrate({ ...old, xp: 50, village: { levels: { home: 1, market: 1, bakery: 2 }, collected: {} } });
    expect(h.xpTotal).toBe(50);
    expect(first(h, "bakery")).toMatchObject({ id: "bakery", level: 2 });
    expect(first(hydrate({ ...old, xp: 0 }), "home").level).toBe(1);
  });
});

describe("köylü sohbetleri (durum)", () => {
  it("günde bir sohbet ödülü verir, arkadaşlık sayısı artar, ertesi gün yeniden konuşulur", () => {
    let s = newUser(5);
    const before = s.xp;
    s = reducer(s, { type: "VILLAGER_TALK", id: "merchant" });
    expect(s.xp).toBe(before + 16);
    expect(s.xpTotal).toBe(16);
    expect(s.village.villagers.merchant).toEqual({ talks: 1, last: s.day });
    expect(reducer(s, { type: "VILLAGER_TALK", id: "merchant" })).toBe(s);
    s = reducer(s, { type: "SYNC_DAY", day: s.day + 1, deck: [] });
    s = reducer(s, { type: "VILLAGER_TALK", id: "merchant" });
    expect(s.village.villagers.merchant.talks).toBe(2);
    expect(s.xp).toBe(before + 16 + 6);
  });

  it("binası olmayan köylüyle ya da bilinmeyen köylüyle sohbet olmaz", () => {
    const s = newUser(5);
    expect(reducer(s, { type: "VILLAGER_TALK", id: "baker" })).toBe(s);
    expect(reducer(s, { type: "VILLAGER_TALK", id: "yok" })).toBe(s);
  });
});
