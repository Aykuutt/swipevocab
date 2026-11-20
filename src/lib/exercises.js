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

const listenExercise = (word) => ({ key: nextKey("listen"), type: "listen_along", word });
const matchExercise = (words) => ({ key: nextKey("match"), type: "match", words });

/** Bir ünitenin dersi: her kelime için çeviri ve boşluk, birkaç dinleme, iki eşleştirme. */
export function unitLesson(unitWords, allWords) {
  const list = shuffle(unitWords);
  const matchSize = Math.min(4, list.length);
  return shuffle([
    ...list.map((w) => translateExercise(w, allWords)),
    ...list.map((w) => fillBlankExercise(w, allWords)),
    ...sample(list, Math.min(4, list.length)).map(listenExercise),
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
