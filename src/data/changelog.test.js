import { describe, expect, it } from "vitest";
import { APP_VERSION } from "../config";
import { CHANGELOG, changesSince, isNewer } from "./changelog";

describe("neler yeni", () => {
  it("sürüm karşılaştırma", () => {
    expect(isNewer("0.19.0", "0.18.2")).toBe(true);
    expect(isNewer("0.18.10", "0.18.2")).toBe(true);
    expect(isNewer("0.18.2", "0.18.2")).toBe(false);
    expect(isNewer("1.0.0", "0.99.9")).toBe(true);
  });

  it("görülen sürümden sonrakiler listelenir; en yeni kayıt uygulamanın sürümü", () => {
    expect(CHANGELOG[0].version).toBe(APP_VERSION);
    const since = changesSince("0.18.2");
    expect(since).toContain(CHANGELOG[0].items[0]);
    expect(since.join(" ")).not.toMatch(/Telefonda köy haritası/); // 0.18.2'nin kendisi gösterilmez
    expect(changesSince(APP_VERSION)).toEqual([]);
    expect(changesSince(null)).toEqual(CHANGELOG[0].items);
  });
});
