// Eşleşme bekleme: birkaç saniyede bir eşleşme dener, bulunca oda anahtarını alır.
import { useEffect, useRef, useState } from "react";
import Icon from "../../../components/Icon";
import Mascot from "../../../components/Mascot";
import { Button } from "../../../components/ui";
import { fetchRoomToken, findPartner, leaveQueue, upsertProfile } from "../../../lib/talk";
import { useApp } from "../../../state/AppContext";

const POLL_MS = 2500;
const QUIET_AFTER_S = 60;

const ERRORS = {
  not_configured: "Canlı konuşma sunucusu henüz ayarlanmamış.",
  call_not_available: "Görüşme başlatılamadı. Tekrar dene.",
  unauthorized: "Oturumun kapanmış görünüyor. Çıkış yapıp tekrar gir.",
};

export default function TalkWaiting({ level, onMatched, onSuspended, onCancel }) {
  const { state } = useApp();
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const matched = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer;
    matched.current = false;
    setError("");

    const tick = async () => {
      try {
        const match = await findPartner(level);
        if (!alive) return;
        if (match?.suspended) return onSuspended();
        if (match) {
          matched.current = true;
          const room = await fetchRoomToken(match.callId);
          if (alive) onMatched({ ...match, ...room });
          return;
        }
        timer = setTimeout(tick, POLL_MS);
      } catch (err) {
        if (alive) setError(ERRORS[err?.message] || "Bağlantı sorunu oldu. Tekrar dene.");
      }
    };

    upsertProfile(state.user.id, state.user.name, level)
      .then(() => alive && tick())
      .catch(() => alive && setError("Profilin kaydedilemedi. İnternet bağlantını kontrol et."));

    const clock = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(clock);
      if (!matched.current) leaveQueue().catch(() => {});
    };
    // Yeniden dene düğmesi `attempt`'i artırır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, attempt]);

  return (
    <div className="partner">
      <div className="partner-top">
        <button type="button" className="icon-btn" aria-label="Vazgeç" onClick={onCancel}>
          <Icon name="close" size={22} />
        </button>
        <h1 className="partner-title">Partner aranıyor</h1>
      </div>
      <div className="partner-scroll talk-waiting">
        <Mascot mood={error ? "sad" : "think"} size={110} />
        {error ? (
          <>
            <p>{error}</p>
            <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
              Tekrar dene
            </Button>
          </>
        ) : (
          <>
            <span className="spinner spinner-lg" role="status" aria-label="Aranıyor" />
            <p>
              Seviyene yakın biri aranıyor… <strong>{seconds} sn</strong>
            </p>
            {seconds >= QUIET_AFTER_S && (
              <p className="talk-hint">Şu an çevrimiçi az kişi var. Beklemeye devam edebilir ya da sonra deneyebilirsin.</p>
            )}
          </>
        )}
      </div>
      <div className="partner-footer">
        <Button size="lg" block variant="ghost" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
