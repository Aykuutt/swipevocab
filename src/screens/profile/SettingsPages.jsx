// Profil sekmesindeki ayar sayfaları: hesap, dil, öğrenme, ses, görünüm, uygulama.
import AccountPrompt from "../../components/AccountPrompt";
import HeartTimer from "../../components/HeartTimer";
import Icon from "../../components/Icon";
import LanguagePicker from "../../components/LanguagePicker";
import ThemePicker from "../../components/ThemePicker";
import { Button, Chips, Field, Group, Row, Switch } from "../../components/ui";
import {
  APP_NAME,
  APP_VERSION,
  DAILY_GOAL_OPTIONS,
  FEATURES,
  FREE_DAILY_CARDS,
  FREE_LEVELS,
  LEVELS,
  MAX_LIVES,
  isDevMode,
} from "../../config";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { useVoiceInfo } from "../../hooks/useVoiceInfo";
import { speak } from "../../lib/speech";
import { useApp, useLanguage } from "../../state/AppContext";
import { useState } from "react";
import { activeLevels, hasFullAccess, hasUnlimitedLives } from "../../state/selectors";

const voiceHint = (name, hasClips) =>
  `Cihazında ${name} ses varsa kelimeleri ve yapay zekanın cümlelerini o okur${hasClips ? ", yoksa kelimeler hazır kayıtla okunur" : ""}. ` +
  `Cihaza ${name} ses eklemek için: Windows'ta Ayarlar, Zaman ve dil, Konuşma, Ses ekle; Android'de Ayarlar, Metin okuma; ` +
  `iPhone'da Ayarlar, Erişilebilirlik, Seslendirilen İçerik, Sesler yolundan ${name} bir ses kurabilirsin. ` +
  "Edge tarayıcısında genelde daha doğal sesler hazır gelir.";

/** Öğrenilen dil. Her dilin bilinen kelimeleri, üniteleri ve günlük kartları ayrı tutulur. */
export function LanguagePage() {
  const { state, actions } = useApp();
  const describe = (id) => {
    if (id === state.language) return `Şu an bu dili çalışıyorsun, ${state.knownIds.length} kelime biliyorsun.`;
    const saved = state.languages[id];
    return saved ? `${saved.knownIds?.length ?? 0} kelime biliyorsun.` : "Henüz başlamadın.";
  };
  return (
    <Group
      title="Öğrendiğin dil"
      hint="Dil değiştirince o dilin kelimeleri ve üniteleri açılır. XP, seri ve lig bütün dillerde ortak; diğer dildeki ilerlemen kaybolmaz."
    >
      <LanguagePicker value={state.language} onChange={actions.setLanguage} describe={describe} />
    </Group>
  );
}

function InstallApp() {
  const { status, install } = useInstallPrompt();
  if (status === "installed" || status === "unsupported") return null;
  return (
    <Group title="Uygulama">
      <Row
        icon="learn"
        tone="violet"
        title="Telefona yükle"
        desc={
          status === "ios"
            ? "Safari'de alttaki Paylaş düğmesine, sonra \"Ana Ekrana Ekle\"ye dokun."
            : "Ana ekranından tek dokunuşla aç, internet yokken de çalışsın."
        }
      >
        {status === "available" && (
          <Button size="sm" onClick={install}>
            Yükle
          </Button>
        )}
      </Row>
    </Group>
  );
}

function VoiceSettings() {
  const { state, actions } = useApp();
  const language = useLanguage();
  const voice = useVoiceInfo();
  const ready = voice.status === "ready";
  const loading = voice.status === "unknown";
  const hasClips = language.id === "en"; // hazır ses kayıtları yalnızca İngilizcede var
  const name = language.name;

  const title = ready ? `${name} ses bulundu` : loading ? "Sesler yükleniyor…" : `Cihazda ${name} ses yok`;
  const desc = ready
    ? `Kullanılan: ${voice.name} (${voice.lang}). Cihazda ${voice.matching} ${name} ses var.`
    : loading
      ? "Birkaç saniye bekle."
      : hasClips
        ? `Cihazında ${voice.total} ses var ama hiçbiri ${name} değil. Kelimeler ve örnek cümleler hazır ses kaydıyla okunur (makine sesi, doğal değil). Yapay zekanın cümlelerini okumak için cihaz sesi gerekir.`
        : `Cihazında ${voice.total} ses var ama hiçbiri ${name} değil. Kelimeleri sesli dinlemek için cihazına ${name} bir ses eklemelisin (aşağıdaki açıklamaya bak).`;

  return (
    <Group id="voice-settings" title="Okuma sesi" hint={voiceHint(name, hasClips)}>
      <Row icon="speaker" tone={ready ? "mint" : "coral"} title={title} desc={desc}>
        <Button size="sm" variant="secondary" onClick={() => speak(ready || !hasClips ? language.sample : "negotiate")}>
          Dene
        </Button>
      </Row>
      {voice.voices.length > 1 && (
        <Row icon="sliders" tone="violet" title="Ses seç" desc={`Beğenmediysen başka bir ${name} ses seç.`} stacked>
          <select
            className="select"
            aria-label="Okuma sesi"
            value={state.settings.voices?.[language.id] || ""}
            onChange={(e) => actions.setVoice(e.target.value)}
          >
            <option value="">Otomatik (önerilen)</option>
            {voice.voices.map((v) => (
              <option key={v.uri} value={v.uri}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </Row>
      )}
    </Group>
  );
}

function DevTools() {
  const { state, actions } = useApp();
  const unlimited = hasUnlimitedLives(state);
  const livesDesc = unlimited ? (
    "Canlar sınırsız."
  ) : state.lives >= MAX_LIVES ? (
    "Canların dolu."
  ) : (
    <>
      {state.lives}/{MAX_LIVES} can, sıradaki <HeartTimer className="inline" /> sonra.
    </>
  );

  return (
    <Group
      title="Test araçları"
      hint="Sadece geliştirici modunda görünür (adresin sonunda ?dev=1 ya da #dev varken). Gerçek kullanımda gün ve can süresi kendiliğinden ilerler."
    >
      <Row icon="calendar" tone="violet" title={`Bugün: ${state.day}. gün`} desc="Gece yarısını geçmiş gibi davranır." stacked>
        <div className="btn-row">
          <Button size="sm" variant="secondary" onClick={() => actions.advanceDays(1)}>
            Sonraki güne geç
          </Button>
          <Button size="sm" variant="secondary" onClick={() => actions.advanceDays(2)}>
            Bir gün atla
          </Button>
        </div>
      </Row>
      <Row icon="clock" tone="coral" title="Can yenilenmesi" desc={livesDesc}>
        <Button size="sm" variant="secondary" onClick={() => actions.advanceHours(1)}>
          1 saat ilerlet
        </Button>
      </Row>
      <Row icon="restart" tone="mint" title="Bugünü yeniden başlat" desc="Kart desteni sıfırlar, ilerlemen silinmez.">
        <Button size="sm" variant="secondary" onClick={actions.restartSession}>
          Yeniden başlat
        </Button>
      </Row>
    </Group>
  );
}


/** Küçük bir ayar sayfası kabuğu: geri düğmeli başlık + içerik. */
export function SettingsPage({ title, onBack, children }) {
  return (
    <div className="screen settings-page">
      <div className="settings-head">
        <button type="button" className="icon-btn" aria-label="Geri" onClick={onBack}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <h1 className="screen-title">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function AccountPage() {
  const { state, actions } = useApp();
  const { user } = state;
  return (
    <>
        <Group title="Hesap">
          <Row icon="user" tone="violet" title="Ad" stacked>
            <Field
              label="Ad"
              hideLabel
              value={user?.name || ""}
              onChange={(e) => actions.setName(e.target.value)}
              placeholder="Adın"
              autoComplete="name"
            />
          </Row>
          {user?.guest ? (
            <>
              <Row
                icon="info"
                tone="amber"
                title="Misafir olarak kullanıyorsun"
                desc="İlerlemen yalnızca bu cihazda. Hesap açarsan tüm cihazlarında saklanır ve kaybolmaz."
              >
                <AccountPrompt size="sm">Hesap oluştur</AccountPrompt>
              </Row>
              <Row icon="mail" tone="sky" title="Zaten hesabın var mı?" desc="Hesabındaki ilerleme yüklenir.">
                <AccountPrompt size="sm" variant="secondary" mode="signin">
                  Giriş yap
                </AccountPrompt>
              </Row>
            </>
          ) : (
            <>
              <Row icon="mail" tone="sky" title="E-posta" desc={user?.email} />
              <Row icon="logout" tone="coral" title="Oturum" desc="İlerlemen bu hesapta saklı kalır.">
                <Button size="sm" variant="secondary" onClick={actions.signOut}>
                  Çıkış yap
                </Button>
              </Row>
            </>
          )}
        </Group>
        <DeleteAccount guest={!!user?.guest} />
        <PrivacyLinks />
    </>
  );
}

/** Hesabı (misafirde bu cihazdaki ilerlemeyi) kalıcı olarak silme: iki adımlı onay. */
function DeleteAccount({ guest }) {
  const { actions } = useApp();
  const [step, setStep] = useState("idle"); // idle | confirm | busy
  const [error, setError] = useState("");

  const run = async () => {
    setStep("busy");
    setError("");
    try {
      await actions.deleteAccount();
    } catch (err) {
      setError(err?.message || "Bir şeyler ters gitti, tekrar dene.");
      setStep("confirm");
    }
  };

  const title = guest ? "Bu cihazdaki ilerlemeyi sil" : "Hesabımı sil";
  return (
    <Group title="Verilerim">
      {step === "idle" ? (
        <Row
          icon="close"
          tone="coral"
          title={title}
          desc={guest ? "Kelimelerin, puanların ve köyün bu cihazdan silinir." : "Hesabın ve bütün ilerlemen kalıcı olarak silinir."}
        >
          <Button size="sm" variant="danger" onClick={() => setStep("confirm")}>
            Sil
          </Button>
        </Row>
      ) : (
        <div className="delete-confirm" role="alertdialog" aria-label={title}>
          <strong>Emin misin?</strong>
          <p>
            {guest
              ? "Bu cihazdaki kelimelerin, serin, puanların ve köyün silinir. Bu işlem geri alınamaz."
              : "Hesabın, e-posta adresin, kelimelerin, serin, puanların ve köyün sunucudan kalıcı olarak silinir. Bu işlem geri alınamaz ve aynı ilerlemeyi bir daha geri getiremeyiz."}
          </p>
          {error && <p className="delete-error">{error}</p>}
          <div className="delete-actions">
            <Button variant="danger" disabled={step === "busy"} onClick={run}>
              {step === "busy" ? "Siliniyor..." : "Evet, kalıcı olarak sil"}
            </Button>
            <Button variant="secondary" disabled={step === "busy"} onClick={() => setStep("idle")}>
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </Group>
  );
}

/** Hakkında, iletişim, gizlilik politikası ve hesap silme sayfalarının bağlantıları. */
function PrivacyLinks() {
  return (
    <p className="legal-links">
      <a href="/hakkinda.html" target="_blank" rel="noopener">
        Hakkında
      </a>
      <span aria-hidden="true"> · </span>
      <a href="/iletisim.html" target="_blank" rel="noopener">
        İletişim
      </a>
      <span aria-hidden="true"> · </span>
      <a href="/gizlilik.html" target="_blank" rel="noopener">
        Gizlilik politikası
      </a>
      <span aria-hidden="true"> · </span>
      <a href="/hesap-silme.html" target="_blank" rel="noopener">
        Hesap silme
      </a>
    </p>
  );
}

export function LearningPage() {
  const { state, actions } = useApp();
  const { settings } = state;
  const levels = activeLevels(state);
  const full = hasFullAccess(state);
  return (
    <>
        <Group title="Öğrenme" hint={full ? undefined : "B1-C1 seviyeleri ve günlük hedef seçimi Pro planla açılır."}>
          <Row icon="book" tone="mint" title="Seviyeler" desc="Kartlarda hangi seviyeler çıksın?" stacked>
            <Chips
              label="Seviyeler"
              options={LEVELS.map((l) => ({ id: l, label: l, locked: !full && !FREE_LEVELS.includes(l) }))}
              selected={levels}
              onToggle={actions.toggleLevel}
            />
          </Row>
          {full && (
            <Row icon="target" tone="amber" title="Günlük hedef" desc="Öğren ekranında günde en fazla kaç kart çıksın?" stacked>
              <Chips
                label="Günlük hedef"
                options={DAILY_GOAL_OPTIONS.map((n) => ({ id: n, label: `${n} kart` }))}
                selected={[settings.dailyGoal]}
                onToggle={(n) => actions.setSetting("dailyGoal", n)}
              />
            </Row>
          )}
        </Group>
    </>
  );
}

export function SoundPage() {
  const { state, actions } = useApp();
  const { settings } = state;
  return (
    <>
      <VoiceSettings />

        <Group title={FEATURES.reminders ? "Bildirim ve ses efektleri" : "Ses efektleri"}>
          {FEATURES.reminders && (
            <Row icon="calendar" tone="violet" title="Günlük hatırlatma" desc="Serini kaybetmemen için hatırlatır.">
              <Switch
                label="Günlük hatırlatma"
                checked={settings.notifications}
                onChange={(v) => actions.setSetting("notifications", v)}
              />
            </Row>
          )}
          <Row icon="speaker" tone="sky" title="Ses efektleri" desc="Doğru ve yanlış cevap sesleri.">
            <Switch label="Ses efektleri" checked={settings.sound} onChange={(v) => actions.setSetting("sound", v)} />
          </Row>
        </Group>
    </>
  );
}

export function AppearancePage() {
  const { state, actions } = useApp();
  return (
    <Group title="Tema" hint="Seçtiğin tema bu hesabın bütün cihazlarında geçerli olur.">
      <li className="row row-stacked">
        <ThemePicker value={state.settings.theme} onChange={(id) => actions.setSetting("theme", id)} />
      </li>
    </Group>
  );
}

export function AppPage() {
  const { state, actions } = useApp();
  const { isPro } = state;
  return (
    <>
      <InstallApp />

        {FEATURES.pro && (
          <Group title="Abonelik">
            <Row
              icon="crown"
              tone="amber"
              title={isPro ? "Pro plan" : "Ücretsiz plan"}
              desc={
                isPro
                  ? "Sınırsız kart, sınırsız can, tüm seviyeler."
                  : `Günde ${FREE_DAILY_CARDS} kart, A1-A2 seviyeleri, ${MAX_LIVES} can.`
              }
            >
              {isPro ? (
                <Button size="sm" variant="secondary" onClick={() => actions.setPro(false)}>
                  Ücretsiz plana dön
                </Button>
              ) : (
                <Button size="sm" variant="pro" onClick={() => actions.setPro(true)}>
                  Pro'ya geç
                </Button>
              )}
            </Row>
            {isPro && (
              <Row icon="snow" tone="sky" title="Seri dondurma hakkı" desc="Bir günü kaçırırsan serini korur.">
                <span className="pill pill-plain">{state.freezes}</span>
              </Row>
            )}
          </Group>
        )}

      {isDevMode() && <DevTools />}

      <PrivacyLinks />

      <p className="app-version">
        {APP_NAME} {APP_VERSION}
      </p>
    </>
  );
}
