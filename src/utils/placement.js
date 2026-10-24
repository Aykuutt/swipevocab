import { WORDS } from "../data/words.js";
import { GOAL_WORD_IDS } from "../data/goals.js";
import { shuffle } from "./shuffle.js";

export function buildPlacementQuestions(goalId) {
  const ids = GOAL_WORD_IDS[goalId] || GOAL_WORD_IDS.general;
  const levels = ["A1", "A2", "B1", "B2", "C1"];
  const goalWords = WORDS.filter((w) => ids.includes(w.id));
  const chosen = levels.flatMap((level) => {
    const preferred = shuffle(goalWords.filter((w) => w.level === level));
    const fallback = shuffle(WORDS.filter((w) => w.level === level && !preferred.some((p) => p.id === w.id)));
    return [...preferred, ...fallback].slice(0, 2);
  });

  const built = chosen.map((w, i) => {
    const sameLevelWords = WORDS.filter((x) => x.level === w.level && x.id !== w.id);
    const distractors = shuffle(sameLevelWords.length >= 3 ? sameLevelWords : WORDS.filter((x) => x.id !== w.id)).slice(0, 3);

    if (i % 2 === 0) {
      // Tip 1: kelime anlamı — kısa gerçek çeviri (and = ve gibi)
      const options = shuffle([w, ...distractors]);
      return {
        type: "translate",
        word: w.word,
        level: w.level,
        options: options.map((o) => o.tr),
        correct: options.findIndex((o) => o.id === w.id),
      };
    }

    // Tip 2: cümledeki boşluğa doğru kelimeyi yerleştirme
    const blanked = w.example.replace(new RegExp(w.word, "i"), "ـــ");
    const options = shuffle([w, ...distractors]);
    return {
      type: "fill_blank",
      level: w.level,
      sentence: blanked,
      options: options.map((o) => o.word),
      correct: options.findIndex((o) => o.id === w.id),
    };
  });

  return shuffle(built);
}

