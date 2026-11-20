// Çoktan seçmeli alıştırmalar: çeviri ve boşluk doldurma.
import { useState } from "react";
import SpeakButton from "../SpeakButton";

function Options({ options, picked, correct, onPick }) {
  const answered = picked !== null;
  return (
    <div className="options" role="group" aria-label="Cevap seçenekleri">
      {options.map((text, i) => {
        let tone = "";
        if (answered) tone = i === correct ? "is-correct" : i === picked ? "is-wrong" : "is-dim";
        return (
          <button key={i} type="button" className={`option ${tone}`} disabled={answered} onClick={() => onPick(i)}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

/** Seçimi bir kez kabul eder ve sonucu bildirir. */
function useSinglePick(ex, onResolve) {
  const [picked, setPicked] = useState(null);
  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    onResolve({ correct: i === ex.correct, answerText: ex.options[ex.correct] });
  };
  return [picked, pick];
}

export function TranslateExercise({ ex, onResolve }) {
  const [picked, pick] = useSinglePick(ex, onResolve);
  return (
    <div className="exercise">
      <h2 className="exercise-prompt">Türkçe karşılığı nedir?</h2>
      <div className="ask-word">
        <SpeakButton text={ex.word.word} />
        <span className="ask-word-text">{ex.word.word}</span>
        <span className="ask-word-ipa">{ex.word.phonetic}</span>
      </div>
      <Options options={ex.options} picked={picked} correct={ex.correct} onPick={pick} />
    </div>
  );
}

export function FillBlankExercise({ ex, onResolve }) {
  const [picked, pick] = useSinglePick(ex, onResolve);
  const [before, after] = ex.blanked.split("____");
  const tone = picked === null ? "" : picked === ex.correct ? "is-correct" : "is-wrong";
  return (
    <div className="exercise">
      <h2 className="exercise-prompt">Boşluğa hangi kelime gelmeli?</h2>
      <p className="sentence-card">
        {before}
        <span className={`blank ${tone}`} {...(picked === null ? { role: "img", "aria-label": "boşluk" } : {})}>
          {picked === null ? "" : ex.options[picked]}
        </span>
        {after}
      </p>
      <Options options={ex.options} picked={picked} correct={ex.correct} onPick={pick} />
    </div>
  );
}
