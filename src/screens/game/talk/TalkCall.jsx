// Canlı sesli görüşme: soru kartları, kelime bingosu, sessize alma, şikayet ve bitirme.
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../../components/Icon";
import Mascot from "../../../components/Mascot";
import { Button } from "../../../components/ui";
import { useVoiceRoom } from "../../../hooks/useVoiceRoom";
import { blockUser, cardsForCall, endCall, reportUser } from "../../../lib/talk";
import { formatMinutes } from "../../../lib/time";
import { useApp } from "../../../state/AppContext";
import ReportPanel from "./ReportPanel";

const NO_SHOW_MS = 25_000; // partner bu sürede gelmezse yeni partner öner

const ERRORS = {
  mic_denied: "Mikrofon izni verilmedi. Tarayıcının adres çubuğundaki kilit simgesinden mikrofona izin verip tekrar dene.",
  connect_failed: "Görüşmeye bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.",
};

export default function TalkCall({ match, level, onFinish, onFindAnother }) {
  const { state, words } = useApp();
  const room = useVoiceRoom({ url: match.url, token: match.token });
  const { prompts, targetWords } = useMemo(
    () => cardsForCall(match.callId, words, level, match.partnerLevel),
    [match.callId, words, level, match.partnerLevel]
  );

  const [promptIndex, setPromptIndex] = useState(0);
  const [showTr, setShowTr] = useState(false);
  const [used, setUsed] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [noShow, setNoShow] = useState(false);
  const [reporting, setReporting] = useState(false);
  const metPartner = useRef(false);
  const finished = useRef(false);

  // Süre, partner odaya girdiğinde başlar.
  useEffect(() => {
    if (room.partnerHere) metPartner.current = true;
    if (!room.partnerHere || room.status !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [room.partnerHere, room.status]);

  useEffect(() => {
    if (room.status !== "connected" || room.partnerHere || metPartner.current) return;
    const t = setTimeout(() => setNoShow(true), NO_SHOW_MS);
    return () => clearTimeout(t);
  }, [room.status, room.partnerHere]);

  // Görüşmeden çıkılırsa sunucuda bitmiş olarak işaretle.
  useEffect(() => () => void endCall(match.callId).catch(() => {}), [match.callId]);

  const finish = (extra = {}) => {
    if (finished.current) return;
    finished.current = true;
    room.leave();
    endCall(match.callId).catch(() => {});
    onFinish({
      partnerId: match.partnerId,
      partnerName: match.partnerName,
      callId: match.callId,
      seconds,
      targetWords,
      used,
      met: metPartner.current,
      ...extra,
    });
  };

  const report = async (reason) => {
    await reportUser(state.user.id, match.partnerId, match.callId, reason);
    await blockUser(state.user.id, match.partnerId);
    finish({ reported: true, blocked: true });
  };

  const toggleWord = (id) => setUsed((u) => (u.includes(id) ? u.filter((x) => x !== id) : [...u, id]));
  const prompt = prompts[promptIndex % prompts.length];

  if (room.status === "error") {
    return (
      <div className="partner">
        <div className="partner-scroll talk-waiting">
          <Mascot mood="sad" size={100} />
          <p>{ERRORS[room.error] || ERRORS.connect_failed}</p>
          <Button onClick={() => finish()}>Tamam</Button>
        </div>
      </div>
    );
  }

  const status =
    room.status === "connecting"
      ? "Bağlanılıyor…"
      : room.partnerLeft
        ? "Partner ayrıldı"
        : !room.partnerHere
          ? "Partner bekleniyor…"
          : room.speaking.partner
            ? "Konuşuyor…"
            : room.speaking.me
              ? "Seni dinliyor"
              : "Bağlı";

  return (
    <div className="partner">
      <div className="partner-top">
        <h1 className="partner-title">{match.partnerName}</h1>
        <span className="talk-timer">{formatMinutes(seconds)}</span>
        <button
          type="button"
          className="icon-btn"
          aria-label="Şikayet et"
          title="Şikayet et"
          onClick={() => setReporting(true)}
        >
          <Icon name="info" size={20} />
        </button>
      </div>

      <div className="partner-status">
        <Mascot mood={room.partnerLeft ? "sad" : "happy"} size={56} talking={room.speaking.partner} />
        <div>
          <strong>{status}</strong>
          <span>{match.partnerLevel ? `Seviye ${match.partnerLevel}` : "Sesli görüşme"}</span>
        </div>
      </div>

      <div className="partner-scroll">
        {room.needsAudioStart && (
          <div className="notice notice-violet">
            <Icon name="speaker" size={18} />
            <p>Tarayıcı sesi engelledi.</p>
            <Button size="sm" variant="secondary" onClick={room.startAudio}>
              Sesi aç
            </Button>
          </div>
        )}
        {noShow && !room.partnerHere && (
          <div className="notice notice-coral">
            <Icon name="info" size={18} />
            <p>Partner bağlanamadı.</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                finished.current = true;
                room.leave();
                endCall(match.callId).catch(() => {});
                onFindAnother();
              }}
            >
              Yeni partner
            </Button>
          </div>
        )}

        <section className="talk-card" aria-live="polite">
          <span className="talk-card-label">
            Soru {(promptIndex % prompts.length) + 1} / {prompts.length}
          </span>
          <p className="talk-card-en">{prompt.en}</p>
          {showTr && <p className="talk-card-tr">{prompt.tr}</p>}
          <div className="talk-card-actions">
            <button type="button" className="link-btn" onClick={() => setShowTr((v) => !v)}>
              {showTr ? "Türkçeyi gizle" : "Türkçesi"}
            </button>
            <Button size="sm" variant="secondary" onClick={() => setPromptIndex((i) => i + 1)}>
              Sonraki soru
            </Button>
          </div>
        </section>

        <h2 className="group-title">
          Hedef kelimeler ({used.length}/{targetWords.length})
        </h2>
        <p className="talk-hint">Konuşurken kullandığın kelimeye dokun.</p>
        <ul className="talk-words">
          {targetWords.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                className={`talk-word ${used.includes(w.id) ? "is-used" : ""}`}
                aria-pressed={used.includes(w.id)}
                onClick={() => toggleWord(w.id)}
              >
                {used.includes(w.id) && <Icon name="check" size={13} />}
                <strong>{w.word}</strong>
                <span>{w.tr}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="talk-controls">
        <button
          type="button"
          className={`round-btn ${room.muted ? "tone-coral" : "tone-mint"}`}
          aria-label={room.muted ? "Mikrofonu aç" : "Sessize al"}
          aria-pressed={room.muted}
          disabled={room.status !== "connected"}
          onClick={room.toggleMute}
        >
          <Icon name={room.muted ? "close" : "mic"} size={24} />
        </button>
        <Button size="lg" variant="danger" onClick={() => finish()}>
          Görüşmeyi bitir
        </Button>
      </div>

      {reporting && (
        <ReportPanel partnerName={match.partnerName} onSubmit={report} onCancel={() => setReporting(false)} />
      )}
    </div>
  );
}
