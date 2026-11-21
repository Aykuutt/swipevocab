// Uygulama iskeleti: arka plan, üst bilgi çubuğu, alt sekmeler, açılış ekranı.
import { useEffect, useReducer, useState } from "react";
import { MAX_LIVES } from "../config";
import { claimableOrders, weeklyClaimable } from "../data/orders";
import { pendingHarvests } from "../data/village";
import { useValueDelta } from "../hooks/useValueDelta";
import { NO_VOICE_EVENT } from "../lib/speech";
import { formatShort } from "../lib/time";
import { useApp, useLanguage } from "../state/AppContext";
import { currentStreak, hasUnlimitedLives } from "../state/selectors";
import Icon from "./Icon";
import Mascot from "./Mascot";
import { Brand, Button } from "./ui";

export function AppShell({ children }) {
  return (
    <div className="app-bg">
      <div className="app-shell">{children}</div>
    </div>
  );
}

function Stat({ className, icon, value, raw, label, showDelta = false, children }) {
  const delta = useValueDelta(raw);
  return (
    <li className={`stat ${className} ${delta ? `is-${delta.dir}` : ""}`} aria-label={label}>
      <Icon name={icon} size={18} filled />
      <span className="stat-value">{value}</span>
      {children}
      {showDelta && delta?.dir === "up" && (
        <span key={delta.key} className="stat-delta" aria-hidden="true">
          +{delta.delta}
        </span>
      )}
    </li>
  );
}

/** Üst çubuktaki canlar: tek kalp ve sayı; can eksikse yanında yalnızca sıradaki canın dolmasına kalan süre yazar. */
function LivesStat() {
  const { state, getNow } = useApp();
  const unlimited = hasUnlimitedLives(state);
  const delta = useValueDelta(unlimited ? 0 : state.lives);
  const [, rerender] = useReducer((n) => n + 1, 0);
  const regenerating = !unlimited && state.lives < MAX_LIVES && state.regenAt !== null;

  useEffect(() => {
    if (!regenerating) return;
    const timer = setInterval(rerender, 1000);
    return () => clearInterval(timer);
  }, [regenerating]);

  if (unlimited) {
    return (
      <li className="stat stat-heart" aria-label="Sınırsız can">
        <Icon name="heart" size={18} filled />
        <span className="stat-value">∞</span>
      </li>
    );
  }

  const next = regenerating ? Math.max(0, state.regenAt - getNow()) : 0;
  return (
    <li
      className={`stat stat-heart ${delta ? `is-${delta.dir}` : ""}`}
      aria-label={regenerating ? `${state.lives} / ${MAX_LIVES} can, sıradaki ${formatShort(next)} sonra` : `${state.lives} can`}
    >
      <Icon name="heart" size={18} filled />
      <span className="stat-value">{state.lives}</span>
      {regenerating && <span className="life-time">{formatShort(next)}</span>}
    </li>
  );
}

export function Header() {
  const { state } = useApp();
  const streak = currentStreak(state);

  return (
    <header className="app-header">
      <Brand />
      <ul className="stats" aria-label="Durumun">
        <LivesStat />
        <Stat className="stat-streak" icon="flame" raw={streak} value={streak} label={`${streak} günlük seri`} />
        <Stat className="stat-xp" icon="star" raw={state.xp} value={state.xp} label={`${state.xp} puan`} showDelta />
      </ul>
    </header>
  );
}

const TABS = [
  { id: "learn", label: "Öğren", icon: "learn" },
  { id: "path", label: "Yol", icon: "path" },
  { id: "game", label: "Oyun", icon: "game" },
  { id: "village", label: "Köy", icon: "home" },
  { id: "profile", label: "Profil", icon: "user" },
];

export function TabBar() {
  const { tab, setTab, setProfileView, state } = useApp();
  // Köy sekmesindeki nokta: toplanacak hasat ya da teslim edilecek sipariş var.
  const harvestReady = pendingHarvests(state).length > 0 || claimableOrders(state).length > 0 || weeklyClaimable(state);
  return (
    <nav className="tabbar" aria-label="Ana menü">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab ${tab === t.id ? "is-active" : ""}`}
          aria-current={tab === t.id ? "page" : undefined}
          onClick={() => {
            // Profil sekmesine tekrar dokununca ana profil sayfasına dön.
            if (t.id === "profile" && tab === "profile") setProfileView(null);
            setTab(t.id);
          }}
        >
          <span className="tab-icon">
            <Icon name={t.icon} size={22} />
            {t.id === "village" && harvestReady && <i className="tab-dot" aria-label="Köyde seni bekleyen bir şey var" />}
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Splash({
  error,
  message = "Kelime listesi yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.",
  onRetry,
}) {
  return (
    <div className="splash">
      <Mascot mood={error ? "sad" : "wave"} size={96} />
      <Brand large />
      {error ? (
        <>
          <p>{message}</p>
          {onRetry && <Button onClick={onRetry}>Tekrar dene</Button>}
        </>
      ) : (
        <span className="spinner spinner-lg" role="status" aria-label="Yükleniyor" />
      )}
    </div>
  );
}

/** Cihazda öğrenilen dilde ses yoksa bir kez gösterilen uyarı. */
export function VoiceNotice() {
  const [visible, setVisible] = useState(false);
  const { openProfile } = useApp();
  const language = useLanguage();

  useEffect(() => {
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(true);
    };
    window.addEventListener(NO_VOICE_EVENT, show);
    return () => window.removeEventListener(NO_VOICE_EVENT, show);
  }, []);

  if (!visible) return null;
  return (
    <div className="voice-notice" role="status">
      <Icon name="info" size={18} />
      <p>
        Bunu okumak için cihazında {language.name} ses gerekiyor, bulamadım. Türkçe sesle yanlış telaffuz öğrenmemen
        için okumadım.{language.id === "en" ? " Kelimeler hazır kayıtla okunmaya devam ediyor." : ""} Ayrıntı Profil, Ses bölümünde.
      </p>
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setVisible(false);
          openProfile("sound");
        }}
      >
        Ayarlar
      </button>
      <button type="button" className="icon-btn" aria-label="Kapat" onClick={() => setVisible(false)}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
