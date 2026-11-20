// "Öğren" sekmesi. Günün aşamasına göre üç görünüm:
//   swipe     -> kart destesi
//   reinforce -> işaretlenen kelimeler için pekiştirme soruları
//   done/limit-> günün özeti
import { useMemo, useRef, useState } from "react";
import AccountPrompt from "../../components/AccountPrompt";
import ExerciseRunner from "../../components/exercises/ExerciseRunner";
import Icon from "../../components/Icon";
import { Button, EmptyState, Overlay } from "../../components/ui";
import { DAILY_GOAL_OPTIONS, FEATURES } from "../../config";
import { reinforceLesson } from "../../lib/exercises";
import { useApp } from "../../state/AppContext";
import { currentStreak, dailyCardLimit, weekStrip } from "../../state/selectors";
import SwipeCard from "./SwipeCard";

/* ---------- Bugünkü durum paneli ---------- */
const RING_R = 26;
const RING_LEN = 2 * Math.PI * RING_R;

function TodayPanel() {
  const { state } = useApp();
  const goal = dailyCardLimit(state) ?? state.settings.dailyGoal;
  const ratio = Math.min(1, state.swipedToday / goal);
  const reviews = state.deck.filter((c) => c.isReview).length;
  const streak = currentStreak(state);
  const week = weekStrip(state);

  return (
    <section className="today" aria-label="Bugünkü durum">
      <div className="today-top">
        <div className="ring" role="img" aria-label={`Günlük hedef: ${state.swipedToday} / ${goal} kart`}>
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle className="ring-track" cx="32" cy="32" r={RING_R} />
            <circle
              className="ring-fill"
              cx="32"
              cy="32"
              r={RING_R}
              strokeDasharray={RING_LEN}
              strokeDashoffset={RING_LEN * (1 - ratio)}
            />
          </svg>
          <span className="ring-value">{state.swipedToday}</span>
        </div>
        <div className="today-text">
          <span className="today-label">Bugünkü hedef</span>
          <strong>
            {state.swipedToday} / {goal} kart
          </strong>
          {reviews > 0 && <span className="today-note">{reviews} tekrar kartı seni bekliyor</span>}
        </div>
        <div className={`today-streak ${streak > 0 ? "is-on" : ""}`} aria-label={`${streak} günlük seri`}>
          <Icon name="flame" size={20} filled />
          <strong>{streak}</strong>
          <span>gün</span>
        </div>
      </div>
      <ol className="week" aria-label="Bu hafta">
        {week.map((d) => (
          <li key={d.label} className={`week-day is-${d.status}`}>
            <span className="week-label">{d.label}</span>
            <span className="week-dot">
              {(d.status === "done" || d.status === "today-done") && <Icon name="check" size={14} />}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Kart destesi ---------- */
const DECK_BUTTONS = [
  { dir: "discard", label: "Bilmiyorum", icon: "close", tone: "coral" },
  { dir: "unsure", label: "Emin değilim", icon: "question", tone: "amber" },
  { dir: "keep", label: "Biliyorum", icon: "check", tone: "mint" },
];
const KEY_DIRS = { ArrowLeft: "discard", ArrowRight: "keep", ArrowUp: "unsure" };

function Deck() {
  const { state, wordsById, actions } = useApp();
  const [exitDir, setExitDir] = useState(null);
  const [flipToken, setFlipToken] = useState(0);
  const busy = useRef(false);
  const visible = state.deck.filter((c) => wordsById.has(c.id)).slice(0, 2);
  const top = visible[0];

  const choose = (dir) => {
    if (!top || busy.current) return;
    busy.current = true;
    setExitDir(dir);
  };

  const onDecide = (dir) => {
    actions.swipe(dir);
    busy.current = false;
    setExitDir(null);
  };

  const onKeyDown = (e) => {
    if (KEY_DIRS[e.key]) {
      e.preventDefault();
      choose(KEY_DIRS[e.key]);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setFlipToken((n) => n + 1);
    }
  };

  return (
    <div className="deck">
      <div
        className="deck-stage"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Kelime kartı. Boşluk tuşu kartı çevirir. Sol ok bilmiyorum, yukarı ok emin değilim, sağ ok biliyorum."
      >
        {visible
          .map((card, i) => (
            <SwipeCard
              key={card.id}
              word={wordsById.get(card.id)}
              isReview={card.isReview}
              isTop={i === 0}
              exitDir={i === 0 ? exitDir : null}
              flipToken={flipToken}
              onDecide={onDecide}
            />
          ))
          .reverse()}
      </div>
      <div className="deck-actions">
        {DECK_BUTTONS.map((b) => (
          <div key={b.dir} className="deck-action">
            <button
              type="button"
              className={`round-btn tone-${b.tone} ${b.dir === "unsure" ? "is-small" : ""}`}
              onClick={() => choose(b.dir)}
              aria-label={b.label}
              disabled={!top}
            >
              <Icon name={b.icon} size={b.dir === "unsure" ? 26 : 28} />
            </button>
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Aşamalar ---------- */
function SwipePhase() {
  return (
    <div className="screen screen-learn">
      <TodayPanel />
      <Deck />
    </div>
  );
}

function ReinforcePhase() {
  const { state, words, wordsById, actions } = useApp();
  const [open, setOpen] = useState(true);
  const lesson = useMemo(() => {
    const learning = state.learningIds.map((id) => wordsById.get(id)).filter(Boolean);
    const known = state.knownIds.map((id) => wordsById.get(id)).filter(Boolean);
    return reinforceLesson(learning, known, words);
    // Her açılışta yeni soru seti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="screen screen-center">
      <EmptyState
        mascot="think"
        title="Pekiştirme zamanı"
        actions={
          <Button size="lg" onClick={() => setOpen(true)}>
            Başla
          </Button>
        }
      >
        <p>
          İşaretlediğin {state.learningIds.length} kelimeyi kısa sorularla pekiştirelim. Aralarına bildiklerin de
          karışacak.
        </p>
      </EmptyState>
      {open && (
        <Overlay label="Pekiştirme soruları">
          <ExerciseRunner exercises={lesson} onComplete={actions.finishReinforce} onExit={() => setOpen(false)} />
        </Overlay>
      )}
    </div>
  );
}

function DonePhase() {
  const { state, actions, goTo } = useApp();
  const streak = currentStreak(state);
  const limit = dailyCardLimit(state);
  const unlimited = limit === null;
  const canRaiseGoal = !FEATURES.pro && limit < Math.max(...DAILY_GOAL_OPTIONS);

  return (
    <div className="screen screen-center">
      <EmptyState
        celebrate
        mascot="cheer"
        title={unlimited ? "Bugünkü hedef tamam" : "Bugünlük bu kadar"}
        actions={
          unlimited ? (
            <Button size="lg" onClick={actions.continueSwiping}>
              Kaydırmaya devam et
            </Button>
          ) : (
            <>
              <Button size="lg" block icon="path" onClick={() => goTo("path")}>
                Ünitelere devam et
              </Button>
              <Button size="lg" block variant="ghost" onClick={() => goTo("game")}>
                Oyun oyna
              </Button>
              {FEATURES.pro && (
                <Button size="lg" block variant="pro" icon="crown" onClick={() => actions.setPro(true)}>
                  Pro'ya geç, sınırsız kaydır
                </Button>
              )}
            </>
          )
        }
      >
        <ul className="done-stats">
          <li>
            <strong>{state.dailyXp}</strong>
            <span>bugün kazanılan puan</span>
          </li>
          <li>
            <strong>{state.knownIds.length}</strong>
            <span>bildiğin kelime</span>
          </li>
          <li>
            <strong>{streak}</strong>
            <span>günlük seri</span>
          </li>
        </ul>
        {state.user?.guest && (
          <div className="notice notice-violet guest-nudge">
            <Icon name="info" size={18} />
            <p>İlerlemen sadece bu cihazda. Kaybetmemek için ücretsiz hesap aç.</p>
            <AccountPrompt size="sm" variant="secondary">
              Hesap aç
            </AccountPrompt>
          </div>
        )}
        {!unlimited && (
          <p>
            Bugünün {limit} kartını bitirdin. Yarın yeni kartlar ve zamanı gelen tekrarlar seni bekliyor.
            {canRaiseGoal && " Daha fazlasını istersen Ayarlar'dan günlük hedefini yükseltebilirsin."}
          </p>
        )}
      </EmptyState>
    </div>
  );
}

export default function LearnScreen() {
  const { state } = useApp();
  if (state.phase === "swipe") return <SwipePhase />;
  if (state.phase === "reinforce") return <ReinforcePhase />;
  return <DonePhase />;
}
