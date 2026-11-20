// Kelimeleri konu ve seviyeye göre öğrenme yolu ünitelerine böler.
import { LEVELS, WORDS_PER_UNIT } from "../config";
import { TOPIC_ORDER, TOPICS } from "../data/topics";

const levelRank = (level) => LEVELS.indexOf(level);

export function buildUnits(words) {
  const units = [];
  TOPIC_ORDER.forEach((topic) => {
    const topicWords = words
      .filter((w) => w.topic === topic)
      .sort((a, b) => levelRank(a.level) - levelRank(b.level) || a.id - b.id);
    if (topicWords.length === 0) return;

    // Kelimeleri olabildiğince eşit büyüklükte ünitelere dağıt.
    const count = Math.max(1, Math.round(topicWords.length / WORDS_PER_UNIT));
    const base = Math.floor(topicWords.length / count);
    const extra = topicWords.length % count;
    let offset = 0;

    for (let i = 0; i < count; i++) {
      const size = base + (i < extra ? 1 : 0);
      const slice = topicWords.slice(offset, offset + size);
      offset += size;
      units.push({
        id: `${topic}-${i + 1}`,
        topic,
        number: i + 1,
        title: `${TOPICS[topic].label} ${i + 1}`,
        wordIds: slice.map((w) => w.id),
        levels: [...new Set(slice.map((w) => w.level))],
      });
    }
  });
  return units;
}
