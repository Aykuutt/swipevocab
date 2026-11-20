// Cümlede bir kelimeyi (ekleriyle birlikte) bulur. \b ve \w yalnızca ASCII harfleri tanıdığı için
// "für", "también", "été" gibi kelimelerde çalışmaz; burada Unicode harf sınıfları kullanılır.
import { escapeRegExp } from "./random";

const LETTER = "\\p{L}\\p{M}\\p{N}";

/** 1. grup: kelimeden önceki karakter (ya da boş), 2. grup: ekleriyle kelime. */
export const wordRegex = (word, flags = "iu") =>
  new RegExp(`(^|[^${LETTER}])(${escapeRegExp(word)}[\\p{L}\\p{M}]*)`, flags);

export const containsWord = (text, word) => wordRegex(word).test(text);

/** Kelimeyi ilk geçtiği yerde `replacement` ile değiştirir. */
export const replaceWord = (text, word, replacement) =>
  text.replace(wordRegex(word), (_, before) => before + replacement);

/** Cümleyi [önce, kelime, sonra] parçalarına böler; kelime yoksa null. */
export function splitAtWord(text, word) {
  const m = wordRegex(word).exec(text);
  if (!m) return null;
  const start = m.index + m[1].length;
  return [text.slice(0, start), m[2], text.slice(start + m[2].length)];
}
