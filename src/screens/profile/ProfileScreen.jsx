// "Profil" sekmesi: profil, istatistikler, başarımlar, görevler, haftalık özet, seviyeler ve ayarlar listesi.
import { useMemo } from "react";
import Icon from "../../components/Icon";
import Mascot from "../../components/Mascot";
import { Avatar, Disclosure, NavRow, ProgressBar } from "../../components/ui";
import { APP_VERSION, FEATURES, LEVELS } from "../../config";
import { getLanguage } from "../../data/languages";
import { getTheme } from "../../data/themes";
import { leagueTable } from "../../lib/league";
import { weekOfDay } from "../../lib/time";
import { useApp } from "../../state/AppContext";
import { currentStreak, dailyCardLimit } from "../../state/selectors";
import { BADGES, badgeProgress, badgeValues } from "./achievements";
import { AccountPage, AppearancePage, AppPage, LanguagePage, LearningPage, SettingsPage, SoundPage } from "./SettingsPages";

function ProfileHero() {
  const { state } = useApp();
  const language = getLanguage(state.language);
  return (
    <div className="profile-hero">
      <Avatar name={state.user?.name} size={76} />
      <h1>{state.user?.name || (state.user?.guest ? "Misafir" : "Sen")}</h1>
      <div className="profile-pills">
        <span className="pill pill-plain">{language.name}</span>
        {state.placementLevel && <span className="pill pill-plain">Başlangıç {state.placementLevel}</span>}
        {FEATURES.pro && (
          <span className={`pill ${state.isPro ? "pill-amber" : "pill-plain"}`}>
            {state.isPro && <Icon name="crown" size={13} filled />}
            {state.isPro ? "Pro üye" : "Ücretsiz plan"}
          </span>
        )}
      </div>
    </div>
  );
}

/** Kart'ın ilerlemeye göre kısa yorumu. */
function coachLine(state) {
  const streak = currentStreak(state);
  const known = state.knownIds.length;
  const learning = state.learningIds.length;
  if (known === 0) return { text: "Henüz başındayız! Öğren sekmesinde ilk kartlarını kaydır, burada ilerlemeni birlikte izleyelim.", mood: "wave" };
  if (streak >= 7) return { text: `${streak} gündür hiç aksatmadın, gurur duyuyorum! 🔥`, mood: "cheer" };
  if (state.weekWords >= 10) return { text: `Bu hafta ${state.weekWords} yeni kelime öğrendin. Harika gidiyorsun!`, mood: "cheer" };
  if (learning >= 5) return { text: `${learning} kelime hâlâ öğreniliyor. Yol sekmesindeki ünitelerle pekiştirebilirsin.`, mood: "think" };
  if (streak === 0) return { text: "Seri sıfırlanmış ama dert değil. Bugün birkaç kart kaydır, yeniden başlayalım!", mood: "happy" };
  return { text: `Toplam ${known} kelime biliyorsun. Her gün biraz, en iyi yöntem bu!`, mood: "happy" };
}

function Coach() {
  const { state } = useApp();
  const { text, mood } = coachLine(state);
  return (
    <div className="coach">
      <Mascot mood={mood} size={58} />
      <p className="coach-bubble">{text}</p>
    </div>
  );
}

function StatGrid() {
  const { state } = useApp();
  const items = [
    { icon: "flame", tone: "coral", value: currentStreak(state), label: "gün serisi" },
    { icon: "star", tone: "amber", value: state.xpTotal ?? state.xp, label: "toplam puan" },
    { icon: "check", tone: "mint", value: state.knownIds.length, label: "bildiğin kelime" },
    { icon: "path", tone: "violet", value: state.completedUnits.length, label: "tamamlanan ünite" },
  ];
  return (
    <section className="group">
      <h2 className="group-title">İstatistikler</h2>
      <dl className="stat-grid">
        {items.map((s) => (
          <div key={s.label} className="stat-card">
            <span className={`row-icon tone-${s.tone}`}>
              <Icon name={s.icon} size={20} filled={s.icon === "flame" || s.icon === "star"} />
            </span>
            <div>
              <dt>{s.value}</dt>
              <dd>{s.label}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DailyQuests() {
  const { state } = useApp();
  // Kart görevi günlük sınırı aşamaz; yoksa hedefi düşük olan kullanıcı görevi hiç bitiremez.
  const cardTarget = Math.min(10, dailyCardLimit(state) ?? 10);
  const quests = [
    { icon: "bolt", label: "20 puan kazan", current: state.dailyXp, target: 20 },
    { icon: "check", label: "5 doğru cevap ver", current: state.dailyCorrect, target: 5 },
    { icon: "learn", label: `${cardTarget} kart kaydır`, current: state.swipedToday, target: cardTarget },
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

/** Başarım kartı: simge, ad, düzey noktaları, ilerleme ve açıklama. */
function BadgeCard({ b, p }) {
  return (
    <li className={`badge-card ${p.level > 0 ? "has-level" : ""}`}>
      <span className="badge-icon">
        <Icon name={b.icon} size={26} filled={b.icon === "flame" || b.icon === "star"} />
      </span>
      <strong>{b.title}</strong>
      <span className="badge-pips" role="img" aria-label={`${p.level} / ${p.total} düzey`}>
        {Array.from({ length: p.total }, (_, i) => (
          <i key={i} className={i < p.level ? "on" : ""} />
        ))}
      </span>
      <ProgressBar value={p.progress} tone="amber" label={b.title} />
      <span className="badge-desc">{p.maxed ? "Tüm düzeyler tamam" : b.desc(p.next)}</span>
    </li>
  );
}

/**
 * Başarımlar: yalnızca kazanılanlar küçük kutucuklarla gösterilir, böylece ekran dolmaz.
 * Altta en yakın hedef görünür; kilitli olanlar dahil tüm liste açılır bölümde durur.
 */
function Achievements() {
  const { state } = useApp();
  const values = badgeValues(state);
  const list = BADGES.filter((b) => b.key !== "top3" || FEATURES.leagueRivals);
  const rows = list.map((b) => ({ b, p: badgeProgress(values[b.key], b.tiers) }));
  const earned = rows.filter((r) => r.p.level > 0);
  const total = rows.reduce((n, r) => n + r.p.total, 0);
  const levels = rows.reduce((n, r) => n + r.p.level, 0);
  // En yakın hedef: tamamlanmamış başarımlardan, sıradaki düzeye en çok yaklaşılan.
  const next = rows.filter((r) => !r.p.maxed).sort((x, y) => y.p.progress - x.p.progress)[0];

  return (
    <section className="group">
      <h2 className="group-title">
        Başarımlar{" "}
        <span className="group-title-note">
          {levels}/{total}
        </span>
      </h2>

      {earned.length > 0 ? (
        <ul className="badge-chips">
          {earned.map(({ b, p }) => (
            <li key={b.key} className="badge-chip">
              <span className="badge-icon badge-icon-sm">
                <Icon name={b.icon} size={22} filled={b.icon === "flame" || b.icon === "star"} />
              </span>
              <strong>{b.title}</strong>
              <span className="badge-pips" role="img" aria-label={`${p.level} / ${p.total} düzey`}>
                {Array.from({ length: p.total }, (_, i) => (
                  <i key={i} className={i < p.level ? "on" : ""} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="badge-empty">Henüz başarımın yok. İlk kartlarını kaydırdıkça burada açılacaklar.</p>
      )}

      {next && (
        <div className="badge-next">
          <span className="badge-icon badge-icon-sm">
            <Icon name={next.b.icon} size={20} filled={next.b.icon === "flame" || next.b.icon === "star"} />
          </span>
          <div className="badge-next-body">
            <span className="badge-next-title">Sıradaki hedef: {next.b.title}</span>
            <ProgressBar value={next.p.progress} tone="amber" label={next.b.title} />
            <span className="badge-desc">{next.b.desc(next.p.next)}</span>
          </div>
        </div>
      )}

      <div className="badge-all">
        <Disclosure icon="trophy" title="Tüm başarımlar" summary={`${list.length} başarım`}>
          <ul className="badge-grid">
            {rows.map(({ b, p }) => (
              <BadgeCard key={b.key} b={b} p={p} />
            ))}
          </ul>
        </Disclosure>
      </div>
    </section>
  );
}

/* ---------- Ayarlar listesi ve alt sayfalar ---------- */
const PAGES = {
  account: { title: "Hesap", Page: AccountPage },
  language: { title: "Öğrendiğin dil", Page: LanguagePage },
  learning: { title: "Öğrenme", Page: LearningPage },
  sound: { title: "Ses", Page: SoundPage },
  appearance: { title: "Görünüm", Page: AppearancePage },
  app: { title: "Uygulama", Page: AppPage },
};

function SettingsList() {
  const { state, setProfileView } = useApp();
  const { user, settings } = state;
  const open = (id) => () => setProfileView(id);
  return (
    <section className="group">
      <h2 className="group-title">Ayarlar</h2>
      <ul className="group-list">
        <NavRow icon="user" tone="violet" title="Hesap" summary={user?.guest ? "Misafir" : user?.email} onClick={open("account")} />
        <NavRow icon="cap" tone="sky" title="Öğrendiğin dil" summary={getLanguage(state.language).name} onClick={open("language")} />
        <NavRow icon="target" tone="amber" title="Öğrenme" summary={`Günde ${settings.dailyGoal} kart`} onClick={open("learning")} />
        <NavRow icon="speaker" tone="mint" title="Ses" summary={settings.sound ? "Okuma sesi, efektler açık" : "Efektler kapalı"} onClick={open("sound")} />
        <NavRow icon="moon" tone="rose" title="Görünüm" summary={`Tema: ${getTheme(settings.theme).name}`} onClick={open("appearance")} />
        <NavRow icon="sliders" tone="coral" title="Uygulama" summary={`Sürüm ${APP_VERSION}`} onClick={open("app")} />
      </ul>
    </section>
  );
}

function ProfileHome() {
  const { state, actions } = useApp();
  return (
    <div className="screen">
      <ProfileHero />
      <Coach />
      <StatGrid />
      {FEATURES.pro && state.freezeNotice && (
        <div className="notice notice-violet" role="status">
          <Icon name="snow" size={18} />
          <p>Bir günü kaçırdın ama seri dondurma hakkın seriyi korudu.</p>
          <button type="button" className="icon-btn" aria-label="Bildirimi kapat" onClick={actions.dismissFreezeNotice}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <Achievements />
      <DailyQuests />
      <div className="stack">
        <WeeklyRecap />
        {FEATURES.leagueRivals && <League />}
      </div>
      <LevelProgress />
      <SettingsList />
    </div>
  );
}

export default function ProfileScreen() {
  const { profileView, setProfileView } = useApp();
  const page = PAGES[profileView];
  if (!page) return <ProfileHome />;
  const { Page, title } = page;
  return (
    <SettingsPage title={title} onBack={() => setProfileView(null)}>
      <Page />
    </SettingsPage>
  );
}
