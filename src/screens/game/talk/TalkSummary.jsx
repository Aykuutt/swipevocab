import { useEffect, useRef, useState } from "react";
import Icon from "../../../components/Icon";
import { Button, EmptyState } from "../../../components/ui";
import { XP } from "../../../config";
import { blockUser } from "../../../lib/talk";
import { formatMinutes } from "../../../lib/time";
import { useApp } from "../../../state/AppContext";

/** Puan: konuşulan her tam dakika (en fazla 6) ve kullanılan her hedef kelime. */
export function talkPoints(result) {
  if (!result.met) return 0;
  const minutes = Math.min(Math.floor(result.seconds / 60), XP.talkMinuteCap);
  return minutes * XP.talkMinute + result.used.length * XP.partnerWord;
}

export default function TalkSummary({ result, onAgain, onClose }) {
  const { state, actions } = useApp();
  const points = talkPoints(result);
  const awarded = useRef(false);
  const [blocked, setBlocked] = useState(!!result.blocked);
  const [blockError, setBlockError] = useState("");

  useEffect(() => {
    if (awarded.current || points <= 0) return;
    awarded.current = true;
    actions.awardXp(points);
  }, [points, actions]);

  const good = result.met && result.seconds >= 120;

  return (
    <div className="partner">
      <div className="partner-scroll partner-summary">
        <EmptyState
          celebrate={good}
          mascot={good ? "cheer" : result.met ? "happy" : "think"}
          title={result.reported ? "Şikayetin alındı" : good ? "Harika konuştun" : "Görüşme bitti"}
          actions={
            <>
              <Button size="lg" block icon="mic" onClick={onAgain}>
                Yeni partner bul
              </Button>
              <Button variant="ghost" block onClick={onClose}>
                Kapat
              </Button>
            </>
          }
        >
          {result.reported && <p>Bu kişiyle bir daha eşleşmeyeceksin. Teşekkürler, topluluğu güvenli tutmaya yardım ettin.</p>}
          <ul className="done-stats">
            <li>
              <strong>{formatMinutes(result.seconds)}</strong>
              <span>süre</span>
            </li>
            <li>
              <strong>
                {result.used.length}/{result.targetWords.length}
              </strong>
              <span>hedef kelime</span>
            </li>
            <li>
              <strong>+{points}</strong>
              <span>puan</span>
            </li>
          </ul>
        </EmptyState>

        <ul className="practice-words practice-words-wrap">
          {result.targetWords.map((w) => {
            const isUsed = result.used.includes(w.id);
            return (
              <li key={w.id} className={isUsed ? "is-used" : ""}>
                {isUsed && <Icon name="check" size={13} />}
                {w.word}
              </li>
            );
          })}
        </ul>

        {result.met && !blocked && (
          <p className="empty-link-row">
            <button
              type="button"
              className="link-btn"
              onClick={async () => {
                try {
                  await blockUser(state.user.id, result.partnerId);
                  setBlocked(true);
                } catch {
                  setBlockError("Engellenemedi, tekrar dene.");
                }
              }}
            >
              {result.partnerName} ile bir daha eşleşme
            </button>
          </p>
        )}
        {blocked && !result.reported && <p className="talk-hint">{result.partnerName} engellendi.</p>}
        {blockError && <p className="form-error">{blockError}</p>}
      </div>
    </div>
  );
}
