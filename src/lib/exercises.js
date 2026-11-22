// Alıştırma soruları üretir: çeviri, boşluk doldurma, dinleme, eşleştirme.
import { GOALS } from "../data/goals";
import { LEVELS } from "../config";
import { displayWord } from "../data/languages";
import { sample, shuffle } from "./random";
import { replaceWord } from "./wordMatch";

let keyCounter = 0;
const nextKey = (prefix) => `${prefix}-${++keyCounter}`;

/**
 * Yanlış şıklar: aynı türden ve yakın seviyeden kelimeleri öne alır,
 * aynı metni iki kez göstermez.
 */
function pickDistractors(target, words, count = 3, textOf = (w) => w.word) {
  const targetText = textOf(target);
  const candidates = words.filter((w) => w.id !== target.id && textOf(w) !== targetText);
  const seen = new Set();
  const ranked = shuffle(candidates)
    .map((w) => ({
      w,
      score: (w.pos === target.pos ? 0 : 10) + Math.abs(LEVELS.indexOf(w.level) - LEVELS.indexOf(target.level)),
    }))
    .sort((a, b) => a.score - b.score)
    .filter(({ w }) => {
      const t = textOf(w);
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .slice(0, Math.max(count * 3, count));
  return sample(
    ranked.map((x) => x.w),
    count
  );
}

// Kelimeyi ekleriyle birlikte boşaltır ("leaves" -> "____"); yoksa boşluktan sonra "s" gibi bir ek kalırdı.
const blankOut = (word) => replaceWord(word.example, word.word, "____");

export function translateExercise(word, words) {
  const options = shuffle([word, ...pickDistractors(word, words, 3, (w) => w.tr)]);
  return {
    key: nextKey("tr"),
    type: "translate",
    word,
    options: options.map((w) => w.tr),
    correct: options.findIndex((w) => w.id === word.id),
  };
}

export function fillBlankExercise(word, words) {
  const blanked = blankOut(word);
  // Kelime örnek cümlede birebir geçmiyorsa boşluk oluşmaz; çeviri sorusu sor.
  if (!blanked.includes("____")) return translateExercise(word, words);
  const options = shuffle([word, ...pickDistractors(word, words, 3)]);
  return {
    key: nextKey("blank"),
    type: "fill_blank",
    word,
    blanked,
    options: options.map((w) => w.word),
    correct: options.findIndex((w) => w.id === word.id),
  };
}

/** Türkçesi verilir, doğru kelime seçilir (Zamana karşı oyunu için). */
export function reverseExercise(word, words) {
  const options = shuffle([word, ...pickDistractors(word, words, 3)]);
  return {
    key: nextKey("rev"),
    type: "reverse",
    word,
    options: options.map(displayWord),
    correct: options.findIndex((w) => w.id === word.id),
  };
}

/** Zamana karşı için bir sonraki soru: kelime -> Türkçe ya da Türkçe -> kelime, yarı yarıya. */
export function timedQuestion(pool, allWords, avoidId = null) {
  const choices = pool.length > 1 ? pool.filter((w) => w.id !== avoidId) : pool;
  const word = choices[Math.floor(Math.random() * choices.length)];
  return Math.random() < 0.5 ? translateExercise(word, allWords) : reverseExercise(word, allWords);
}

/** Dinle ve yaz: kelime okunur, yazılır. */
export const dictationExercise = (word) => ({ key: nextKey("dict"), type: "dictation", word });

export function dictationGame(pool, count = 8) {
  return sample(pool, Math.min(count, pool.length)).map(dictationExercise);
}

// Cümle başında da büyük harfle kalması gereken özel isimler.
const PROPER_START = /^(İstanbul|Ankara|Roma|İspanya|İngiliz)/;

/** Türkçe çeviriyi kutucuk kelimelerine böler: noktalama atılır, cümle başı küçük harfe iner. */
export function sentenceTiles(text) {
  const tokens = text
    .split(/\s+/)
    .map((t) => t.replace(/^[.,!?;:"«»()]+|[.,!?;:"«»()]+$/g, ""))
    .filter(Boolean);
  if (tokens[0] && !PROPER_START.test(tokens[0])) tokens[0] = tokens[0].toLocaleLowerCase("tr");
  return tokens;
}

const SENTENCE_MIN = 3;
const SENTENCE_MAX = 8;
const canBuildSentence = (w) => {
  if (!w.exampleTr) return false;
  const n = sentenceTiles(w.exampleTr).length;
  return n >= SENTENCE_MIN && n <= SENTENCE_MAX;
};

const tileKey = (t) => t.toLocaleLowerCase("tr");

/**
 * "Cümleyi kur": Dilbaz örnek cümleyi okur, öğrenci Türkçesini kutucuklardan sıralar.
 * Kutucuklar arasında başka cümlelerden birkaç şaşırtmaca kelime de olur.
 */
export function sentenceExercise(word, words) {
  const answer = sentenceTiles(word.exampleTr);
  const used = new Set(answer.map(tileKey));
  const extraCount = answer.length >= 7 ? 2 : 3;
  const extras = [];
  for (const other of shuffle(words.filter((w) => w.id !== word.id && w.exampleTr))) {
    for (const t of shuffle(sentenceTiles(other.exampleTr))) {
      if (extras.length >= extraCount) break;
      if (used.has(tileKey(t)) || /^\d/.test(t)) continue;
      used.add(tileKey(t));
      extras.push(t);
    }
    if (extras.length >= extraCount) break;
  }
  const tiles = shuffle([...answer, ...extras]).map((text, i) => ({ id: i, text }));
  return { key: nextKey("build"), type: "build_sentence", word, answer, tiles };
}

/**
 * Kurulan cümle doğrudan kaç kelime uzak: kelime düzeyinde düzenleme mesafesi
 * (eksik, fazla, yanlış kelime ya da yer değiştirmiş iki komşu kelime 1 sayılır).
 */
export function sentenceDistance(picked, answer) {
  const a = picked.map(tileKey);
  const b = answer.map(tileKey);
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const listenExercise = (word) => ({ key: nextKey("listen"), type: "listen_along", word });
const matchExercise = (words) => ({ key: nextKey("match"), type: "match", words });

/** Bir ünitenin dersi: her kelime için çeviri ve boşluk, birkaç dinleme, cümle kurma, iki eşleştirme. */
export function unitLesson(unitWords, allWords) {
  const list = shuffle(unitWords);
  const matchSize = Math.min(4, list.length);
  return shuffle([
    ...list.map((w) => translateExercise(w, allWords)),
    ...list.map((w) => fillBlankExercise(w, allWords)),
    ...sample(list, Math.min(4, list.length)).map(listenExercise),
    ...sample(list.filter(canBuildSentence), 2).map((w) => sentenceExercise(w, allWords)),
    matchExercise(sample(list, matchSize)),
    matchExercise(sample(list, matchSize)),
  ]);
}

/** Pekiştirme: öğrenilen kelimeler ve aralarına karışan birkaç bilinen kelime. */
export function reinforceLesson(learning, known, allWords) {
  const mixedIn = sample(known, Math.min(5, known.length));
  return shuffle([...learning, ...mixedIn]).map((w) => fillBlankExercise(w, allWords));
}

export function fillBlankGame(pool, allWords, count = 8) {
  return sample(pool, Math.min(count, pool.length)).map((w) => fillBlankExercise(w, allWords));
}

export function matchGame(pool, rounds = 3) {
  const size = Math.min(4, pool.length);
  return Array.from({ length: rounds }, () => matchExercise(sample(pool, size)));
}

/** Seviye testi: amaca uygun 5 kelime, 3 çeviri + 2 boşluk sorusu. */
export function placementTest(goalId, words) {
  const goal = GOALS.find((g) => g.id === goalId) || GOALS[2];
  let pool = words.filter(goal.filter);
  if (pool.length < 5) pool = words;
  const questions = sample(pool, 5).map((w, i) => (i < 3 ? translateExercise(w, words) : fillBlankExercise(w, words)));
  return shuffle(questions);
}

export function placementLevel(correct, total = 5) {
  const ratio = correct / total;
  return ratio >= 0.8 ? "B1" : ratio >= 0.4 ? "A2" : "A1";
}
