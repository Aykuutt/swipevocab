// Tema seçimi: her tema küçük bir önizleme kartıyla gösterilir.
import { THEMES } from "../data/themes";

export default function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-grid" role="radiogroup" aria-label="Tema">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={value === t.id}
          className={`theme-card ${value === t.id ? "is-selected" : ""}`}
          onClick={() => onChange(t.id)}
          style={{ "--sw-bg": t.preview.bg, "--sw-card": t.preview.card, "--sw-accent": t.preview.accent }}
        >
          <span className="theme-preview" aria-hidden="true">
            <span className="theme-preview-bar" />
            <span className="theme-preview-card" />
            <span className="theme-preview-btn" />
          </span>
          <strong>{t.name}</strong>
          <span>{t.hint}</span>
        </button>
      ))}
    </div>
  );
}
