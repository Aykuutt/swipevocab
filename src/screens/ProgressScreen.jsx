// "İlerleme" sekmesi: profil, istatistikler, görevler, haftalık özet, seviyeler, başarılar.
import { useMemo } from "react";
import Icon from "../components/Icon";
import { Avatar, Disclosure, ProgressBar } from "../components/ui";
import { FEATURES, LEVELS } from "../config";
import { leagueTable } from "../lib/league";
import { weekOfDay } from "../lib/time";
import { useApp } from "../state/AppContext";
import { currentStreak } from "../state/selectors";

function Profile() {
  const { state } = useApp();
  return (
    <div className="profile">
      <Avatar name={state.user?.name} size={56} />
      <div className="profile-text">
        <h1>{state.user?.name || "Sen"}</h1>
        {FEATURES.pro ? (
          <span className={`pill ${state.isPro ? "pill-amber" : "pill-plain"}`}>
            {state.isPro && <Icon name="crown" size={13} filled />}
            {state.isPro ? "Pro üye" : "Ücretsiz plan"}
          </span>
        ) : (
          state.placementLevel && <span className="pill pill-plain">Başlangıç seviyesi {state.placementLevel}</span>
        )}
      </div>
    </div>
  );
}

function StatStrip() {
  const { state } = useApp();
  const items = [
    { icon: "flame", tone: "coral", value: currentStreak(state), label: "gün serisi" },
    { icon: "star", tone: "amber", value: state.xp, label: "toplam puan" },
    { icon: "check", tone: "mint", value: state.knownIds.length, label: "bildiğin" },
    { icon: "book", tone: "violet", value: state.learningIds.length, label: "öğreniyorum" },
  ];
  return (
    <dl className="stat-strip">
      {items.map((s) => (
        <div key={s.label} className="stat-strip-item">
          <Icon name={s.icon} size={18} filled={s.icon !== "check" && s.icon !== "book"} className={`text-${s.tone}`} />
          <dt>{s.value}</dt>
          <dd>{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function DailyQuests() {
  const { state } = useApp();
  const quests = [
    { icon: "bolt", label: "20 puan kazan", current: state.dailyXp, target: 20 },
    { icon: "check", label: "5 doğru cevap ver", current: state.dailyCorrect, target: 5 },
    { icon: "learn", label: "10 kart kaydır", current: state.swipedToday, target: 10 },
  ];
  return (
    <section className="group">
      <h2 className="group-title">Günlük görevler</h2>
      <ul className="quests">
        {quests.map((q) => {
          const done = q.current >= q.target;
          return (
            <li key={q.label} className={`quest ${done ? "is-done" : ""}`}>
              <span className="quest-icon">
                <Icon name={done ? "check" : q.icon} size={18} />
              </span>
              <div className="quest-body">
                <span className="quest-label">{q.label}</span>
                <ProgressBar value={(q.current / q.target) * 100} tone={done ? "mint" : "violet"} label={q.label} />
              </div>
              <span className="quest-count">
                {Math.min(q.current, q.target)}/{q.target}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WeeklyRecap() {
  const { state } = useApp();
  const week = weekOfDay(state.day);
  const active = state.weekDaysActive;
  const message =
    active >= 5
      ? "Harika gidiyorsun, bu tempoyla seri sağlam."
      : active >= 2
        ? "İyi gidiyorsun, birkaç gün daha ekle."
        : "Hafta yeni başladı, ilk günü tamamla.";
  const last = state.lastWeek;

  return (
    <Disclosure icon="calendar" title="Haftalık özet" summary={`${week}. hafta`}>
      <dl className="recap">
        <div>
          <dt>{state.weekWords}</dt>
          <dd>yeni kelime</dd>
        </div>
        <div>
          <dt>{state.weeklyXp}</dt>
          <dd>puan</dd>
        </div>
        <div>
          <dt>{active}/7</dt>
          <dd>aktif gün</dd>
        </div>
      </dl>
      <p className="recap-message">{message}</p>
      {last && (
        <p className="recap-last">
          Geçen hafta: {last.words} kelime, {last.xp} puan, {last.days}/7 gün.
        </p>
      )}
    </Disclosure>
  );
}

function League() {
  const { state } = useApp();
  const rows = leagueTable(weekOfDay(state.day), state.weeklyXp, state.user?.name);
  const rank = rows.findIndex((r) => r.isUser) + 1;
  return (
    <Disclosure icon="trophy" title="Haftalık lig" summary={`${rank}. sıradasın`}>
      <ol className="league">
        {rows.map((r, i) => (
          <li key={r.name} className={`league-row ${r.isUser ? "is-me" : ""}`}>
            <span className={`league-rank rank-${i + 1}`}>{i + 1}</span>
            <span className="league-name">{r.isUser ? `${r.name} (sen)` : r.name}</span>
            <span className="league-xp">{r.xp} puan</span>
          </li>
        ))}
      </ol>
      <p className="group-hint">Sıralama her hafta puanlara göre sıfırdan başlar.</p>
    </Disclosure>
  );
}

function LevelProgress() {
  const { state, words } = useApp();
  const rows = useMemo(() => {
    const known = new Set(state.knownIds);
    return LEVELS.map((level) => {
      const atLevel = words.filter((w) => w.level === level);
      return { level, total: atLevel.length, known: atLevel.filter((w) => known.has(w.id)).length };
    }).filter((r) => r.total > 0);
  }, [state.knownIds, words]);

  return (
    <section className="group">
      <h2 className="group-title">Seviye ilerlemen</h2>
      <ul className="levels">
        {rows.map((r) => (
          <li key={r.level} className="level-row">
            <span className="level-chip">{r.level}</span>
            <ProgressBar value={(r.known / r.total) * 100} tone="mint" label={`${r.level} seviyesi`} />
            <span className="level-count">
              {r.known}/{r.total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const BADGES = [
  { key: "streak", icon: "flame", title: "İstikrarlı", tiers: [3, 7, 14, 30], desc: (n) => `${n} günlük bir seriye ulaş` },
  { key: "xp", icon: "star", title: "Bilge", tiers: [50, 150, 400, 1000], desc: (n) => `${n} puan kazan` },
  { key: "words", icon: "book", title: "Kelime ustası", tiers: [5, 15, 40, 90], desc: (n) => `${n} kelime öğren` },
  { key: "top3", icon: "trophy", title: "Şampiyon", tiers: [1, 3, 6, 10], desc: (n) => `Ligde ilk 3'e ${n} kez gir` },
];

function badgeProgress(value, tiers) {
  const level = tiers.filter((t) => value >= t).length;
  const maxed = level >= tiers.length;
  const next = maxed ? tiers[tiers.length - 1] : tiers[level];
  const prev = level > 0 ? tiers[level - 1] : 0;
  const progress = maxed ? 100 : Math.round(((value - prev) / (next - prev)) * 100);
  return { level, maxed, next, progress };
}

function Badges() {
  const { state } = useApp();
  const values = {
    streak: currentStreak(state),
    xp: state.xp,
    words: state.knownIds.length,
    top3: state.top3Finishes,
  };
  return (
    <section className="group">
      <h2 className="group-title">Başarılar</h2>
      <ul className="badges">
        {BADGES.filter((b) => b.key !== "top3" || FEATURES.leagueRivals).map((b) => {
          const p = badgeProgress(values[b.key], b.tiers);
          return (
            <li key={b.key} className={`badge ${p.level > 0 ? "has-level" : ""}`}>
              <span className="badge-icon">
                <Icon name={b.icon} size={24} filled={b.icon !== "trophy" && b.icon !== "book"} />
              </span>
              <div className="badge-body">
                <div className="badge-top">
                  <strong>{b.title}</strong>
                  <span className="badge-level">
                    {p.maxed ? "Tamamlandı" : p.level > 0 ? `Düzey ${p.level}` : "Henüz yok"}
                  </span>
                </div>
                <ProgressBar value={p.progress} tone="amber" label={b.title} />
                <span className="badge-desc">{p.maxed ? "Tüm düzeyleri bitirdin." : b.desc(p.next)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ProgressScreen() {
  const { state, actions } = useApp();
  return (
    <div className="screen">
      <Profile />
      <StatStrip />
      {FEATURES.pro && state.freezeNotice && (
        <div className="notice notice-violet" role="status">
          <Icon name="snow" size={18} />
          <p>Bir günü kaçırdın ama seri dondurma hakkın seriyi korudu.</p>
          <button type="button" className="icon-btn" aria-label="Bildirimi kapat" onClick={actions.dismissFreezeNotice}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <DailyQuests />
      <div className="stack">
        <WeeklyRecap />
        {FEATURES.leagueRivals && <League />}
      </div>
      <LevelProgress />
      <Badges />
    </div>
  );
}
