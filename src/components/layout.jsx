// Uygulama iskeleti: arka plan, üst bilgi çubuğu, alt sekmeler, açılış ekranı.
import { useEffect, useState } from "react";
import { MAX_LIVES } from "../config";
import { useValueDelta } from "../hooks/useValueDelta";
import { NO_VOICE_EVENT } from "../lib/speech";
import { useApp, useLanguage } from "../state/AppContext";
import { currentStreak, hasUnlimitedLives } from "../state/selectors";
import HeartTimer from "./HeartTimer";
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

export function Header() {
  const { state } = useApp();
  const streak = currentStreak(state);
  const unlimited = hasUnlimitedLives(state);
  const regenerating = !unlimited && state.lives < MAX_LIVES;

  return (
    <header className="app-header">
      <Brand />
      <ul className="stats" aria-label="Durumun">
        <Stat
          className="stat-heart"
          icon="heart"
          raw={unlimited ? 0 : state.lives}
          value={unlimited ? "∞" : state.lives}
          label={unlimited ? "Sınırsız can" : `${state.lives} can`}
        >
          {regenerating && <HeartTimer />}
        </Stat>
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
  { id: "store", label: "Mağaza", icon: "store" },
  { id: "progress", label: "İlerleme", icon: "chart" },
  { id: "settings", label: "Ayarlar", icon: "sliders" },
];

export function TabBar() {
  const { tab, setTab } = useApp();
  return (
    <nav className="tabbar" aria-label="Ana menü">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab ${tab === t.id ? "is-active" : ""}`}
          aria-current={tab === t.id ? "page" : undefined}
          onClick={() => setTab(t.id)}
        >
          <Icon name={t.icon} size={22} />
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
  const { goTo } = useApp();
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
        için okumadım.{language.id === "en" ? " Kelimeler hazır kayıtla okunmaya devam ediyor." : ""} Ayrıntı Ayarlar'da,
        Okuma sesi bölümünde.
      </p>
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setVisible(false);
          goTo("settings");
          setTimeout(() => document.getElementById("voice-settings")?.scrollIntoView({ block: "start" }), 80);
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
