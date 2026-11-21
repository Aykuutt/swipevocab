import { describe, expect, it } from "vitest";
import { initialVillage } from "../data/village";
import { publicInfo, snapshotToVillage, villageSnapshot } from "./friends";

describe("arkadaş köy vitrini", () => {
  it("vitrine yalnızca harita gider; sohbet, sipariş ve hasat bilgisi gitmez", () => {
    const v = { ...initialVillage(), collected: { a: 3 }, orders: { baker: { kind: "cards" } }, villagers: { baker: { talks: 4 } } };
    const snap = villageSnapshot(v);
    expect(Object.keys(snap).sort()).toEqual(["expansions", "items", "land"]);
    for (const i of snap.items) expect(Object.keys(i).sort()).toEqual(["level", "type", "x", "y"]);
    const info = publicInfo({ user: { name: "Ada", email: "gizli@example.com" }, village: v, language: "de" }, 7);
    expect(JSON.stringify(info)).not.toContain("gizli@example.com");
    expect(info).toMatchObject({ p_name: "Ada", p_streak: 7, p_language: "de" });
  });

  it("vitrin kopyası haritanın okuyabileceği köye döner", () => {
    const v = initialVillage();
    const back = snapshotToVillage(villageSnapshot(v));
    expect(back.items).toHaveLength(v.items.length);
    expect(new Set(back.items.map((i) => i.id)).size).toBe(v.items.length);
    expect(back.land).toEqual(v.land);
    expect(snapshotToVillage(null).items).toEqual([]);
  });
});
