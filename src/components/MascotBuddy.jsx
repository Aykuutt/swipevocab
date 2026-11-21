// Dilbaz'ın sağ alttan konuşma balonuyla belirdiği köşe. Dokununca kapanır.
import { useEffect, useRef, useState } from "react";
import { MASCOT_EVENT } from "../lib/mascot";
import Mascot from "./Mascot";

export default function MascotBuddy() {
  const [msg, setMsg] = useState(null); // { text, mood, key }
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    const onSay = (e) => {
      clearTimeout(hideTimer.current);
      setMsg(e.detail);
      setVisible(true);
      hideTimer.current = setTimeout(() => setVisible(false), e.detail.duration);
    };
    window.addEventListener(MASCOT_EVENT, onSay);
    return () => {
      window.removeEventListener(MASCOT_EVENT, onSay);
      clearTimeout(hideTimer.current);
    };
  }, []);

  if (!msg) return null;
  return (
    <button
      type="button"
      className={`buddy ${visible ? "is-visible" : ""}`}
      onClick={() => setVisible(false)}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label={`Dilbaz: ${msg.text}. Kapatmak için dokun.`}
    >
      <span className="buddy-bubble" role="status" aria-live="polite">
        {msg.text}
      </span>
      <Mascot key={msg.key} mood={msg.mood} size={62} talking={visible} className="buddy-mascot" />
    </button>
  );
}
