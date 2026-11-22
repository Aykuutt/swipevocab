// Bir alıştırma dizisini sırayla oynatır. Yanlış cevaplanan soru sona
// eklenir; hepsi doğru bilinince `onComplete` çağrılır.
import { useCallback, useEffect, useRef, useState } from "react";
import { FEATURES } from "../../config";
import { useValueDelta } from "../../hooks/useValueDelta";
import { useApp } from "../../state/AppContext";
import { hasUnlimitedLives } from "../../state/selectors";
import HeartTimer from "../HeartTimer";
import Icon from "../Icon";
import { Button, EmptyState, ProgressBar } from "../ui";
import { FillBlankExercise, TranslateExercise } from "./ChoiceExercises";
import DictationExercise from "./DictationExercise";
import Feedback from "./Feedback";
import ListenExercise from "./ListenExercise";
import MatchExercise from "./MatchExercise";

function OutOfHearts({ onExit }) {
  const { actions } = useApp();
  return (
    <EmptyState
      mascot="sad"
      title="Canların bitti"
      actions={
        <>
          {FEATURES.pro && (
            <Button block variant="pro" icon="crown" onClick={() => actions.setPro(true)}>
              Pro'ya geç, sınırsız can
            </Button>
          )}
          <Button block variant="ghost" onClick={onExit}>
            Çık
          </Button>
        </>
      }
    >
      <p>
        Bir sonraki can <HeartTimer className="inline" /> sonra gelecek. Bu arada kart kaydırabilir ya da köyünle
        ilgilenebilirsin.
      </p>
    </EmptyState>
  );
}

// Üst üste kaçıncı doğruda ne denir.
const COMBO_CHEERS = { 3: "Üst üste 3 doğru! 🔥", 5: "5 doğru üst üste, durdurulamıyorsun!", 8: "8'de 8! Efsane 🏆" };

const EXERCISES = {
  translate: TranslateExercise,
  fill_blank: FillBlankExercise,
  listen_along: ListenExercise,
  match: MatchExercise,
  dictation: DictationExercise,
};

export default function ExerciseRunner({ exercises, onComplete, onExit, costsHearts = true }) {
  const { state, actions, sfx } = useApp();
  const [queue, setQueue] = useState(exercises);
  const [doneCount, setDoneCount] = useState(0);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);
  const combo = useRef(0);
  const completed = useRef(false);

  const current = queue[0];
  const total = doneCount + queue.length;
  const unlimited = hasUnlimitedLives(state);
  const livesDelta = useValueDelta(unlimited ? 0 : state.lives);
  const outOfHearts = costsHearts && !unlimited && state.lives <= 0 && !result;

  const resolve = useCallback(
    (r) => {
      if (resultRef.current) return;
      if (r.neutral) {
        resultRef.current = r;
        setResult(r);
        return;
      }
      if (r.correct) {
        combo.current += 1;
        // Üst üste doğrular: cevap şeridindeki maskot tezahürat eder.
        const cheer = COMBO_CHEERS[combo.current];
        if (cheer) r = { ...r, message: cheer, mood: "cheer" };
        sfx("correct");
        actions.correct();
      } else {
        combo.current = 0;
        sfx("wrong");
        if (costsHearts) actions.loseLife();
      }
      resultRef.current = r;
      setResult(r);
    },
    [actions, sfx, costsHearts]
  );

  const mistake = useCallback(() => {
    sfx("wrong");
    if (costsHearts) actions.loseLife();
  }, [actions, sfx, costsHearts]);

  const next = () => {
    const r = resultRef.current;
    if (!r) return;
    resultRef.current = null;
    setResult(null);
    if (r.correct) {
      setDoneCount((n) => n + 1);
      setQueue((q) => q.slice(1));
    } else {
      setQueue((q) => [...q.slice(1), q[0]]); // yanlışı sona at
    }
  };

  useEffect(() => {
    if (queue.length === 0 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  }, [queue.length, onComplete]);

  const Exercise = current ? EXERCISES[current.type] : null;

  return (
    <div className="runner">
      <div className="runner-top">
        <button type="button" className="icon-btn" aria-label="Dersten çık" onClick={onExit}>
          <Icon name="close" size={22} />
        </button>
        <ProgressBar value={total === 0 ? 0 : (doneCount / total) * 100} tone="gradient" label="Ders ilerlemesi" />
        {costsHearts && (
          <span
            className={`runner-lives ${livesDelta ? `is-${livesDelta.dir}` : ""}`}
            aria-label={unlimited ? "Sınırsız can" : `${state.lives} can`}
          >
            <Icon name="heart" size={20} filled />
            {unlimited ? "∞" : state.lives}
          </span>
        )}
      </div>
      <div className="runner-body">
        {outOfHearts ? (
          <OutOfHearts onExit={onExit} />
        ) : Exercise ? (
          <Exercise key={current.key} ex={current} onResolve={resolve} onMistake={mistake} />
        ) : null}
      </div>
      {result && !outOfHearts && <Feedback result={result} onNext={next} />}
    </div>
  );
}
