// İlk açılış akışı: karşılama -> amaç -> seviye testi -> hesap.
import { useMemo, useState } from "react";
import Feedback from "../../components/exercises/Feedback";
import { FillBlankExercise, TranslateExercise } from "../../components/exercises/ChoiceExercises";
import Icon from "../../components/Icon";
import Mascot from "../../components/Mascot";
import { Brand, Button, ProgressBar } from "../../components/ui";
import { GOALS } from "../../data/goals";
import { placementLevel, placementTest } from "../../lib/exercises";
import { useApp } from "../../state/AppContext";
import AuthForm from "./AuthForm";

const HERO_CARDS = [
  { word: "negotiate", ipa: "/nɪˈɡoʊʃieɪt/" },
  { word: "deadline", ipa: "/ˈdedlaɪn/" },
  { word: "receipt", ipa: "/rɪˈsiːt/" },
];

function Welcome({ onStart, onHaveAccount }) {
  return (
    <div className="welcome">
      <div className="welcome-hero" aria-hidden="true">
        {HERO_CARDS.map((c, i) => (
          <div key={c.word} className={`mini-card mini-card-${i}`}>
            <span className="mini-card-word">{c.word}</span>
            <span className="mini-card-ipa">{c.ipa}</span>
          </div>
        ))}
        <Mascot mood="wave" size={150} className="welcome-mascot" />
      </div>
      <div className="welcome-text">
        <Brand as="h1" className="welcome-brand" />
        <p className="welcome-title">Kelimeleri kaydır, öğren.</p>
        <p className="welcome-sub">
          Her gün birkaç dakikada İngilizce kelime hazneni büyüt. Bildiğini sağa, bilmediğini sola at.
        </p>
      </div>
      <div className="welcome-actions">
        <Button size="lg" block onClick={onStart}>
          Başla
        </Button>
        <Button size="lg" block variant="ghost" onClick={onHaveAccount}>
          Zaten hesabım var
        </Button>
      </div>
    </div>
  );
}

function GoalStep({ goal, onChange, onNext }) {
  return (
    <div className="step">
      <h1 className="step-title">Neden öğreniyorsun?</h1>
      <p className="step-sub">Sana uygun kelimelerden başlayalım.</p>
      <div className="goal-list" role="radiogroup" aria-label="Öğrenme amacı">
        {GOALS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={goal === g.id}
            className={`goal ${goal === g.id ? "is-selected" : ""}`}
            onClick={() => onChange(g.id)}
          >
            <span className="goal-icon">
              <Icon name={g.icon} size={22} />
            </span>
            <span className="goal-text">
              <strong>{g.label}</strong>
              <span>{g.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="step-footer">
        <Button size="lg" block disabled={!goal} onClick={onNext}>
          Devam
        </Button>
      </div>
    </div>
  );
}

/** Beş soruluk seviye testi. Cevaplar doğru/yanlış diye gösterilmez. */
function PlacementTest({ goal, onFinish }) {
  const { words, sfx } = useApp();
  const questions = useMemo(() => placementTest(goal, words), [goal, words]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const q = questions[index];

  const resolve = (r) => {
    setResult(r);
    sfx(r.correct ? "correct" : "wrong");
    if (r.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      onFinish(score, questions.length);
      return;
    }
    setResult(null);
    setIndex((i) => i + 1);
  };

  const Question = q.type === "translate" ? TranslateExercise : FillBlankExercise;
  return (
    <div className="step">
      <div className="placement-head">
        <span>
          Soru {index + 1} / {questions.length}
        </span>
        <ProgressBar value={((index + (result ? 1 : 0)) / questions.length) * 100} label="Test ilerlemesi" />
      </div>
      <div className="placement-body">
        <Question key={q.key} ex={q} onResolve={resolve} />
      </div>
      {result && <Feedback result={{ correct: true, neutral: true }} onNext={next} />}
    </div>
  );
}

const STEPS = ["goal", "test", "account"];

export default function Onboarding() {
  const { actions, account } = useApp();
  const [step, setStep] = useState("welcome"); // welcome | signin | goal | test | account
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);

  if (step === "welcome") {
    return (
      <div className="onboarding">
        <Welcome onStart={() => setStep("goal")} onHaveAccount={() => setStep("signin")} />
      </div>
    );
  }

  if (step === "signin") {
    return (
      <div className="onboarding">
        <AuthForm initialMode="signin" onBack={() => setStep("welcome")} />
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-top">
        {step === "goal" ? (
          <button type="button" className="icon-btn" aria-label="Geri" onClick={() => setStep("welcome")}>
            <Icon name="chevronLeft" size={22} />
          </button>
        ) : (
          <span className="icon-btn-spacer" />
        )}
        <ProgressBar value={((STEPS.indexOf(step) + 1) / STEPS.length) * 100} label="Kurulum adımları" />
      </div>

      {step === "goal" && (
        <GoalStep
          goal={goal}
          onChange={setGoal}
          onNext={() => {
            actions.setOnboarding(goal);
            setStep("test");
          }}
        />
      )}

      {step === "test" && (
        <PlacementTest
          goal={goal}
          onFinish={(score, total) => {
            const lvl = placementLevel(score, total);
            setLevel(lvl);
            actions.setOnboarding(goal, lvl);
            setStep("account");
          }}
        />
      )}

      {step === "account" && (
        <AuthForm
          initialMode="signup"
          goal={goal}
          level={level}
          onGuest={() => account.startGuest(goal, level)}
          levelNote={`Başlangıç seviyen ${level}. İlerlemeni kaybetmemek için hesap oluştur.`}
          onBack={() => setStep("goal")}
        />
      )}
    </div>
  );
}
