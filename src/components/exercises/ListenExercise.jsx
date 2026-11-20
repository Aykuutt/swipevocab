import { useCallback, useEffect, useRef, useState } from "react";
import { speakAlong, stopSpeaking } from "../../lib/speech";
import { Button } from "../ui";

/** Örnek cümleyi okur ve okunan kelimeyi vurgular. Puan etkisi yoktur. */
export default function ListenExercise({ ex, onResolve }) {
  const sentence = ex.word.example;
  const words = sentence.split(" ");
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const cancel = useRef(null);
  const resolved = useRef(false);

  const play = useCallback(() => {
    cancel.current?.();
    setActive(-1);
    setPlaying(true);
    cancel.current = speakAlong(sentence, {
      onWord: setActive,
      onEnd: () => {
        setPlaying(false);
        setActive(-1);
        if (!resolved.current) {
          resolved.current = true;
          onResolve({ correct: true, neutral: true });
        }
      },
    });
  }, [sentence, onResolve]);

  useEffect(() => {
    play();
    return () => {
      cancel.current?.();
      stopSpeaking();
    };
    // Yalnızca ilk açılışta otomatik oynat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="exercise">
      <h2 className="exercise-prompt">Cümleyi dinle ve takip et</h2>
      <p className="sentence-card sentence-listen" aria-live="off">
        {words.map((w, i) => (
          <span key={i} className={`listen-word ${i === active ? "is-active" : ""}`}>
            {w}{" "}
          </span>
        ))}
      </p>
      <Button variant="secondary" icon="replay" onClick={play} disabled={playing}>
        Bir daha dinle
      </Button>
    </div>
  );
}
