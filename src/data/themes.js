// Uygulama temaları. Renkler src/styles/themes.css içinde [data-theme="<id>"] altında tanımlıdır;
// buradaki `preview` renkleri yalnızca Ayarlar'daki küçük önizleme içindir.
export const THEMES = [
  { id: "night", name: "Gece", hint: "Varsayılan erik moru", dark: true, bar: "#150F1F", preview: { bg: "#150f1f", card: "#271e3d", accent: "#7c6fff" } },
  { id: "ocean", name: "Okyanus", hint: "Derin mavi", dark: true, bar: "#0A1426", preview: { bg: "#0a1426", card: "#16294a", accent: "#4f93ff" } },
  { id: "forest", name: "Orman", hint: "Koyu yeşil", dark: true, bar: "#0D1A13", preview: { bg: "#0d1a13", card: "#1a3326", accent: "#7ccf4f" } },
  { id: "sunset", name: "Gün batımı", hint: "Sıcak gül tonları", dark: true, bar: "#1D1017", preview: { bg: "#1d1017", card: "#3a1f2b", accent: "#f0629f" } },
  { id: "light", name: "Açık", hint: "Gündüz için aydınlık", dark: false, bar: "#F4F1FA", preview: { bg: "#f4f1fa", card: "#ffffff", accent: "#6a5bf5" } },
];

export const DEFAULT_THEME = "night";
export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
