import { describe, expect, it } from "vitest";
import { containsWord, replaceWord, splitAtWord } from "./wordMatch";

describe("kelime eşleştirme", () => {
  it("aksanlı ve umlautlu kelimeleri ekleriyle bulur", () => {
    expect(replaceWord("Das ist ein schönes Bild.", "schön", "____")).toBe("Das ist ein ____ Bild.");
    expect(replaceWord("Vamos a la estación.", "estación", "____")).toBe("Vamos a la ____.");
    expect(replaceWord("Je voudrais t'inviter à dîner.", "inviter", "____")).toBe("Je voudrais t'____ à dîner.");
    expect(replaceWord("The trees lose their leaves.", "leave", "____")).toBe("The trees lose their ____.");
  });

  it("kelimenin ortasında eşleşmez", () => {
    expect(containsWord("Er ist unglücklich.", "glück")).toBe(false);
    expect(containsWord("Ich bin müde.", "müde")).toBe(true);
  });

  it("cümleyi kelimenin etrafında böler", () => {
    expect(splitAtWord("Über den Preis verhandeln wir.", "Preis")).toEqual(["Über den ", "Preis", " verhandeln wir."]);
    expect(splitAtWord("Hallo", "Tschüss")).toBeNull();
  });
});
