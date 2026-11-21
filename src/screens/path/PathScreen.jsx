// "Yol" sekmesi: üniteler sırayla açılır, her ünite kısa bir derstir.
import { useMemo, useState } from "react";
import ExerciseRunner from "../../components/exercises/ExerciseRunner";
import HeartTimer from "../../components/HeartTimer";
import Icon from "../../components/Icon";
import { Button, EmptyState, Overlay, ProgressBar } from "../../components/ui";
import { XP } from "../../config";
import { TOPICS } from "../../data/topics";
import { unitLesson } from "../../lib/exercises";
import { useApp } from "../../state/AppContext";
import { currentUnitIndex, hasUnlimitedLives } from "../../state/selectors";
import PathMap from "./PathMap";

export default function PathScreen() {
  const { state, units, words, wordsById, actions, openVillage } = useApp();
  const [lesson, setLesson] = useState(null); // { unit }
  const [finished, setFinished] = useState(null); // { unit, next, firstTime }
  const [run, setRun] = useState(0);
  const [celebrate, setCelebrate] = useState(null); // { done, unlocked }

  const completed = state.completedUnits;
  const current = units[currentUnitIndex(units, completed)];
  const allDone = units.length > 0 && completed.length >= units.length;

  const start = (unit) => {
    setRun((n) => n + 1);
    setLesson({ unit });
  };

  const exercises = useMemo(() => {
    if (!lesson) return [];
    const unitWords = lesson.unit.wordIds.map((id) => wordsById.get(id)).filter(Boolean);
    return unitLesson(unitWords, words);
    // Her başlatmada yeni soru seti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, run]);

  const complete = () => {
    const unit = lesson.unit;
    const index = units.findIndex((u) => u.id === unit.id);
    const firstTime = !completed.includes(unit.id);
    actions.completeUnit(unit.id, unit.wordIds);
    setFinished({ unit, next: firstTime ? units[index + 1] : null, firstTime });
    setCelebrate(null);
    setLesson(null);
  };

  if (units.length === 0) return null;

  const topic = TOPICS[current.topic];
  const outOfLives = !hasUnlimitedLives(state) && state.lives <= 0;

  return (
    <div className="screen screen-path">
      <div className="path-banner" style={{ "--topic": topic.color }}>
        <div className="path-banner-icon">
          <Icon name={topic.icon} size={22} />
        </div>
        <div className="path-banner-text">
          <strong>{allDone ? "Tüm üniteler tamam" : current.title}</strong>
          <span>
            {allDone
              ? "Dilediğin üniteyi tekrar edebilirsin"
              : `${current.wordIds.length} kelime, ${current.levels.join(" - ")}`}
          </span>
        </div>
        {!allDone && (
          <Button size="sm" onClick={() => start(current)}>
            Başla
          </Button>
        )}
        <div className="path-banner-progress">
          <ProgressBar value={(completed.length / units.length) * 100} label="Üniteler" />
          <span>
            {completed.length} / {units.length} ünite
          </span>
        </div>
      </div>

      {outOfLives && (
        <div className="notice notice-coral">
          <Icon name="heartBroken" size={18} />
          <p>
            Canların bitti. Bir sonraki can <HeartTimer className="inline" /> sonra gelecek.
          </p>
          <Button size="sm" variant="secondary" onClick={() => openVillage("market")}>
            Pazar
          </Button>
        </div>
      )}

      <PathMap units={units} completed={completed} onStart={start} celebrate={celebrate} />

      {lesson && (
        <Overlay label={lesson.unit.title}>
          <ExerciseRunner
            key={`${lesson.unit.id}-${run}`}
            exercises={exercises}
            onComplete={complete}
            onExit={() => setLesson(null)}
          />
        </Overlay>
      )}

      {finished && (
        <Overlay label="Ünite tamamlandı">
          <div className="runner-complete">
            <EmptyState
              celebrate
              mascot="cheer"
              title="Ünite tamamlandı"
              actions={
                <Button
                  size="lg"
                  block
                  onClick={() => {
                    setCelebrate({ done: finished.unit.id, unlocked: finished.next?.id ?? null });
                    setFinished(null);
                  }}
                >
                  Yola dön
                </Button>
              }
            >
              <p>
                <strong>{finished.unit.title}</strong> bitti.{" "}
                {finished.firstTime ? `+${XP.unit} puan kazandın.` : `Tekrar için +${XP.unitReplay} puan kazandın.`}
              </p>
              {finished.next && (
                <p>
                  Sıradaki ünite açıldı: <strong>{finished.next.title}</strong>
                </p>
              )}
            </EmptyState>
          </div>
        </Overlay>
      )}
    </div>
  );
}
