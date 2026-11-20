// Öğrenilecek dil seçimi (kurulumda ve Ayarlar'da).
import { LANGUAGE_ORDER, LANGUAGES } from "../data/languages";

const HINTS = {
  en: "Dünyada en çok kullanılan ikinci dil",
  de: "Avrupa'da iş ve eğitim için",
  es: "500 milyondan fazla insanın ana dili",
  fr: "Diplomasi, mutfak ve sanatın dili",
};

export default function LanguagePicker({ value, onChange, describe }) {
  return (
    <div className="goal-list" role="radiogroup" aria-label="Öğrenilecek dil">
      {LANGUAGE_ORDER.map((id) => {
        const lang = LANGUAGES[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            className={`goal ${value === id ? "is-selected" : ""}`}
            onClick={() => onChange(id)}
          >
            <span className="goal-icon lang-code" aria-hidden="true">
              {lang.code}
            </span>
            <span className="goal-text">
              <strong>{lang.name}</strong>
              <span>{describe?.(id) ?? HINTS[id]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
