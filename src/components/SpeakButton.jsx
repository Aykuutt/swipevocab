import { speak } from "../lib/speech";
import Icon from "./Icon";

/** Metni sesli okuyan küçük düğme. Kart sürüklemesini tetiklemez. */
export default function SpeakButton({ text, label = "Telaffuzu dinle", className = "" }) {
  return (
    <button
      type="button"
      className={`speak-btn ${className}`}
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      <Icon name="speaker" size={18} />
    </button>
  );
}
