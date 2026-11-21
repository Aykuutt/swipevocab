import { describe, expect, it } from "vitest";
import { buyBlock, initialVillage } from "../data/village";
import { hydrate, initialState, reducer } from "../state/reducer";
import { leaguePoints } from "../state/selectors";
import { publicInfo } from "./friends";
import { daysLeftInWeek, isoWeekKey } from "./time";

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

describe("arkadaş ligi", () => {
  it("takvim haftası Pazartesi başlar (ISO)", () => {
    expect(isoWeekKey(at(2026, 11, 16))).toBe("2026-W47"); // Pazartesi
    expect(isoWeekKey(at(2026, 11, 22, 23))).toBe("2026-W47"); // Pazar gece
    expect(isoWeekKey(at(2026, 11, 23, 0))).toBe("2026-W48"); // Pazartesi 00:00
    expect(isoWeekKey(at(2027, 1, 1))).toBe("2026-W53"); // yıl dönümü
    expect(daysLeftInWeek(at(2026, 11, 16))).toBe(7);
    expect(daysLeftInWeek(at(2026, 11, 22))).toBe(1);
  });

  it("lig puanı yeni haftada sıfırdan sayar; harcamak düşürmez", () => {
    let s = { ...initialState, xpTotal: 500, xp: 500 };
    s = reducer(s, { type: "LEAGUE_SYNC", week: "2026-W47" });
    expect(leaguePoints(s, "2026-W47")).toBe(0);
    s = { ...s, xpTotal: 540, xp: 10 }; // 40 kazandı, harcadı
    expect(leaguePoints(s, "2026-W47")).toBe(40);
    expect(reducer(s, { type: "LEAGUE_SYNC", week: "2026-W47" })).toBe(s);
    s = reducer(s, { type: "LEAGUE_SYNC", week: "2026-W48" });
    expect(leaguePoints(s, "2026-W48")).toBe(0);
    expect(leaguePoints(s, "2026-W47")).toBe(0); // eski hafta artık geçersiz
    expect(hydrate(s).league).toEqual(s.league);
  });

  it("vitrine haftalık puan ve hafta gider", () => {
    const s = { user: { name: "Ada" }, village: initialVillage(), language: "en", xpTotal: 80, league: { week: isoWeekKey(at(2026, 11, 18)), base: 50 } };
    expect(publicInfo(s, 3, at(2026, 11, 18))).toMatchObject({ p_weekly: 30, p_week: "2026-W47" });
    expect(publicInfo(s, 3, at(2026, 11, 25))).toMatchObject({ p_weekly: 0, p_week: "2026-W48" });
  });

  it("dostluk süsleri arkadaşla açılır ve ücretsizdir", () => {
    const v = initialVillage();
    expect(buyBlock({ xp: 0, village: v, friendsCount: 0 }, "friendtree")).toBe("friends");
    expect(buyBlock({ xp: 0, village: v, friendsCount: 1 }, "friendtree")).toBeNull();
    expect(buyBlock({ xp: 0, village: v, friendsCount: 2 }, "friendarch")).toBe("friends");
    expect(buyBlock({ xp: 0, village: v, friendsCount: 3 }, "friendarch")).toBeNull();
  });
});
