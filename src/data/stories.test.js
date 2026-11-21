import { describe, expect, it } from "vitest";
import { LANGUAGE_ORDER } from "./languages";
import { STORIES, STORY_AT, STORY_META, nextStoryAt, storyChapter, storyFor } from "./stories";
import { HEART_AT, VILLAGERS } from "./villagers";
import { initialVillage } from "./village";
import { reducer } from "../state/reducer";

describe("köylü hikâyeleri", () => {
  it("her dilde her köylünün tüm bölümleri var; her bölümde tek doğru cevap", () => {
    for (const v of VILLAGERS) {
      expect(STORY_META[v.id], v.id).toHaveLength(STORY_AT.length);
      for (const m of STORY_META[v.id]) expect(m.title && m.intro).toBeTruthy();
      for (const lang of LANGUAGE_ORDER) {
        const list = STORIES[lang]?.[v.id];
        expect(list, `${lang} ${v.id}`).toHaveLength(STORY_AT.length);
        for (const d of list) {
          expect(d.say && d.tr && d.reply && d.replyTr).toBeTruthy();
          expect(d.options.filter((o) => o.ok)).toHaveLength(1);
          expect(d.words.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("bölümler kalp arttıkça sırayla açılır", () => {
    const v = initialVillage();
    expect(storyChapter(v, "baker", 1)).toBeNull();
    expect(storyChapter(v, "baker", 2)).toBe(0);
    const seen1 = { ...v, villagers: { baker: { talks: 3, last: 1, story: 1 } } };
    expect(storyChapter(seen1, "baker", 2)).toBeNull();
    expect(storyChapter(seen1, "baker", 3)).toBe(1);
    expect(nextStoryAt(seen1, "baker")).toBe(3);
    const done = { ...v, villagers: { baker: { talks: 20, last: 1, story: 3 } } };
    expect(storyChapter(done, "baker", 5)).toBeNull();
    expect(nextStoryAt(done, "baker")).toBeNull();
    expect(storyFor("xx", "baker", 0).title).toBe(STORY_META.baker[0].title);
  });

  it("hikâye sohbeti bölümü ilerletir, normal sohbet ilerletmez; sohbet durumu korunur", () => {
    const talks = HEART_AT[1]; // 2 kalp
    const base = {
      day: 5,
      xp: 0,
      xpTotal: 0,
      weeklyXp: 0,
      dailyXp: 0,
      counters: { cards: 0, correct: 0, learned: 0, units: 0 },
      village: { ...initialVillage(), villagers: { merchant: { talks, last: 1 } } },
    };
    const plain = reducer(base, { type: "VILLAGER_TALK", id: "merchant" });
    expect(plain.village.villagers.merchant.story).toBeUndefined();
    const withStory = reducer(base, { type: "VILLAGER_TALK", id: "merchant", story: true });
    expect(withStory.village.villagers.merchant).toMatchObject({ talks: talks + 1, last: 5, story: 1 });
    // Aynı gün ikinci kez ilerlemez.
    expect(reducer(withStory, { type: "VILLAGER_TALK", id: "merchant", story: true })).toBe(withStory);
  });
});
