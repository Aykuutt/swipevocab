// "Dinle ve yaz" için yazım karşılaştırması. Aksan ve büyük harf farkları hata sayılmaz
// (telefon klavyesinde ü, é, ñ yazmak zor); doğru yazılış yine de gösterilir.

const clean = (text) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // aksanları at: é -> e, ü -> u
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[’‘`´]/g, "'")
    .replace(/[^\p{L}\p{N}' ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/** Yazılan, hedefle aksan farkı gözetmeden aynı mı? */
export const sameWord = (typed, target) => clean(typed) !== "" && clean(typed) === clean(target);

/** Aksanlar ve harfler de birebir doğru mu? */
export const exactWord = (typed, target) =>
  typed.trim().normalize("NFC").toLowerCase() === target.normalize("NFC").toLowerCase();

/** İki yazı arasındaki harf farkı (ekleme, silme, değiştirme sayısı). */
function distance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/** Yanlış ama yakın mı? Kısa kelimede 1, uzunlarda 2 harf farkı "yaklaştın" sayılır. */
export const nearWord = (typed, target) => {
  const a = clean(typed);
  const b = clean(target);
  if (!a || a === b) return false;
  return distance(a, b) <= (b.length >= 7 ? 2 : 1);
};

/** İpucu: ilk harf(ler) açık, kalanlar alt çizgi. "apple", 1 -> "a _ _ _ _" */
export const letterHint = (target, shown = 1) =>
  [...target].map((ch, i) => (i < shown || ch === " " || ch === "'" || ch === "-" ? ch : "_")).join(" ");
