import React, { useEffect, useState } from "react";
import { WORDS } from "../data/words.js";
import { buildLessonQueue } from "../utils/exercises.js";
import { shuffle } from "../utils/shuffle.js";
import { playSound, speak } from "../utils/audio.js";

export function TranslateExercise({ ex, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const choose = (i) => {
    if (selected !== null) return;
    setSelected(i);
  };
  return (
    <div className="sv-lesson-card">
      <p className="sv-lesson-prompt">"{ex.word.word}" kelimesinin Türkçe karşılığı nedir?</p>
      <button className="sv-speak-btn sv-lesson-speak" onClick={() => speak(ex.word.word)}>🔊</button>
      <div className="sv-onb-options" style={{ marginTop: 18 }}>
        {ex.options.map((opt, i) => {
          let cls = "sv-onb-option";
          if (selected !== null) {
            if (i === ex.correct) cls += " selected";
            else if (i === selected) cls += " wrong-onb";
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)}>{opt}</button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="sv-lesson-next-row">
          <button className="sv-cta sv-lesson-next" onClick={() => onAnswer(selected === ex.correct)}>
            Sonraki soru →
          </button>
        </div>
      )}
    </div>
  );
}

export function FillBlankExercise({ ex, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const choose = (i) => {
    if (selected !== null) return;
    setSelected(i);
  };
  return (
    <div className="sv-lesson-card">
      <p className="sv-lesson-prompt">Boşluğa hangi kelime gelmeli?</p>
      <p className="sv-onb-sentence">{ex.blanked}</p>
      <div className="sv-onb-options">
        {ex.options.map((opt, i) => {
          let cls = "sv-onb-option";
          if (selected !== null) {
            if (i === ex.correct) cls += " selected";
            else if (i === selected) cls += " wrong-onb";
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)}>{opt}</button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="sv-lesson-next-row">
          <button className="sv-cta sv-lesson-next" onClick={() => onAnswer(selected === ex.correct)}>
            Sonraki soru →
          </button>
        </div>
      )}
    </div>
  );
}

export function ListenAlongExercise({ ex, onAnswer }) {
  const words = ex.word.example.split(" ");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [finished, setFinished] = useState(false);

  const playSentence = () => {
    setActiveIdx(-1);
    setFinished(false);
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(ex.word.example);
      u.lang = "en-US";
      u.rate = 0.85;
      u.onboundary = (e) => {
        const upTo = ex.word.example.slice(0, e.charIndex);
        const idx = upTo.trim().length === 0 ? 0 : upTo.trim().split(" ").length;
        setActiveIdx(Math.min(idx, words.length - 1));
      };
      u.onend = () => setFinished(true);
      window.speechSynthesis.speak(u);
    } catch (err) {
      setFinished(true);
    }
  };

  useEffect(() => {
    playSentence();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="sv-lesson-card">
      <p className="sv-lesson-prompt">Cümleyi dinle ve takip et</p>
      <div className="sv-listen-sentence">
        {words.map((w, i) => (
          <span key={i} className={`sv-listen-word ${i === activeIdx ? "active" : ""}`}>{w} </span>
        ))}
      </div>
      <button className="sv-speak-btn sv-lesson-speak" onClick={playSentence}>🔁 Bir daha söyle</button>
      <button className="sv-cta sv-lesson-check" disabled={!finished} onClick={() => onAnswer(true)}>
        Devam et
      </button>
    </div>
  );
}

export function MatchExercise({ ex, onAnswer }) {
  const [defs] = useState(() => shuffle(ex.words));
  const [selWord, setSelWord] = useState(null);
  const [selDef, setSelDef] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);

  const check = (wId, dId) => {
    if (wId === dId) {
      const next = [...matched, wId];
      setMatched(next);
      setSelWord(null);
      setSelDef(null);
      if (next.length === ex.words.length) setTimeout(() => onAnswer(true), 500);
    } else {
      setWrongPair([wId, dId]);
      onAnswer(false, true); // sadece can azalt, egzersizi bitirme
      setTimeout(() => { setWrongPair(null); setSelWord(null); setSelDef(null); }, 600);
    }
  };

  return (
    <div className="sv-lesson-card">
      <p className="sv-lesson-prompt">Kelimeleri doğru anlamıyla eşleştir</p>
      <div className="sv-match-grid" style={{ marginTop: 16 }}>
        <div className="sv-match-col">
          {ex.words.map((w) => {
            const done = matched.includes(w.id);
            const cls = `sv-match-chip ${done ? "matched" : selWord === w.id ? "selected" : ""} ${wrongPair && wrongPair[0] === w.id ? "wrong" : ""}`;
            return (
              <button key={w.id} className={cls} disabled={done} onClick={() => { setSelWord(w.id); if (selDef !== null) check(w.id, selDef); }}>
                {w.word}
              </button>
            );
          })}
        </div>
        <div className="sv-match-col">
          {defs.map((w) => {
            const done = matched.includes(w.id);
            const cls = `sv-match-chip sv-match-def ${done ? "matched" : selDef === w.id ? "selected" : ""} ${wrongPair && wrongPair[1] === w.id ? "wrong" : ""}`;
            return (
              <button key={w.id} className={cls} disabled={done} onClick={() => { setSelDef(w.id); if (selWord !== null) check(selWord, w.id); }}>
                {w.tr}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LessonSession({ unit, onComplete, onExit, lives, loseLife, isPro, heartCountdown, onCorrect }) {
  const [queue, setQueue] = useState(() => buildLessonQueue(WORDS.filter((w) => unit.wordIds.includes(w.id))));
  const [done, setDone] = useState(0);

  const current = queue[0];
  // total, yanlış cevapla kuyruğun sonuna eklenen ekstra soruları da içersin
  // diye her seferinde "yapılan + kalan" olarak hesaplanır (sabit anlık görüntü değil)
  const total = done + queue.length;
  const progressPct = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));

  const handleAnswer = (correct, softWrong) => {
    if (correct) {
      playSound("correct");
      onCorrect?.();
      setDone((d) => d + 1);
      setQueue((q) => q.slice(1));
    } else {
      playSound("wrong");
      if (!isPro) loseLife();
      if (!softWrong) {
        setQueue((q) => [...q.slice(1), q[0]]);
      }
    }
  };

  useEffect(() => {
    if (queue.length === 0) onComplete();
    // eslint-disable-next-line
  }, [queue]);

  if (!isPro && lives <= 0) {
    return (
      <div className="sv-lesson">
        <div className="sv-empty">
          <h3>Can bitti 💔</h3>
          <p>Bu ünite tamamlanamadı. {heartCountdown ? `Bir sonraki can ${heartCountdown} sonra dolacak.` : "Canların dolmasını bekle."}</p>
          <button className="sv-cta sv-cta-secondary" onClick={onExit}>Yola dön</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="sv-lesson">
      <div className="sv-lesson-header">
        <button className="sv-lesson-close" onClick={onExit}>✕</button>
        <div className="sv-progress-track" style={{ flex: 1, margin: "0 10px" }}>
          <div className="sv-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="sv-lesson-lives">
          {isPro ? (
            <span className="sv-heart full">∞</span>
          ) : (
            [0, 1, 2].map((i) => (
              <span key={i} className={`sv-heart ${i < lives ? "full" : "empty"}`}>♥</span>
            ))
          )}
        </span>
      </div>

      {current.type === "translate" && <TranslateExercise key={current.key} ex={current} onAnswer={handleAnswer} />}
      {current.type === "fill_blank" && <FillBlankExercise key={current.key} ex={current} onAnswer={handleAnswer} />}
      {current.type === "listen_along" && <ListenAlongExercise key={current.key} ex={current} onAnswer={handleAnswer} />}
      {current.type === "match" && <MatchExercise key={current.key} ex={current} onAnswer={handleAnswer} />}
    </div>
  );
}

export function PathScreen({ units, completedUnits, onCompleteUnit, lives, loseLife, isPro, heartCountdown, onGoToStore, onCorrect }) {
  const [activeUnit, setActiveUnit] = useState(null);
  const [result, setResult] = useState(null); // "success" | null
  const [attempt, setAttempt] = useState(0);

  const startUnit = (unit) => {
    setResult(null);
    setActiveUnit(unit);
    setAttempt((a) => a + 1); // her girişte artar, sorular sıfırdan üretilsin diye
  };

  if (activeUnit && !result) {
    return (
      <LessonSession
        key={`${activeUnit.index}-${attempt}`}
        unit={activeUnit}
        lives={lives}
        loseLife={loseLife}
        isPro={isPro}
        heartCountdown={heartCountdown}
        onCorrect={onCorrect}
        onComplete={() => {
          const unitWords = WORDS.filter((w) => activeUnit.wordIds.includes(w.id));
          onCompleteUnit(activeUnit.index, unitWords);
          setResult("success");
        }}
        onExit={() => { setActiveUnit(null); setResult(null); }}
      />
    );
  }

  if (activeUnit && result) {
    return (
      <div className="sv-empty">
        <h3>Ünite tamamlandı! 🎉</h3>
        <p>{activeUnit.title} bitti, bir sonraki ünitenin kilidi açıldı.</p>
        <button className="sv-cta" onClick={() => { setActiveUnit(null); setResult(null); }}>Yola dön</button>
      </div>
    );
  }

  return (
    <div className="sv-path">
      {!isPro && lives <= 0 && (
        <div className="sv-hearts-warning">
          <span>💔 Canların bitti — bir sonraki can {heartCountdown || "yakında"} sonra dolacak</span>
          <button className="sv-cta sv-cta-secondary" onClick={onGoToStore}>Mağazaya git</button>
        </div>
      )}
      {units.map((unit, i) => {
        const isDone = completedUnits.includes(i);
        const isUnlocked = i === 0 || completedUnits.includes(i - 1);
        const align = i % 2 === 0 ? "sv-path-left" : "sv-path-right";
        return (
          <div key={i} className={`sv-path-row ${align}`}>
            <button
              className={`sv-path-node ${isDone ? "done" : isUnlocked ? "current" : "locked"}`}
              disabled={!isUnlocked}
              onClick={() => startUnit(unit)}
            >
              {isDone ? "✓" : isUnlocked ? unit.icon : "🔒"}
            </button>
            <span className="sv-path-label">{unit.title}</span>
          </div>
        );
      })}
    </div>
  );
}

