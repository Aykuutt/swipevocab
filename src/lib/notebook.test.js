import { describe, expect, it } from "vitest";
import { filterEntries, miraGreeting, notebookCounts, notebookEntries, reviewText, shelvesFilled } from "./notebook";
import { reducer } from "../state/reducer";

const words = [
  { id: 1, word: "apple", tr: "elma" },
  { id: 2, word: "café", tr: "kahve" },
  { id: 3, word: "Tisch", article: "der", tr: "masa" },
  { id: 4, word: "deadline", tr: "son tarih" },
];

const state = {
  day: 10,
  knownIds: [2, 3, 4],
  learningIds: [1],
  schedule: { 2: { stage: 0, due: 11 }, 3: { stage: 3, due: 20 }, 4: { stage: 2, due: 9 } },
};

describe("kelime defteri", () => {
  it("öğrenilenleri ve bilinenleri ustalık durumuyla listeler", () => {
    const e = notebookEntries(state, words);
    expect(e.map((x) => x.id)).toEqual([1, 2, 4, 3]); // alfabetik
    const byId = Object.fromEntries(e.map((x) => [x.id, x]));
    expect(byId[1]).toMatchObject({ status: "learning", dots: 0, isDue: false });
    expect(byId[2]).toMatchObject({ status: "learning", dots: 1 });
    expect(byId[4]).toMatchObject({ status: "known", isDue: true, mastered: false });
    expect(byId[3]).toMatchObject({ mastered: true, dots: 4 });
    expect(notebookCounts(e)).toEqual({ all: 4, learning: 2, due: 1, mastered: 1 });
  });

  it("filtreler ve aksan/harf farkı gözetmeden arar (Türkçesiyle de)", () => {
    const e = notebookEntries(state, words);
    expect(filterEntries(e, "mastered").map((x) => x.id)).toEqual([3]);
    expect(filterEntries(e, "due").map((x) => x.id)).toEqual([4]);
    expect(filterEntries(e, "all", "CAFE").map((x) => x.id)).toEqual([2]);
    expect(filterEntries(e, "all", "der tisch").map((x) => x.id)).toEqual([3]);
    expect(filterEntries(e, "all", "son").map((x) => x.id)).toEqual([4]);
  });

  it("tekrar zamanı metni, raflar ve Mira'nın karşılaması", () => {
    const e = Object.fromEntries(notebookEntries(state, words).map((x) => [x.id, x]));
    expect(reviewText(e[2], 10)).toBe("Yarın tekrar");
    expect(reviewText(e[4], 10)).toBe("Tekrar zamanı geldi");
    expect(reviewText(e[3], 10)).toBe("10 gün sonra tekrar");
    expect(shelvesFilled(0)).toBe(0);
    expect(shelvesFilled(60)).toBe(2);
    expect(miraGreeting("de", 5)[0]).toMatch(/5 Wörter/);
    expect(miraGreeting("xx", 0)[0]).toMatch(/empty/);
  });

  it("tekrar sor: bilinen kelime yarınki kartlara gelir, bilinmeyen değişmez", () => {
    const s = { ...state, schedule: { ...state.schedule } };
    const next = reducer(s, { type: "REVIEW_AGAIN", id: 3 });
    expect(next.schedule[3]).toEqual({ stage: 0, due: 11 });
    expect(reducer(s, { type: "REVIEW_AGAIN", id: 1 })).toBe(s);
  });
});
