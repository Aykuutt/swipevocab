import { DEFAULT_LANGUAGE } from "../data/languages";

const REQUIRED_FIELDS = ["id", "word", "phonetic", "pos", "level", "topic", "tr", "definition", "example"];

// Her dilin kelimeleri ayrı bir parça olarak yüklenir; seçilmeyen dil indirilmez.
const PACKS = {
  en: () => import("../data/langs/en"),
  de: () => import("../data/langs/de"),
  es: () => import("../data/langs/es"),
  fr: () => import("../data/langs/fr"),
};

/** Seçilen dilin kelime listesini yükler. */
export async function loadWords(language = DEFAULT_LANGUAGE) {
  const pack = PACKS[language] || PACKS[DEFAULT_LANGUAGE];
  const { WORDS } = await pack();
  const valid = WORDS.filter((w) => REQUIRED_FIELDS.every((f) => w[f] !== undefined && w[f] !== ""));
  if (valid.length === 0) throw new Error("Kelime listesi boş veya hatalı.");
  return valid;
}
