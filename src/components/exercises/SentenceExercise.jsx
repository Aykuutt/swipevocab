// "Cümleyi kur": Dilbaz konuşma balonunda örnek cümleyi sesli okur, öğrenci Türkçesini alttaki kelime
// kutucuklarından kurar. Kutucuğa dokununca cevaba geçer ya da geri döner; sürükleyerek de yerleştirilir
// ve cevaptaki sıra değiştirilir. Tek kelime yanlışsa bir kez "Çok yaklaştın!" deyip tekrar denetir.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sentenceDistance } from "../../lib/exercises";
import { speak, stopSpeaking } from "../../lib/speech";
import Icon from "../Icon";
import Mascot from "../Mascot";
import { Button } from "../ui";

const DRAG_START = 6; // px: bu kadar kıpırdamadan sürükleme sayılmaz, dokunma sayılır

/** Bırakılan noktaya göre cevap satırındaki yeni sıra. */
function dropIndex(zone, x, y, draggedId) {
  const els = [...zone.querySelectorAll("[data-tile]")].filter((el) => Number(el.dataset.tile) !== draggedId);
  for (let i = 0; i < els.length; i++) {
    const r = els[i].getBoundingClientRect();
    if (y < r.top) return i; // üst satırdayız
    if (y <= r.bottom && x < r.left + r.width / 2) return i;
  }
  return els.length;
}

const inside = (el, x, y, pad = 24) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
};

export default function SentenceExercise({ ex, onResolve }) {
  const { word, tiles, answer } = ex;
  const [picked, setPicked] = useState([]); // kutucuk id'leri, cevaptaki sırayla
  const [nearUsed, setNearUsed] = useState(false);
  const [note, setNote] = useState(null);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(null); // { id, x, y, w, h }
  const pointer = useRef(null); // { id, from, startX, startY, offX, offY, dragging }
  const zone = useRef(null);
  const textOf = (id) => tiles[id].text;

  useEffect(() => {
    const timer = setTimeout(() => speak(word.example), 400);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [word.example]);

  const change = (next) => {
    setPicked(next);
    setNote(null);
  };
  const toggle = (id) => change(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);

  const onPointerDown = (e, id, from) => {
    if (done || e.button > 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = { id, from, startX: e.clientX, startY: e.clientY, offX: e.clientX - r.left, offY: e.clientY - r.top, w: r.width, h: r.height, dragging: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const p = pointer.current;
    if (!p) return;
    if (!p.dragging && Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < DRAG_START) return;
    p.dragging = true;
    setDrag({ id: p.id, x: e.clientX - p.offX, y: e.clientY - p.offY, w: p.w, h: p.h });
  };

  const onPointerUp = (e) => {
    const p = pointer.current;
    pointer.current = null;
    if (!p) return;
    setDrag(null);
    if (!p.dragging) return toggle(p.id);
    if (inside(zone.current, e.clientX, e.clientY)) {
      const rest = picked.filter((id) => id !== p.id);
      const at = dropIndex(zone.current, e.clientX, e.clientY, p.id);
      change([...rest.slice(0, at), p.id, ...rest.slice(at)]);
    } else if (p.from === "answer") {
      change(picked.filter((id) => id !== p.id));
    }
  };

  const onPointerCancel = () => {
    pointer.current = null;
    setDrag(null);
  };

  const check = () => {
    if (done || picked.length === 0) return;
    const distance = sentenceDistance(picked.map(textOf), answer);
    if (distance === 0) {
      setDone(true);
      onResolve({ correct: true, message: nearUsed ? "Doğru, bu sefer tam oldu!" : undefined });
      return;
    }
    if (distance === 1 && !nearUsed) {
      setNearUsed(true);
      setNote("Çok yaklaştın! Sadece bir kelime yanlış, bir daha dene.");
      speak(word.example, 0.7);
      return;
    }
    setDone(true);
    onResolve({ correct: false, answerText: word.exampleTr });
  };

  const tileProps = (id, from) => ({
    "data-tile": from === "answer" ? id : undefined,
    type: "button",
    disabled: done,
    className: `build-tile ${drag?.id === id ? "is-dragging" : ""}`,
    onPointerDown: (e) => onPointerDown(e, id, from),
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(id);
      }
    },
  });

  return (
    <div className="exercise build">
      <h2 className="exercise-prompt">Dilbaz ne diyor? Türkçesini kur</h2>

      <div className="build-speaker">
        <Mascot mood="wave" size={78} className="build-mascot" />
        <div className="build-bubble">
          <button type="button" className="build-play" aria-label="Cümleyi dinle" onClick={() => speak(word.example)}>
            <Icon name="speaker" size={20} />
          </button>
          <button type="button" className="build-slow" aria-label="Yavaş dinle" onClick={() => speak(word.example, 0.55)}>
            <Icon name="replay" size={14} />
          </button>
          <p lang="en">{word.example}</p>
        </div>
      </div>

      <div ref={zone} className={`build-answer ${note ? "is-near" : ""}`} aria-label="Cevabın">
        {picked.map((id) => (
          <button key={id} {...tileProps(id, "answer")} aria-label={`${textOf(id)}, çıkarmak için dokun`}>
            {textOf(id)}
          </button>
        ))}
      </div>
      {note && (
        <p className="dictation-note is-near" role="status">
          {note}
        </p>
      )}

      <div className="build-bank" role="group" aria-label="Kelimeler">
        {tiles.map((t) =>
          picked.includes(t.id) ? (
            <span key={t.id} className="build-tile is-slot" aria-hidden="true">
              {t.text}
            </span>
          ) : (
            <button key={t.id} {...tileProps(t.id, "bank")}>
              {t.text}
            </button>
          )
        )}
      </div>

      <Button size="lg" block disabled={done || picked.length === 0} onClick={check}>
        {nearUsed && !done ? "Tekrar kontrol et" : "Kontrol et"}
      </Button>

      {drag &&
        createPortal(
          <span className="build-tile is-ghost" style={{ left: drag.x, top: drag.y, width: drag.w, height: drag.h }} aria-hidden="true">
            {textOf(drag.id)}
          </span>,
          document.body
        )}
    </div>
  );
}
