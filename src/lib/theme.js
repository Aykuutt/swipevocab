// Temayı sayfaya uygular. Seçim ilerlemeyle birlikte kaydedilir (state.settings.theme); ayrıca
// açılışta renkler yanıp sönmesin diye tarayıcıda da bir kopyası tutulur.
import { STORAGE_PREFIX } from "../config";
import { DEFAULT_THEME, getTheme } from "../data/themes";
import { storage } from "./storage";

const KEY = `${STORAGE_PREFIX}:theme`;

export function applyTheme(id) {
  if (typeof document === "undefined") return;
  const theme = getTheme(id);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.bar);
  storage.set(KEY, theme.id);
}

/** Uygulama açılırken, kayıt yüklenmeden önce son seçilen temayı uygular. */
export function applySavedTheme() {
  applyTheme(storage.get(KEY) || DEFAULT_THEME);
}
