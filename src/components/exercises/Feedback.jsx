import Mascot from "../Mascot";
import { Button } from "../ui";

/** Cevap sonrası alt şerit: doğru / yanlış / nötr ve "Devam" düğmesi. */
export default function Feedback({ result, onNext }) {
  const kind = result.neutral ? "neutral" : result.correct ? "correct" : "wrong";
  return (
    <div className={`feedback feedback-${kind}`} role="status" aria-live="polite">
      {kind !== "neutral" && (
        <div className="feedback-text">
          <Mascot key={kind} mood={kind === "correct" ? "happy" : "sad"} size={60} className="feedback-mascot" />
          <div>
            <strong>{kind === "correct" ? result.message || "Doğru!" : "Yanlış"}</strong>
            {kind === "wrong" && result.answerText && (
              <span className="feedback-answer">
                Doğrusu: <b>{result.answerText}</b>
              </span>
            )}
          </div>
        </div>
      )}
      <Button className="feedback-next" variant={kind === "wrong" ? "danger" : "success"} onClick={onNext} autoFocus>
        Devam
      </Button>
    </div>
  );
}
