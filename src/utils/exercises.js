import { WORDS } from "../data/words.js";
import { shuffle } from "./shuffle.js";

export function buildTranslateExercise(word) {
  const distractors = shuffle(WORDS.filter((w) => w.id !== word.id)).slice(0, 3);
  const options = shuffle([word, ...distractors]);
  return {
    key: `tr-${word.id}-${Math.random()}`,
    type: "translate",
    word,
    options: options.map((o) => o.tr),
    correct: options.findIndex((o) => o.id === word.id),
  };
}

export function buildFillBlankExercise(word) {
  const distractors = shuffle(WORDS.filter((w) => w.id !== word.id)).slice(0, 3);
  const options = shuffle([word, ...distractors]);
  const blanked = word.example.replace(new RegExp(word.word, "i"), "____");
  return {
    key: `blank-${word.id}-${Math.random()}`,
    type: "fill_blank",
    word,
    blanked,
    options: options.map((o) => o.word),
    correct: options.findIndex((o) => o.id === word.id),
  };
}

export function buildListenAlongExercise(word) {
  return {
    key: `listen-${word.id}-${Math.random()}`,
    type: "listen_along",
    word,
  };
}

export function buildMatchExercise(words) {
  return {
    key: `match-${words.map((w) => w.id).join("-")}-${Math.random()}`,
    type: "match",
    words,
  };
}

// Bir ünitenin 8 kelimesinden karışık tipte bir ders kuyruğu oluşturur:
// çeviri sorusu + boşluk doldurma + dinle-takip et (can gitmez) + eşleştirme
export function buildLessonQueue(unitWords) {
  const shuffled = shuffle(unitWords);
  const translateEx = shuffled.map((w) => buildTranslateExercise(w));
  // her kelime için ayrıca bir boşluk doldurma sorusu da eklenir (8 kelime x 2 tip)
  const blankEx = shuffled.map((w) => buildFillBlankExercise(w));
  const listenWords = shuffle(shuffled).slice(0, 4);
  const listenEx = listenWords.map((w) => buildListenAlongExercise(w));
  const matchEx1 = buildMatchExercise(shuffle(shuffled).slice(0, 4));
  const matchEx2 = buildMatchExercise(shuffle(shuffled).slice(0, 4));
  return shuffle([...translateEx, ...blankEx, ...listenEx, matchEx1, matchEx2]);
}

