import React, { useRef, useState } from "react";

export function SwipeCard({ item, onResult, isTop }) {
  const cardRef = useRef(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [flyOut, setFlyOut] = useState(null);
  const start = useRef({ x: 0, y: 0 });

  const handleDown = (e) => {
    if (!isTop) return;
    const p = e.touches ? e.touches[0] : e;
    start.current = { x: p.clientX, y: p.clientY };
    setDrag((d) => ({ ...d, active: true }));
  };

  const handleMove = (e) => {
    if (!drag.active) return;
    const p = e.touches ? e.touches[0] : e;
    setDrag((d) => ({ ...d, x: p.clientX - start.current.x, y: p.clientY - start.current.y }));
  };

  const resolve = (dir) => {
    const distance = { discard: -600, keep: 600, unsure: 0 };
    const yDist = dir === "unsure" ? -600 : drag.y * 2;
    setFlyOut({ x: distance[dir], y: dir === "unsure" ? -600 : yDist * 0.2 });
    setDrag((d) => ({ ...d, active: false }));
    setTimeout(() => onResult(dir), 220);
  };

  const handleUp = () => {
    if (!drag.active) return;
    const { x, y } = drag;
    setDrag((d) => ({ ...d, active: false }));
    if (x < -110) return resolve("discard");
    if (x > 110) return resolve("keep");
    if (y < -110) return resolve("unsure");
    setDrag({ x: 0, y: 0, active: false });
  };

  const rotate = (flyOut ? flyOut.x : drag.x) / 18;
  const tx = flyOut ? flyOut.x : drag.x;
  const ty = flyOut ? flyOut.y : drag.y;
  const opacity = flyOut ? 0 : 1;

  const dirHint =
    drag.x > 50 ? "keep" : drag.x < -50 ? "discard" : drag.y < -50 ? "unsure" : null;

  return (
    <div
      ref={cardRef}
      className="sv-card"
      style={{
        transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
        transition: drag.active ? "none" : "transform 0.35s cubic-bezier(.2,.8,.3,1), opacity 0.35s",
        opacity,
        zIndex: isTop ? 5 : 1,
        cursor: isTop ? "grab" : "default",
      }}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchMove={handleMove}
      onTouchEnd={handleUp}
    >
      <div className="sv-card-holes">
        <span /><span /><span />
      </div>

      {dirHint && (
        <div className={`sv-stamp sv-stamp-${dirHint}`}>
          {dirHint === "keep" ? "BİLİYORUM" : dirHint === "discard" ? "BİLMİYORUM" : "EMİN DEĞİLİM"}
        </div>
      )}

      <div className="sv-card-top">
        {item.isReview && <span className="sv-review-tag">🔁 tekrar</span>}
        <span className="sv-pos-tag">{item.pos}</span>
        <span className="sv-level-tag">{item.level}</span>
        <button
          className="sv-speak-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            try {
              const u = new SpeechSynthesisUtterance(item.word);
              u.lang = "en-US";
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(u);
            } catch (err) { /* konuşma sentezi desteklenmiyor olabilir */ }
          }}
        >
          🔊
        </button>
      </div>
      <h2 className="sv-word">{item.word}</h2>
      <p className="sv-phonetic">{item.phonetic}</p>
    </div>
  );
}

