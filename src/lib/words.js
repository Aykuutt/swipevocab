import { DEFAULT_LANGUAGE } from "../data/languages";

const REQUIRED_FIELDS = ["id", "word", "phonetic", "pos", "level", "topic", "tr", "definition", "example"];

// Her dilin kelimeleri ayrı bir parça olarak yüklenir; seçilmeyen dil indirilmez.
const PACKS = {
  en: () => import("../data/langs/en"),
  de: () => import("../data/langs/de"),
  es: () => import("../data/langs/es"),
  fr: () => import("../data/langs/fr"),
};

// Örnek cümlelerin Türkçe çevirileri ("Cümleyi kur" alıştırması için). Çevirisi olmayan dilde o alıştırma çıkmaz.
const SENTENCE_PACKS = {
  en: () => import("../data/sentences/en"),
};

/** Seçilen dilin kelime listesini yükler. */
export async function loadWords(language = DEFAULT_LANGUAGE) {
  const id = PACKS[language] ? language : DEFAULT_LANGUAGE;
  const [{ WORDS }, sentences] = await Promise.all([PACKS[id](), SENTENCE_PACKS[id]?.() ?? {}]);
  const translations = sentences.EXAMPLE_TR || {};
  const valid = WORDS.filter((w) => REQUIRED_FIELDS.every((f) => w[f] !== undefined && w[f] !== "")).map((w) =>
    translations[w.id] ? { ...w, exampleTr: translations[w.id] } : w
  );
  if (valid.length === 0) throw new Error("Kelime listesi boş veya hatalı.");
  return valid;
}
