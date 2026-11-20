// Sürüklenebilir, çevrilebilir kelime kartı.
// Sağa: biliyorum, sola: bilmiyorum, yukarı: emin değilim. Dokunmak kartı çevirir.
import { useEffect, useRef, useState } from "react";
import Icon from "../../components/Icon";
import SpeakButton from "../../components/SpeakButton";
import { TOPICS } from "../../data/topics";
import { escapeRegExp } from "../../lib/random";

const SWIPE_THRESHOLD = 100; // px: bu kadar sürüklenirse karar verilir
const TAP_TOLERANCE = 6; // px: bundan az hareket dokunma sayılır
const EXIT_MS = 220;
const STAMP_LABELS = { keep: "Biliyorum", discard: "Bilmiyorum", unsure: "Emin değilim" };

/** Uzun kelimelerde yazı boyutunu küçült. */
function wordFontSize(word, sizes = [40, 34, 28, 24, 20]) {
  const n = word.length;
  return n <= 7 ? sizes[0] : n <= 9 ? sizes[1] : n <= 11 ? sizes[2] : n <= 13 ? sizes[3] : sizes[4];
}
const translationFontSize = (tr) => (tr.length <= 10 ? 30 : tr.length <= 16 ? 25 : tr.length <= 24 ? 21 : 18);

/** Örnek cümlede kelimeyi kalın yazar. */
function HighlightedExample({ text, word }) {
  return text
    .split(new RegExp(`(\\b${escapeRegExp(word)}\\w*)`, "i"))
    .map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>));
}

function CardDecor({ topic }) {
  return (
    <>
      {topic && (
        <div className="card-tab" style={{ "--topic": topic.color }}>
          <Icon name={topic.icon} size={14} />
          {topic.label}
        </div>
      )}
      <div className="card-holes" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </>
  );
}

export default function SwipeCard({ word, isReview, isTop, exitDir, flipToken = 0, onDecide }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const start = useRef(null);
  const decided = useRef(false);
  const lastFlipToken = useRef(flipToken);

  const decide = (dir) => {
    if (decided.current) return;
    decided.current = true;
    setLeaving(dir);
    setTimeout(() => onDecide(dir), EXIT_MS);
  };

  // Düğmeler ya da klavye ile verilen karar.
  useEffect(() => {
    if (isTop && exitDir) decide(exitDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitDir, isTop]);

  // Boşluk / Enter ile çevirme.
  useEffect(() => {
    if (flipToken === lastFlipToken.current) return;
    lastFlipToken.current = flipToken;
    if (isTop) setFlipped((f) => !f);
  }, [flipToken, isTop]);

  const onPointerDown = (e) => {
    if (!isTop || leaving) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };

  const onPointerMove = (e) => {
    if (!drag.active) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  };

  const onPointerUp = () => {
    if (!drag.active) return;
    const { x, y } = drag;
    if (x > SWIPE_THRESHOLD) decide("keep");
    else if (x < -SWIPE_THRESHOLD) decide("discard");
    else if (y < -SWIPE_THRESHOLD) decide("unsure");
    else {
      if (Math.abs(x) < TAP_TOLERANCE && Math.abs(y) < TAP_TOLERANCE) setFlipped((f) => !f);
      setDrag({ x: 0, y: 0, active: false });
    }
  };

  const topic = TOPICS[word.topic];
  const hint = drag.x > 50 ? "keep" : drag.x < -50 ? "discard" : drag.y < -50 ? "unsure" : null;
  const stamp = leaving || hint;

  let x = drag.x;
  let y = drag.y;
  if (leaving === "keep") [x, y] = [520, drag.y * 0.3];
  if (leaving === "discard") [x, y] = [-520, drag.y * 0.3];
  if (leaving === "unsure") [x, y] = [0, -520];
  const rotate = Math.max(-18, Math.min(18, x / 18));

  return (
    <div
      className={`swipe-card ${isTop ? "is-top" : "is-behind"} ${drag.active ? "is-dragging" : ""} ${
        flipped ? "is-flipped" : ""
      }`}
      style={{
        transform: isTop ? `translate(${x}px, ${y}px) rotate(${rotate}deg)` : undefined,
        opacity: leaving ? 0 : 1,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden={!isTop}
      inert={!isTop}
    >
      <div className="card-flip">
        <div className="card-face card-face-front" aria-hidden={flipped} inert={flipped}>
          <CardDecor topic={topic} />
          <div className="card-top">
            {isReview && <span className="tag tag-review">Tekrar</span>}
            <span className="tag tag-pos">{word.pos}</span>
            <span className="tag tag-level">{word.level}</span>
            <SpeakButton text={word.word} className="card-speak" />
          </div>
          <h2 className="card-word" style={{ fontSize: wordFontSize(word.word) }}>
            {word.word}
          </h2>
          <p className="card-ipa">{word.phonetic}</p>
          <p className="card-hint">Anlamı için dokun</p>
        </div>

        <div className="card-face card-face-back" aria-hidden={!flipped} inert={!flipped}>
          <CardDecor topic={topic} />
          <div className="card-top">
            <span className="tag tag-tr">Türkçesi</span>
            <SpeakButton text={word.example} label="Örnek cümleyi dinle" className="card-speak" />
          </div>
          <h2 className="card-tr" style={{ fontSize: translationFontSize(word.tr) }}>
            {word.tr}
          </h2>
          <p className="card-def">{word.definition}</p>
          <p className="card-example">
            <HighlightedExample text={word.example} word={word.word} />
          </p>
          <p className="card-hint">Geri dönmek için dokun</p>
        </div>
      </div>
      {stamp && <div className={`stamp stamp-${stamp}`}>{STAMP_LABELS[stamp]}</div>}
    </div>
  );
}
