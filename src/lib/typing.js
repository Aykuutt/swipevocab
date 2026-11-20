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
