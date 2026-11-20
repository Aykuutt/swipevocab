import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEVELS } from "../../config";
import { containsWord } from "../../lib/wordMatch";
import { LANGUAGE_ORDER } from "../languages";
import { TOPICS } from "../topics";
import { WORDS as de } from "./de";
import { WORDS as en } from "./en";
import { WORDS as es } from "./es";
import { WORDS as fr } from "./fr";

const PACKS = { en, de, es, fr };
const FIELDS = ["id", "word", "phonetic", "pos", "level", "topic", "tr", "definition", "example"];
const POS = ["noun", "verb", "adjective", "adverb", "conjunction", "determiner", "preposition", "pronoun", "phrase"];

it("her dilin kelime paketi var", () => {
  expect(Object.keys(PACKS).sort()).toEqual([...LANGUAGE_ORDER].sort());
});

describe.each(Object.entries(PACKS))("%s kelime listesi", (lang, WORDS) => {
  it("yeterince kelime var ve her seviyeden kelime içeriyor", () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(100);
    for (const level of LEVELS) expect(WORDS.some((w) => w.level === level), level).toBe(true);
  });

  it("her kelimenin tüm alanları dolu", () => {
    for (const w of WORDS) {
      for (const f of FIELDS) expect(w[f], `${w.id} ${f}`).toBeTruthy();
    }
  });

  it("id'ler ve kelimeler tekrar etmiyor", () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((w) => w.word.toLowerCase())).size).toBe(WORDS.length);
  });

  it("seviye, konu ve tür geçerli", () => {
    for (const w of WORDS) {
      expect(LEVELS, w.word).toContain(w.level);
      expect(Object.keys(TOPICS), w.word).toContain(w.topic);
      expect(POS, w.word).toContain(w.pos);
    }
  });

  it("örnek cümle kelimenin kendisini içeriyor (boşluk doldurma için)", () => {
    for (const w of WORDS) expect(containsWord(w.example, w.word), `${lang} ${w.word}: ${w.example}`).toBe(true);
  });

  it("artikel yalnızca isimlerde", () => {
    for (const w of WORDS.filter((x) => x.article)) expect(w.pos, w.word).toBe("noun");
  });
});

it("İngilizcede 1-90 arası kelimelerin ses kayıtları var", () => {
  for (const w of en.filter((x) => x.id <= 90)) {
    expect(existsSync(resolve("public/audio/w", `${w.id}.mp3`)), `w/${w.id}`).toBe(true);
    expect(existsSync(resolve("public/audio/s", `${w.id}.mp3`)), `s/${w.id}`).toBe(true);
  }
});
