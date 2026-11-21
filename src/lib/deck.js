// Kaydırma destesinin hazırlanması: zamanı gelen tekrarlar + yeni kelimeler.
import { LEVELS, MAX_REVIEWS, PRO_DECK_SIZE } from "../config";
import { shuffle } from "./random";
import { dailyCardLimit, wordPool } from "../state/selectors";

/**
 * Kullanıcının çalışma seviyesi: başlangıç seviyesinden başlar, bir
 * seviyedeki kelimelerin %70'ini bildiyse bir üstüne geçer.
 */
export function studyLevelIndex(state, pool) {
  let i = Math.max(0, LEVELS.indexOf(state.placementLevel ?? "A1"));
  const known = new Set(state.knownIds);
  while (i < LEVELS.length - 1) {
    const atLevel = pool.filter((w) => w.level === LEVELS[i]);
    if (atLevel.length === 0) {
      i++;
      continue;
    }
    if (atLevel.filter((w) => known.has(w.id)).length / atLevel.length < 0.7) break;
    i++;
  }
  return i;
}

/** Kelimeleri çalışma seviyesine yakınlığa göre (biraz rastgelelikle) sıralar. */
function sortByLevelFit(words, levelIndex) {
  return shuffle(words)
    .map((w) => ({ w, score: Math.abs(LEVELS.indexOf(w.level) - levelIndex) + Math.random() * 1.5 }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.w);
}

/** Belirli bir gün için yeni deste. */
export function buildDeck(state, words, day = state.day, swipedToday = day === state.day ? state.swipedToday : 0) {
  const pool = wordPool(state, words);
  const seen = new Set([...state.knownIds, ...state.learningIds]);

  const dueIds = state.knownIds.filter((id) => {
    const s = state.schedule[id];
    return s && s.due <= day;
  });
  const reviews = shuffle(dueIds)
    .slice(0, MAX_REVIEWS)
    .map((id) => ({ id, isReview: true }));

  const fresh = sortByLevelFit(
    pool.filter((w) => !seen.has(w.id)),
    studyLevelIndex(state, pool)
  ).map((w) => ({ id: w.id }));

  const limit = dailyCardLimit(state);
  // Günlük sınır: bugün kaydırılanlar düşülür; tekrarlar da sınıra dahildir.
  const target = limit === null ? reviews.length + PRO_DECK_SIZE : Math.max(0, limit - swipedToday);
  let deck = [...reviews, ...fresh];

  // Yeni kelime tükendiyse ve bugün tekrarı gelen az ise deste eksik kalmasın: bilinen kelimelerden
  // tekrar zamanı en yakın olanlarla (unutmaya en yakın) tamamla. Böylece her gün hedef kadar kart gelir.
  if (deck.length < target) {
    const inDeck = new Set(deck.map((c) => c.id));
    const exists = new Set(words.map((w) => w.id));
    const extra = state.knownIds
      .filter((id) => !inDeck.has(id) && exists.has(id))
      .map((id) => ({ id, due: state.schedule[id]?.due ?? 0 }))
      .sort((a, b) => a.due - b.due)
      .slice(0, target - deck.length)
      .map(({ id }) => ({ id, isReview: true }));
    deck = [...deck, ...extra];
  }
  return deck.slice(0, target);
}

/** Sınırsız planda (Pro) deste azaldığında eklenecek kartlar. Yeni kelime kalmadıysa eskileri döndürür. */
export function topUpCards(state, words) {
  const pool = wordPool(state, words);
  const inDeck = new Set(state.deck.map((c) => c.id));
  const seen = new Set([...state.knownIds, ...state.learningIds]);
  let candidates = pool.filter((w) => !seen.has(w.id) && !inDeck.has(w.id));
  if (candidates.length === 0) candidates = pool.filter((w) => !inDeck.has(w.id));
  return sortByLevelFit(candidates, studyLevelIndex(state, pool))
    .slice(0, PRO_DECK_SIZE)
    .map((w) => ({ id: w.id, isReview: state.knownIds.includes(w.id) }));
}
