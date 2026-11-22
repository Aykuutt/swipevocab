import { describe, expect, it } from "vitest";
import { letterHint, nearWord, sameWord } from "./typing";

describe("dinle-yaz denetimi", () => {
  it("aksan ve büyük harf farkı doğru sayılır", () => {
    expect(sameWord("Cafe", "café")).toBe(true);
    expect(sameWord("strase", "Straße")).toBe(false);
    expect(sameWord("strasse", "Straße")).toBe(true);
  });

  it("bir iki harf farkı 'yaklaştın' sayılır, uzak tahmin sayılmaz", () => {
    expect(nearWord("aple", "apple")).toBe(true);
    expect(nearWord("recieve", "receive")).toBe(true);
    expect(nearWord("resevasion", "reservation")).toBe(true);
    expect(nearWord("banana", "apple")).toBe(false);
    expect(nearWord("apple", "apple")).toBe(false);
    expect(nearWord("", "apple")).toBe(false);
    expect(nearWord("ct", "cat")).toBe(true);
    expect(nearWord("dg", "cat")).toBe(false);
  });

  it("harf ipucu ilk harfi gösterir", () => {
    expect(letterHint("apple")).toBe("a _ _ _ _");
    expect(letterHint("ice cream")).toBe("i _ _   _ _ _ _ _");
  });
});
