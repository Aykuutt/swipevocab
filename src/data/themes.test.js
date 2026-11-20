import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEMES, getTheme } from "./themes";

const css = readFileSync(resolve("src/styles/themes.css"), "utf8");

describe("temalar", () => {
  it("varsayılan tema listede ve diğer her temanın CSS bloğu var", () => {
    expect(THEMES.some((t) => t.id === DEFAULT_THEME)).toBe(true);
    for (const t of THEMES.filter((x) => x.id !== DEFAULT_THEME)) {
      expect(css, t.id).toContain(`[data-theme="${t.id}"]`);
    }
  });

  it("id'ler benzersiz, bilinmeyen tema varsayılana düşer", () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    expect(getTheme("yok").id).toBe(DEFAULT_THEME);
  });
});
