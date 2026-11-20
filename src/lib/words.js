import { WORDS } from "../data/words";

const REQUIRED_FIELDS = ["id", "word", "phonetic", "pos", "level", "topic", "tr", "definition", "example"];

/**
 * Kelime listesini yükler. Şimdilik yerel dosyadan gelir; ileride bir
 * API'ye taşınırsa bu fonksiyonun imzası aynı kalabilir.
 */
export async function loadWords() {
  const valid = WORDS.filter((w) => REQUIRED_FIELDS.every((f) => w[f] !== undefined && w[f] !== ""));
  if (valid.length === 0) throw new Error("Kelime listesi boş veya hatalı.");
  return valid;
}
