import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEVELS } from "../config";
import { TOPICS } from "./topics";
import { WORDS } from "./words";

const FIELDS = ["id", "word", "phonetic", "pos", "level", "topic", "tr", "definition", "example"];
const escapeRegExp = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("kelime listesi", () => {
  it("her kelimenin tüm alanları dolu", () => {
    for (const w of WORDS) {
      for (const f of FIELDS) expect(w[f], `${w.id} ${f}`).toBeTruthy();
    }
  });

  it("id'ler ve kelimeler tekrar etmiyor", () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((w) => w.word.toLowerCase())).size).toBe(WORDS.length);
  });

  it("seviye ve konu geçerli", () => {
    for (const w of WORDS) {
      expect(LEVELS, w.word).toContain(w.level);
      expect(Object.keys(TOPICS), w.word).toContain(w.topic);
    }
  });

  it("örnek cümle kelimenin kendisini içeriyor (boşluk doldurma için)", () => {
    for (const w of WORDS) {
      expect(w.example, w.word).toMatch(new RegExp(`\\b${escapeRegExp(w.word)}`, "i"));
    }
  });

  it("1-90 arası kelimelerin ses kayıtları var", () => {
    for (const w of WORDS.filter((x) => x.id <= 90)) {
      expect(existsSync(resolve("public/audio/w", `${w.id}.mp3`)), `w/${w.id}`).toBe(true);
      expect(existsSync(resolve("public/audio/s", `${w.id}.mp3`)), `s/${w.id}`).toBe(true);
    }
  });
});
