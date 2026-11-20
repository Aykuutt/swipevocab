import { useEffect, useRef } from "react";
import Icon from "../../../components/Icon";
import { Button, EmptyState } from "../../../components/ui";
import { XP } from "../../../config";
import { formatMinutes } from "../../../lib/time";
import { useApp } from "../../../state/AppContext";

/** Sohbet özeti: süre, mesaj sayısı, kullanılan kelimeler ve ipuçları. Puanı bir kez verir. */
export default function PartnerSummary({ result, onAgain, onClose }) {
  const { actions } = useApp();
  const points = result.userCount * XP.partnerTurn + result.used.length * XP.partnerWord;
  const awarded = useRef(false);

  useEffect(() => {
    if (awarded.current || points <= 0) return;
    awarded.current = true;
    actions.awardXp(points);
  }, [points, actions]);

  const good = result.userCount >= 3;

  return (
    <div className="partner">
      <div className="partner-scroll partner-summary">
        <EmptyState
          celebrate={good}
          mascot={good ? "cheer" : "happy"}
          title={good ? "Güzel konuştun" : "Konuşma bitti"}
          actions={
            <>
              <Button size="lg" block onClick={onAgain}>
                Yeni konuşma
              </Button>
              <Button variant="ghost" block onClick={onClose}>
                Kapat
              </Button>
            </>
          }
        >
          <ul className="done-stats">
            <li>
              <strong>{formatMinutes(result.seconds)}</strong>
              <span>süre</span>
            </li>
            <li>
              <strong>{result.userCount}</strong>
              <span>mesaj</span>
            </li>
            <li>
              <strong>+{points}</strong>
              <span>puan</span>
            </li>
          </ul>
        </EmptyState>

        <h2 className="group-title">
          Çalışma kelimeleri ({result.used.length}/{result.practiceWords.length})
        </h2>
        <ul className="practice-words practice-words-wrap">
          {result.practiceWords.map((w) => {
            const isUsed = result.used.some((u) => u.id === w.id);
            return (
              <li key={w.id} className={isUsed ? "is-used" : ""}>
                {isUsed && <Icon name="check" size={13} />}
                {w.word}
              </li>
            );
          })}
        </ul>

        {result.tips.length > 0 && (
          <>
            <h2 className="group-title">Dikkat edilecekler</h2>
            <ul className="tip-list">
              {result.tips.slice(0, 4).map((t, i) => (
                <li key={i}>
                  <q>{t.said}</q>
                  <span>{t.tip}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
