import { useMemo, useState } from "react";
import { shuffle } from "../../lib/random";

/** Sol sütunda İngilizce, sağda karışık Türkçe karşılıklar. */
export default function MatchExercise({ ex, onResolve, onMistake }) {
  const right = useMemo(() => shuffle(ex.words), [ex.words]);
  const [leftPick, setLeftPick] = useState(null);
  const [rightPick, setRightPick] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);

  const tryPair = (leftId, rightId) => {
    if (leftId === rightId) {
      const next = [...matched, leftId];
      setMatched(next);
      setLeftPick(null);
      setRightPick(null);
      if (next.length === ex.words.length) onResolve({ correct: true, message: "Harika eşleştirme!" });
    } else {
      setWrongPair([leftId, rightId]);
      onMistake();
      setTimeout(() => {
        setWrongPair(null);
        setLeftPick(null);
        setRightPick(null);
      }, 600);
    }
  };

  const pickLeft = (id) => {
    if (wrongPair || matched.includes(id)) return;
    setLeftPick(id);
    if (rightPick !== null) tryPair(id, rightPick);
  };
  const pickRight = (id) => {
    if (wrongPair || matched.includes(id)) return;
    setRightPick(id);
    if (leftPick !== null) tryPair(leftPick, id);
  };

  const chipState = (id, selected, side) => {
    if (matched.includes(id)) return "is-matched";
    if (wrongPair && wrongPair[side] === id) return "is-wrong";
    if (selected === id) return "is-selected";
    return "";
  };

  return (
    <div className="exercise">
      <h2 className="exercise-prompt">Kelimeleri anlamlarıyla eşleştir</h2>
      <div className="match-grid">
        <div className="match-col">
          {ex.words.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`match-chip ${chipState(w.id, leftPick, 0)}`}
              disabled={matched.includes(w.id)}
              onClick={() => pickLeft(w.id)}
            >
              {w.word}
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`match-chip ${chipState(w.id, rightPick, 1)}`}
              disabled={matched.includes(w.id)}
              onClick={() => pickRight(w.id)}
            >
              {w.tr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
