// Kelime defteri: kullanıcının gördüğü kelimeler, ustalık durumu ve tekrar takvimi.
// Saf fonksiyonlar (test edilebilir). Puan vermez; yalnızca öğrenmeye yardım eder.
import { REVIEW_INTERVALS } from "../config";
import { displayWord } from "../data/languages";

/** Bu tekrar aşamasına (0'dan başlar) gelen kelime "ustalaşıldı" sayılır (14+ gün arayla hatırlanıyor). */
export const MASTER_STAGE = 3;
/** Ustalık noktası sayısı: tekrar aşaması kadar. */
export const DOTS = REVIEW_INTERVALS.length;
/** Kütüphane rafları: bu kadar kelimede ustalaşınca bir raf daha dolar. */
export const SHELF_STEPS = [25, 50, 100, 200];

export const FILTERS = [
  { id: "all", label: "Tümü" },
  { id: "learning", label: "Öğreniyorum" },
  { id: "due", label: "Tekrarı gelen" },
  { id: "mastered", label: "Ustalaştım" },
];

/**
 * Defterdeki kelimeler: öğrenilmekte olanlar ve bilinenler.
 * dots: 0 (yeni öğreniliyor) .. DOTS (en uzun tekrar aralığında).
 */
export function notebookEntries(state, words) {
  const byId = new Map(words.map((w) => [w.id, w]));
  const entries = [];
  for (const id of state.learningIds) {
    const word = byId.get(id);
    if (word) entries.push({ word, id, status: "learning", dots: 0, due: null, isDue: false, mastered: false });
  }
  for (const id of state.knownIds) {
    const word = byId.get(id);
    if (!word || state.learningIds.includes(id)) continue;
    const s = state.schedule[id];
    const stage = s?.stage ?? 0;
    entries.push({
      word,
      id,
      status: stage <= 1 ? "learning" : "known",
      dots: Math.min(DOTS, stage + 1),
      due: s?.due ?? null,
      isDue: !!s && s.due <= state.day,
      mastered: stage >= MASTER_STAGE,
    });
  }
  return entries.sort((a, b) => a.word.word.localeCompare(b.word.word, "tr"));
}

export function notebookCounts(entries) {
  return {
    all: entries.length,
    learning: entries.filter((e) => e.status === "learning").length,
    due: entries.filter((e) => e.isDue).length,
    mastered: entries.filter((e) => e.mastered).length,
  };
}

const fold = (text) =>
  (text || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");

/** Filtre ve arama (yabancı kelime ya da Türkçesi; büyük/küçük harf ve aksan fark etmez). */
export function filterEntries(entries, filter, query = "") {
  const q = fold(query.trim());
  return entries.filter((e) => {
    if (filter === "learning" && e.status !== "learning") return false;
    if (filter === "due" && !e.isDue) return false;
    if (filter === "mastered" && !e.mastered) return false;
    if (!q) return true;
    return fold(e.word.word).includes(q) || fold(displayWord(e.word)).includes(q) || fold(e.word.tr).includes(q);
  });
}

/** Bir sonraki tekrarın kısa açıklaması. */
export function reviewText(entry, day) {
  if (entry.due === null) return entry.status === "learning" ? "Bugün öğreniyorsun" : "";
  const left = entry.due - day;
  if (left <= 0) return "Tekrar zamanı geldi";
  if (left === 1) return "Yarın tekrar";
  return `${left} gün sonra tekrar`;
}

/** Ustalaşılan kelime sayısına göre dolu raf sayısı. */
export const shelvesFilled = (mastered) => SHELF_STEPS.filter((n) => mastered >= n).length;

/** Kütüphanede Mira'nın karşılaması: öğrenilen dilde ve Türkçesi. */
const MIRA_LINES = {
  en: (n) => [`You already know ${n} words. Great job!`, `${n} kelime biliyorsun bile. Harika iş!`],
  de: (n) => [`Du kennst schon ${n} Wörter. Super!`, `${n} kelime biliyorsun bile. Süper!`],
  es: (n) => [`¡Ya sabes ${n} palabras! ¡Genial!`, `${n} kelime biliyorsun bile! Harika!`],
  fr: (n) => [`Tu connais déjà ${n} mots. Bravo !`, `${n} kelime biliyorsun bile. Bravo!`],
};
const MIRA_EMPTY = {
  en: ["Welcome! Your notebook is empty. Let's learn some words!", "Hoş geldin! Defterin boş. Hadi birkaç kelime öğrenelim!"],
  de: ["Willkommen! Dein Heft ist noch leer. Lernen wir ein paar Wörter!", "Hoş geldin! Defterin boş. Hadi birkaç kelime öğrenelim!"],
  es: ["¡Bienvenido! Tu cuaderno está vacío. ¡Vamos a aprender palabras!", "Hoş geldin! Defterin boş. Hadi kelime öğrenelim!"],
  fr: ["Bienvenue ! Ton carnet est vide. Apprenons quelques mots !", "Hoş geldin! Defterin boş. Hadi birkaç kelime öğrenelim!"],
};

export function miraGreeting(language, count) {
  if (count === 0) return MIRA_EMPTY[language] ?? MIRA_EMPTY.en;
  return (MIRA_LINES[language] ?? MIRA_LINES.en)(count);
}
