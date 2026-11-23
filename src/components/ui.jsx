// Küçük, durumsuz arayüz parçaları.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import Mascot from "./Mascot";

/* ---------- Button ---------- */
// variant: primary | secondary | ghost | success | danger | pro
// size: sm | md | lg
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  icon,
  className = "",
  children,
  disabled,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${block ? "btn-block" : ""} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
}

/* ---------- ProgressBar ---------- */
export function ProgressBar({ value, tone = "violet", label, className = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`bar bar-${tone} ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Field ---------- */
export function Field({ label, error, hideLabel = false, type = "text", ...rest }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </label>
      <div className="field-control">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            <Icon name={visible ? "eyeOff" : "eye"} size={18} />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- Overlay (tam ekran diyalog) ---------- */
export function Overlay({ children, label }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} tabIndex={-1} className="overlay" role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>
  );
}

/* ---------- Confetti ---------- */
const CONFETTI_COLORS = ["var(--violet)", "var(--mint)", "var(--amber)", "var(--coral)", "var(--sky)", "var(--rose)"];

export function Confetti({ count = 30 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const dist = 80 + Math.random() * 150;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 70,
          r: Math.round(Math.random() * 600 - 300),
          delay: Math.random() * 0.12,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          w: 6 + Math.random() * 5,
          h: 10 + Math.random() * 7,
        };
      }),
    [count]
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            "--x": `${p.x}px`,
            "--y": `${p.y}px`,
            "--r": `${p.r}deg`,
            animationDelay: `${p.delay}s`,
            background: p.color,
            width: p.w,
            height: p.h,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- EmptyState (bilgi / kutlama ekranı) ---------- */
export function EmptyState({ icon, tone = "violet", mascot, title, children, actions, celebrate = false }) {
  return (
    <div className="empty">
      {celebrate && <Confetti />}
      {mascot && <Mascot mood={mascot} size={112} className="empty-mascot" />}
      {!mascot && icon && (
        <div className={`empty-icon tone-${tone} ${celebrate ? "is-celebrating" : ""}`}>
          <Icon name={icon} size={30} />
        </div>
      )}
      <h2 className="empty-title">{title}</h2>
      {children && <div className="empty-text">{children}</div>}
      {actions && <div className="empty-actions">{actions}</div>}
    </div>
  );
}

/* ---------- Ayar listeleri: Group + Row ---------- */
export function Group({ id, title, hint, children }) {
  return (
    <section className="group" id={id}>
      {title && <h2 className="group-title">{title}</h2>}
      <ul className="group-list">{children}</ul>
      {hint && <p className="group-hint">{hint}</p>}
    </section>
  );
}

export function Row({ icon, tone = "violet", title, desc, children, stacked = false }) {
  return (
    <li className={`row ${stacked ? "row-stacked" : ""}`}>
      <div className="row-main">
        {icon && (
          <span className={`row-icon tone-${tone}`}>
            <Icon name={icon} size={20} />
          </span>
        )}
        <div className="row-text">
          <span className="row-title">{title}</span>
          {desc && <span className="row-desc">{desc}</span>}
        </div>
      </div>
      {children && <div className="row-action">{children}</div>}
    </li>
  );
}

/** Alt sayfaya giden satır (Profil'deki ayar listesi): simge, başlık, kısa özet, ok. */
export function NavRow({ icon, tone = "violet", title, summary, onClick, badge = 0 }) {
  return (
    <li className="row-navwrap">
      <button type="button" className="row-nav" onClick={onClick}>
        <span className="row-main">
          {icon && (
            <span className={`row-icon tone-${tone}`}>
              <Icon name={icon} size={20} />
            </span>
          )}
          <span className="row-text">
            <span className="row-title">{title}</span>
            {summary && <span className="row-desc">{summary}</span>}
          </span>
        </span>
        {badge > 0 && <span className="row-badge">{badge}</span>}
        <Icon name="chevronRight" size={18} className="row-chevron" />
      </button>
    </li>
  );
}

/* ---------- Disclosure (açılır bölüm) ---------- */
export function Disclosure({ icon, title, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`disclosure ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="disclosure-head"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {icon && <Icon name={icon} size={18} />}
        <span className="disclosure-title">{title}</span>
        {summary && <span className="disclosure-summary">{summary}</span>}
        <Icon name={open ? "chevronUp" : "chevronDown"} size={18} />
      </button>
      {open && (
        <div id={id} className="disclosure-body">
          {children}
        </div>
      )}
    </section>
  );
}

/* ---------- Chips (çoklu seçim) ---------- */
export function Chips({ options, selected, onToggle, label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            className={`chip ${on ? "is-selected" : ""} ${o.locked ? "is-locked" : ""}`}
            aria-pressed={on}
            disabled={o.locked}
            onClick={() => onToggle(o.id)}
          >
            {o.locked && <Icon name="lock" size={13} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-knob" />
    </button>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 48 }) {
  const initial = (name || "S").trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "S";
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {initial}
    </div>
  );
}

/* ---------- Brand ---------- */
export function Brand({ large = false, as: Tag = "div", className }) {
  return (
    <Tag className={className ?? `brand ${large ? "brand-lg" : ""}`}>
      Keli<span>manya</span>
    </Tag>
  );
}
