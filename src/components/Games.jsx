import React, { useEffect, useState } from "react";
import { WORDS } from "../data/words.js";
import { shuffle } from "../utils/shuffle.js";

export function ReinforceGame({ pool, allWords, onDone, onWrong, onCorrect, lives, onOutOfHearts }) {
  const [queue, setQueue] = useState(pool);
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (queue.length === 0) {
      onDone();
      return;
    }
    const item = queue[0];
    const distractors = shuffle(allWords.filter((w) => w.id !== item.id)).slice(0, 3);
    setOptions(shuffle([item, ...distractors]));
    setCurrent(item);
    setSelected(null);
    setFeedback(null);
    // eslint-disable-next-line
  }, [queue]);

  if (!current) return null;

  if (lives <= 0) {
    return (
      <div className="sv-empty">
        <h3>Canların bitti 💔</h3>
        <p>Canların dolduğunda pekiştirmeye kaldığın yerden devam edebilirsin.</p>
        <button className="sv-cta sv-cta-secondary" onClick={onOutOfHearts}>Mağazaya git</button>
      </div>
    );
  }

  const blanked = current.example.replace(new RegExp(current.word, "i"), "_____");

  const choose = (opt) => {
    if (selected) return;
    setSelected(opt.id);
    const correct = opt.id === current.id;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) { if (onCorrect) onCorrect(); } else { onWrong(); }
    setTimeout(() => {
      setQueue((q) => (correct ? q.slice(1) : [...q.slice(1), current]));
    }, 900);
  };

  return (
    <div className="sv-reinforce">
      <div className="sv-lives">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`sv-heart ${i < lives ? "full" : "empty"}`}>♥</span>
        ))}
      </div>
      <p className="sv-reinforce-tag">Boşluğu doldur</p>
      <p className="sv-reinforce-sentence">"{blanked}"</p>
      <div className="sv-options">
        {options.map((opt) => {
          let cls = "sv-option";
          if (selected) {
            if (opt.id === current.id) cls += " correct";
            else if (opt.id === selected) cls += " wrong";
          }
          return (
            <button key={opt.id} className={cls} onClick={() => choose(opt)} disabled={!!selected}>
              {opt.word}
            </button>
          );
        })}
      </div>
      {feedback && (
        <p className={`sv-feedback ${feedback}`}>
          {feedback === "correct" ? "Doğru! Kelime pekişiyor." : `Yanlış — doğrusu "${current.word}"`}
        </p>
      )}
    </div>
  );
}

export function MatchingGame({ words, onExit, onCorrect, onWrong }) {
  const [round, setRound] = useState(() => shuffle(words).slice(0, 4));
  const [shuffledDefs, setShuffledDefs] = useState(() => shuffle(round));
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);

  const pickWord = (item) => {
    if (matched.includes(item.id)) return;
    setSelectedWord(item.id);
    if (selectedDef !== null) checkMatch(item.id, selectedDef);
  };

  const pickDef = (item) => {
    if (matched.includes(item.id)) return;
    setSelectedDef(item.id);
    if (selectedWord !== null) checkMatch(selectedWord, item.id);
  };

  const checkMatch = (wordId, defId) => {
    if (wordId === defId) {
      setMatched((m) => [...m, wordId]);
      setSelectedWord(null);
      setSelectedDef(null);
      if (onCorrect) onCorrect();
    } else {
      setWrongPair([wordId, defId]);
      if (onWrong) onWrong();
      setTimeout(() => {
        setWrongPair(null);
        setSelectedWord(null);
        setSelectedDef(null);
      }, 600);
    }
  };

  const nextRound = () => {
    const r = shuffle(words).slice(0, 4);
    setRound(r);
    setShuffledDefs(shuffle(r));
    setMatched([]);
    setSelectedWord(null);
    setSelectedDef(null);
  };

  const done = matched.length === round.length;

  return (
    <div className="sv-reinforce">
      <div className="sv-reinforce-tag" style={{ background: "rgba(255,184,77,0.15)", color: "var(--amber)" }}>
        Eşleştir
      </div>
      <button className="sv-back-link" onClick={onExit}>← Oyunlara dön</button>

      {!done ? (
        <div className="sv-match-grid">
          <div className="sv-match-col">
            {round.map((w) => {
              const isMatched = matched.includes(w.id);
              const isSelected = selectedWord === w.id;
              const isWrong = wrongPair && wrongPair[0] === w.id;
              return (
                <button
                  key={w.id}
                  className={`sv-match-chip ${isMatched ? "matched" : ""} ${isSelected ? "selected" : ""} ${isWrong ? "wrong" : ""}`}
                  onClick={() => pickWord(w)}
                  disabled={isMatched}
                >
                  {w.word}
                </button>
              );
            })}
          </div>
          <div className="sv-match-col">
            {shuffledDefs.map((w) => {
              const isMatched = matched.includes(w.id);
              const isSelected = selectedDef === w.id;
              const isWrong = wrongPair && wrongPair[1] === w.id;
              return (
                <button
                  key={w.id}
                  className={`sv-match-chip sv-match-def ${isMatched ? "matched" : ""} ${isSelected ? "selected" : ""} ${isWrong ? "wrong" : ""}`}
                  onClick={() => pickDef(w)}
                  disabled={isMatched}
                >
                  {w.definition.length > 38 ? w.definition.slice(0, 38) + "…" : w.definition}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="sv-empty" style={{ padding: "40px 10px" }}>
          <h3>Tamamlandı! 🎉</h3>
          <p>4 kelimeyi de doğru eşleştirdin.</p>
          <button className="sv-cta" onClick={nextRound}>Yeni tur</button>
        </div>
      )}
    </div>
  );
}

export function GameHub({ pool, onExit, onCorrect, onWrong, lives, loseLife, isPro, heartCountdown }) {
  const [mode, setMode] = useState(null);
  const practicePool = pool.length >= 4 ? pool : WORDS;
  const blankQueue = shuffle(practicePool).slice(0, 6);
  const outOfHearts = !isPro && lives <= 0;

  if (mode === "blank") {
    return (
      <div>
        <button className="sv-back-link" onClick={() => setMode(null)}>← Oyunlara dön</button>
        <ReinforceGame
          pool={blankQueue}
          allWords={practicePool}
          lives={isPro ? 99 : lives}
          onOutOfHearts={() => setMode(null)}
          onCorrect={onCorrect}
          onWrong={() => { if (!isPro) loseLife(); onWrong(); }}
          onDone={() => setMode(null)}
        />
      </div>
    );
  }

  if (mode === "match") {
    return (
      <MatchingGame
        words={practicePool}
        onExit={() => setMode(null)}
        onCorrect={onCorrect}
        onWrong={onWrong}
      />
    );
  }

  return (
    <div className="sv-game-hub">
      <p className="sv-label" style={{ marginBottom: 14 }}>bir oyun seç</p>
      {outOfHearts && (
        <div className="sv-hearts-warning">
          <span>💔 Canların bitti — bir sonraki can {heartCountdown || "yakında"} sonra dolacak</span>
        </div>
      )}
      <button className="sv-game-card" disabled={outOfHearts} onClick={() => setMode("blank")}>
        <span className="sv-game-icon">✍️</span>
        <span className="sv-game-title">Boşluğu Doldur</span>
        <span className="sv-game-desc">Cümle içinde doğru kelimeyi seç, canlarınla oyna.</span>
      </button>
      <button className="sv-game-card" onClick={() => setMode("match")}>
        <span className="sv-game-icon">🔗</span>
        <span className="sv-game-title">Eşleştir</span>
        <span className="sv-game-desc">Kelimeyi doğru tanımıyla eşleştir.</span>
      </button>
    </div>
  );
}

