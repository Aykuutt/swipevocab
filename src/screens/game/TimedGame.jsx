// "Zamana karşı": 60 saniyede olabildiğince çok kelime bil. Üst üste doğrular kombo yapar,
// puan çarpanı büyür. Yanlış cevap komboyu bozar ve süreden 3 saniye götürür; can gitmez.
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "../../components/Icon";
import { Button, EmptyState, ProgressBar } from "../../components/ui";
import { displayWord } from "../../data/languages";
import { timedQuestion } from "../../lib/exercises";
import { useApp } from "../../state/AppContext";

const DURATION = 60_000;
const PENALTY = 3_000;
const POINTS = 10;
const COMBO_STEP = 3; // her 3 doğruda çarpan bir artar
const MAX_MULTIPLIER = 5;

export const multiplierFor = (combo) => Math.min(MAX_MULTIPLIER, 1 + Math.floor(combo / COMBO_STEP));

const EMPTY = { score: 0, combo: 0, best: 0, correct: 0, wrong: 0 };

export default function TimedGame({ pool, words, recordKey, onExit }) {
  const { state, actions, sfx } = useApp();
  const record = state.records?.[recordKey] ?? 0;
  const startRecord = useRef(record); // oyun başındaki rekor: "yeni rekor" bunu geçince söylenir

  const [phase, setPhase] = useState("ready"); // ready | play | over
  const [g, setG] = useState(EMPTY);
  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);
  const [remaining, setRemaining] = useState(DURATION);
  const [penaltyAt, setPenaltyAt] = useState(0);
  const [result, setResult] = useState(null);

  const endAt = useRef(0);
  const timers = useRef([]);
  const saved = useRef(false);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    saved.current = false;
    startRecord.current = record;
    setG(EMPTY);
    setPicked(null);
    setQ(timedQuestion(pool, words));
    endAt.current = Date.now() + DURATION;
    setRemaining(DURATION);
    setPhase("play");
  };

  // Geri sayım.
  useEffect(() => {
    if (phase !== "play") return;
    const timer = setInterval(() => {
      const left = endAt.current - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setPhase("over");
      } else setRemaining(left);
    }, 100);
    return () => clearInterval(timer);
  }, [phase]);

  // Süre bitince puanı ve rekoru bir kez kaydet.
  useEffect(() => {
    if (phase !== "over" || saved.current) return;
    saved.current = true;
    const isRecord = g.score > startRecord.current && g.score > 0;
    const bonus = Math.min(15, Math.floor(g.score / 40));
    if (g.score > 0) actions.setRecord(recordKey, g.score);
    if (bonus > 0) actions.awardXp(bonus);
    if (isRecord) sfx("levelup");
    setResult({ ...g, isRecord, bonus });
  }, [phase, g, actions, recordKey, sfx]);

  const answer = useCallback(
    (i) => {
      if (phase !== "play" || picked !== null || !q) return;
      const ok = i === q.correct;
      setPicked(i);
      if (ok) {
        const combo = g.combo + 1;
        setG({
          ...g,
          combo,
          best: Math.max(g.best, combo),
          correct: g.correct + 1,
          score: g.score + POINTS * multiplierFor(g.combo),
        });
        sfx("correct");
        actions.correct(1);
      } else {
        setG({ ...g, combo: 0, wrong: g.wrong + 1 });
        endAt.current -= PENALTY;
        setPenaltyAt(Date.now());
        sfx("wrong");
      }
      later(
        () => {
          setQ((prev) => timedQuestion(pool, words, prev?.word.id));
          setPicked(null);
        },
        ok ? 260 : 650
      );
    },
    [phase, picked, q, g, pool, words, actions, sfx]
  );

  const seconds = Math.ceil(remaining / 1000);
  const multiplier = multiplierFor(g.combo);

  if (phase === "ready") {
    return (
      <div className="runner">
        <div className="runner-top">
          <button type="button" className="icon-btn" aria-label="Kapat" onClick={onExit}>
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="runner-complete">
          <EmptyState
            mascot="wave"
            title="Zamana karşı"
            actions={
              <Button size="lg" block onClick={start}>
                Başla
              </Button>
            }
          >
            <p>60 saniyede olabildiğince çok kelime bil.</p>
            <ul className="timed-rules">
              <li>Üst üste her 3 doğru puan çarpanını artırır (en çok x{MAX_MULTIPLIER}).</li>
              <li>Yanlış cevap komboyu bozar ve 3 saniye götürür. Can gitmez.</li>
            </ul>
            {record > 0 && (
              <p>
                Rekorun: <strong>{record}</strong>
              </p>
            )}
          </EmptyState>
        </div>
      </div>
    );
  }

  if (phase === "over") {
    return (
      <div className="runner">
        <div className="runner-complete">
          <EmptyState
            celebrate={!!result?.isRecord}
            mascot={result?.isRecord ? "cheer" : "happy"}
            title={result?.isRecord ? "Yeni rekor!" : "Süre bitti"}
            actions={
              <>
                <Button size="lg" block onClick={start}>
                  Tekrar oyna
                </Button>
                <Button variant="ghost" block onClick={onExit}>
                  Oyunlara dön
                </Button>
              </>
            }
          >
            <p className="timed-final">{g.score}</p>
            <dl className="timed-stats">
              <div>
                <dt>{g.correct}</dt>
                <dd>doğru</dd>
              </div>
              <div>
                <dt>{g.best}</dt>
                <dd>en uzun kombo</dd>
              </div>
              <div>
                <dt>{Math.max(record, g.score)}</dt>
                <dd>rekor</dd>
              </div>
            </dl>
            {result?.bonus > 0 && <p>+{result.bonus} bonus puan hesabına eklendi.</p>}
          </EmptyState>
        </div>
      </div>
    );
  }

  const reverse = q?.type === "reverse";
  const showPenalty = Date.now() - penaltyAt < 700;
  return (
    <div className="runner timed">
      <div className="runner-top">
        <button type="button" className="icon-btn" aria-label="Oyundan çık" onClick={onExit}>
          <Icon name="close" size={22} />
        </button>
        <ProgressBar value={(remaining / DURATION) * 100} tone={seconds <= 10 ? "amber" : "gradient"} label="Kalan süre" />
        <span className={`timed-time ${seconds <= 10 ? "is-low" : ""}`} aria-label={`${seconds} saniye kaldı`}>
          {seconds}
          {showPenalty && <b className="timed-penalty">-3</b>}
        </span>
      </div>

      <div className="timed-board">
        <span className="timed-score">
          <Icon name="star" size={18} filled />
          {g.score}
        </span>
        <span className={`timed-combo ${multiplier > 1 ? "is-hot" : ""}`}>
          {g.combo > 0 ? `${g.combo} kombo` : "Kombo yok"} · x{multiplier}
        </span>
      </div>

      <div className="runner-body">
        {q && (
          <div className="exercise" key={q.key}>
            <h2 className="exercise-prompt">{reverse ? "Hangi kelime?" : "Türkçe karşılığı?"}</h2>
            <div className="ask-word">
              <span className="ask-word-text">{reverse ? q.word.tr : displayWord(q.word)}</span>
              {!reverse && <span className="ask-word-ipa">{q.word.phonetic}</span>}
            </div>
            <div className="options" role="group" aria-label="Cevap seçenekleri">
              {q.options.map((text, i) => {
                let tone = "";
                if (picked !== null) tone = i === q.correct ? "is-correct" : i === picked ? "is-wrong" : "is-dim";
                return (
                  <button key={i} type="button" className={`option ${tone}`} disabled={picked !== null} onClick={() => answer(i)}>
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
