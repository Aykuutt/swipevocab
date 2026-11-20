import { describe, expect, it } from "vitest";
import { displayWord } from "../data/languages";
import { WORDS } from "../data/langs/en";
import { sameWord, exactWord } from "./typing";
import {
  dictationGame,
  fillBlankExercise,
  placementLevel,
  placementTest,
  timedQuestion,
  translateExercise,
  unitLesson,
} from "./exercises";
import { cardsForCall } from "./talk";
import { buildUnits } from "./units";

describe("sorular", () => {
  it("çeviri sorusunda doğru cevap şıklar arasında ve şıklar tekrar etmiyor", () => {
    for (const w of WORDS.slice(0, 40)) {
      const ex = translateExercise(w, WORDS);
      expect(ex.options[ex.correct]).toBe(w.tr);
      expect(new Set(ex.options).size).toBe(ex.options.length);
      expect(ex.options).toHaveLength(4);
    }
  });

  it("boşluk doldurmada cümlede boşluk var ve doğru kelime şıklarda", () => {
    for (const w of WORDS) {
      const ex = fillBlankExercise(w, WORDS);
      if (ex.type === "fill_blank") {
        expect(ex.blanked).toContain("____");
        expect(ex.options[ex.correct]).toBe(w.word);
      }
    }
  });

  it("ek almış kelimede boşluktan sonra harf kalmaz", () => {
    const leave = WORDS.find((w) => w.word === "leave");
    const ex = fillBlankExercise(leave, WORDS);
    expect(ex.blanked).toBe("The train ____ at half past six.");
  });

  it("kelime cümlede geçmiyorsa çeviri sorusuna döner", () => {
    const odd = { ...WORDS[0], example: "Nothing to see here." };
    expect(fillBlankExercise(odd, WORDS).type).toBe("translate");
  });

  it("seviye testi 5 soru ve sonucu doğru seviyeye çeviriyor", () => {
    expect(placementTest("general", WORDS)).toHaveLength(5);
    expect(placementLevel(5)).toBe("B1");
    expect(placementLevel(2)).toBe("A2");
    expect(placementLevel(0)).toBe("A1");
  });

  it("her ünite dersi kendi kelimeleriyle soru üretiyor", () => {
    const units = buildUnits(WORDS);
    expect(units.length).toBeGreaterThan(5);
    const byId = new Map(WORDS.map((w) => [w.id, w]));
    for (const u of units) {
      const lesson = unitLesson(u.wordIds.map((id) => byId.get(id)), WORDS);
      expect(lesson.length).toBeGreaterThan(u.wordIds.length);
    }
  });
});

describe("canlı konuşma kartları", () => {
  it("iki taraf seviye sırası farklı olsa da aynı kartları görür", () => {
    const id = "3f2a9c1e-1111-4222-8333-444455556666";
    const a = cardsForCall(id, WORDS, "A2", "B1");
    const b = cardsForCall(id, [...WORDS].reverse(), "B1", "A2");
    expect(a.prompts).toEqual(b.prompts);
    expect(a.targetWords.map((w) => w.id)).toEqual(b.targetWords.map((w) => w.id));
    expect(a.targetWords).toHaveLength(6);
  });
});

describe("oyun soruları", () => {
  it("zamana karşı soruları geçerli: seçenekler benzersiz, doğru cevap listede", () => {
    const pool = WORDS.slice(0, 40);
    for (let i = 0; i < 60; i++) {
      const q = timedQuestion(pool, WORDS);
      expect(["translate", "reverse"]).toContain(q.type);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      const expected = q.type === "translate" ? q.word.tr : displayWord(q.word);
      expect(q.options[q.correct]).toBe(expected);
    }
  });

  it("art arda aynı kelimeyi sormaz", () => {
    const pool = WORDS.slice(0, 10);
    let last = null;
    for (let i = 0; i < 50; i++) {
      const q = timedQuestion(pool, WORDS, last);
      expect(q.word.id).not.toBe(last);
      last = q.word.id;
    }
  });

  it("dinle ve yaz oyunu istenen kadar, tekrarsız kelime verir", () => {
    const game = dictationGame(WORDS.slice(0, 30), 8);
    expect(game).toHaveLength(8);
    expect(new Set(game.map((g) => g.word.id)).size).toBe(8);
    expect(game.every((g) => g.type === "dictation")).toBe(true);
  });
});

describe("yazım karşılaştırma", () => {
  it("aksan ve büyük harf farkını hoş görür", () => {
    expect(sameWord("schon", "schön")).toBe(true);
    expect(sameWord("  Estacion ", "estación")).toBe(true);
    expect(sameWord("strasse", "Straße")).toBe(true);
    expect(sameWord("aujourd'hui", "aujourd’hui")).toBe(true);
    expect(sameWord("tener en  cuenta", "tener en cuenta")).toBe(true);
  });

  it("farklı ya da boş yazımı reddeder", () => {
    expect(sameWord("", "schön")).toBe(false);
    expect(sameWord("schon", "schnell")).toBe(false);
    expect(exactWord("schon", "schön")).toBe(false);
    expect(exactWord("Schön", "schön")).toBe(true);
  });
});
