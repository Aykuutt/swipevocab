import { describe, expect, it } from "vitest";
import { LANGUAGE_ORDER } from "./languages";
import { WORDS } from "./langs/en";
import { DIALOGUES, HEART_AT, VILLAGERS, availableVillagers, dialogueFor, heartsFor, pickTalkWord, talkReward } from "./villagers";
import { TYPES, initialVillage } from "./village";

describe("köylü sohbetleri", () => {
  it("her dilde her köylünün en az 3 sohbeti var; her sohbette 3 seçenek ve tam bir doğru cevap", () => {
    for (const lang of LANGUAGE_ORDER) {
      for (const v of VILLAGERS) {
        const list = DIALOGUES[lang]?.[v.id];
        expect(list?.length, lang + " " + v.id).toBeGreaterThanOrEqual(3);
        for (const d of list) {
          expect(d.say && d.tr && d.reply && d.replyTr, lang + " " + d.say).toBeTruthy();
          expect(d.options).toHaveLength(3);
          expect(d.options.filter((o) => o.ok)).toHaveLength(1);
          for (const o of d.options) expect(o.text && o.tr).toBeTruthy();
          expect(d.words.length).toBeGreaterThanOrEqual(2);
          for (const [w, tr] of d.words) expect(w && tr).toBeTruthy();
        }
      }
    }
  });

  it("sohbetler sırayla döner, bilinmeyen dilde İngilizceye düşer", () => {
    const first = dialogueFor("de", "baker", 0);
    expect(dialogueFor("de", "baker", 3)).toBe(first);
    expect(dialogueFor("de", "baker", 1)).not.toBe(first);
    expect(dialogueFor("xx", "baker", 0)).toBe(DIALOGUES.en.baker[0]);
  });

  it("kalpler ve ödül: yeni kalp kazanılan sohbet bonus verir", () => {
    expect(heartsFor(0)).toBe(0);
    expect(heartsFor(HEART_AT[0])).toBe(1);
    expect(heartsFor(100)).toBe(HEART_AT.length);
    expect(talkReward(0)).toBe(8); // ilk sohbet: 3 + 1. kalp bonusu 5
    expect(talkReward(1)).toBe(3);
    expect(talkReward(2)).toBe(11); // 3. sohbet: 2. kalp (3 + 8)
  });

  it("köylü ancak binası kurulunca belirir (Pazar baştan var)", () => {
    const v = initialVillage();
    expect(availableVillagers(v).map((x) => x.id)).toEqual(["merchant"]);
    const withBakery = { ...v, items: [...v.items, { id: "b", type: "bakery", x: 6, y: 10, level: 1 }] };
    expect(availableVillagers(withBakery).map((x) => x.id)).toEqual(["merchant", "baker"]);
    for (const x of VILLAGERS) expect(TYPES[x.building]).toBeTruthy();
  });

  it("sohbet sonrası sorulacak kelime köylünün konusundan seçilir", () => {
    const baker = VILLAGERS.find((x) => x.id === "baker");
    for (let i = 0; i < 20; i++) {
      const w = pickTalkWord({ knownIds: [], learningIds: [] }, WORDS, baker);
      expect(baker.topics).toContain(w.topic);
    }
    const known = WORDS.find((w) => w.topic === "daily");
    expect(pickTalkWord({ knownIds: [known.id], learningIds: [] }, WORDS, baker)).toBe(known);
  });
});
