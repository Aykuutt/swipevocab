import React, { useState } from "react";
import { GOALS } from "../data/goals.js";
import { buildPlacementQuestions } from "../utils/placement.js";

export function OnboardingFlow({ onFinish }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [formName, setFormName] = useState("");

  const steps = ["goal", "test", "account"];
  const stepName = steps[step];
  const currentQuestion = questions[qIndex];
  const selectedAnswer = answers[qIndex] ?? null;
  const correctCount = answers.reduce(
    (count, answer, index) => count + (answer === questions[index]?.correct ? 1 : 0),
    0,
  );
  const level = (() => {
    const levels = ["A1", "A2", "B1", "B2", "C1"];
    let attained = "A1";
    for (const currentLevel of levels) {
      const indexes = questions.flatMap((question, index) => question.level === currentLevel ? [index] : []);
      if (indexes.length === 0) break;
      const correctAtLevel = indexes.filter((index) => answers[index] === questions[index].correct).length;
      if (correctAtLevel < Math.ceil(indexes.length / 2)) break;
      attained = currentLevel;
    }
    return attained;
  })();

  const startTest = () => {
    const nextQuestions = buildPlacementQuestions(goal);
    setQuestions(nextQuestions);
    setQIndex(0);
    setAnswers(Array(nextQuestions.length).fill(null));
    setStep(1);
  };

  const goBack = () => {
    if (stepName === "test" && qIndex > 0) {
      setQIndex((index) => index - 1);
    } else if (step > 0) {
      setStep((current) => current - 1);
      if (stepName === "account") setQIndex(Math.max(questions.length - 1, 0));
    }
  };

  const goForward = () => {
    if (stepName === "goal") {
      if (goal) startTest();
    } else if (stepName === "test" && selectedAnswer !== null) {
      if (qIndex < questions.length - 1) setQIndex((index) => index + 1);
      else setStep(2);
    }
  };

  return (
    <div className="sv-onb">
      <div className="sv-onb-progress">
        {steps.map((_, i) => (
          <div key={i} className={`sv-onb-dot ${i <= step ? "filled" : ""}`} />
        ))}
      </div>

      {stepName === "goal" && (
        <div className="sv-onb-step">
          <h2 className="sv-onb-title">Neden öğreniyorsun?</h2>
          <p className="sv-onb-sub">Sana en uygun içeriği önerelim.</p>
          <div className="sv-onb-options">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`sv-onb-option ${goal === g.id ? "selected" : ""}`}
                onClick={() => setGoal(g.id)}
              >
                <span>{g.icon}</span> {g.label}
              </button>
            ))}
          </div>
          <div className="sv-onb-nav sv-onb-nav-end">
            <button className="sv-onb-back" type="button" disabled>Geri</button>
            <button className="sv-cta sv-onb-cta" type="button" disabled={!goal} onClick={goForward}>
              Devam et
            </button>
          </div>
        </div>
      )}

      {stepName === "test" && currentQuestion && (
        <div className="sv-onb-step">
          <p className="sv-onb-counter">10 soruluk seviye testi · {qIndex + 1} / {questions.length}</p>
          <h2 className="sv-onb-title" style={{ fontSize: 20 }}>
            {currentQuestion.type === "translate"
              ? `"${currentQuestion.word}" kelimesinin anlamı nedir?`
              : "Cümledeki boşluğa hangi kelime gelmeli?"}
          </h2>
          {currentQuestion.type === "fill_blank" && (
            <p className="sv-onb-sentence">"{currentQuestion.sentence}"</p>
          )}
          <div className="sv-onb-options">
            {currentQuestion.options.map((opt, i) => {
              let cls = "sv-onb-option";
              if (selectedAnswer !== null) {
                if (i === currentQuestion.correct) cls += " selected";
                else if (i === selectedAnswer) cls += " wrong-onb";
              }
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  aria-pressed={selectedAnswer === i}
                  onClick={() => setAnswers((current) => current.map((answer, index) => index === qIndex ? i : answer))}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="sv-onb-nav">
            <button className="sv-onb-back" type="button" onClick={goBack}>
              Geri
            </button>
            <button className="sv-cta sv-onb-cta" type="button" disabled={selectedAnswer === null} onClick={goForward}>
              {qIndex === questions.length - 1 ? "Sonucu gör" : "Sonraki soru"}
            </button>
          </div>
        </div>
      )}

      {stepName === "account" && (
        <div className="sv-onb-step sv-onb-account">
          <div className="sv-onb-badge">🔥</div>
          <h2 className="sv-onb-title">Harika gidiyorsun!</h2>
          <p className="sv-onb-sub">İlerlemen bu cihazda saklanacak. İstersen adını ekle.</p>
          <div className="sv-dash-grid" style={{ margin: "20px 0" }}>
            <div className="sv-dash-card">
              <div className="sv-dash-num">{correctCount}/{questions.length}</div>
              <div className="sv-dash-label">doğru cevap</div>
            </div>
            <div className="sv-dash-card">
              <div className="sv-dash-num">{level}</div>
              <div className="sv-dash-label">seviyen belirlendi</div>
            </div>
          </div>
          <label className="sv-field-label" style={{ marginTop: 6 }}>Ad (isteğe bağlı)</label>
          <input className="sv-input" style={{ width: "100%" }} value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Adın" />
          <div className="sv-onb-nav">
            <button className="sv-onb-back" type="button" onClick={goBack}>Geri</button>
            <button className="sv-cta sv-onb-cta" type="button" onClick={() => onFinish(formName.trim() || "Sen", goal, level)}>
              Uygulamaya başla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

