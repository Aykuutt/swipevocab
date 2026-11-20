// "Ayarlar" sekmesi: hesap, öğrenme, okuma sesi, ses efektleri, abonelik, test araçları.
import AccountPrompt from "../components/AccountPrompt";
import HeartTimer from "../components/HeartTimer";
import { Button, Chips, Field, Group, Row, Switch } from "../components/ui";
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
} from "../config";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useVoiceInfo } from "../hooks/useVoiceInfo";
import { speak } from "../lib/speech";
import { useApp } from "../state/AppContext";
import { activeLevels, hasFullAccess, hasUnlimitedLives } from "../state/selectors";

const VOICE_HINT =
  "Cihazında İngilizce ses varsa kelimeleri ve yapay zekanın cümlelerini o okur, yoksa kelimeler hazır kayıtla okunur. " +
  "Cihaza İngilizce ses eklemek için: Windows'ta Ayarlar, Zaman ve dil, Konuşma, Ses ekle yolundan İngilizce bir ses " +
  "kurabilirsin. Edge tarayıcısında genelde daha doğal sesler hazır gelir.";

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
  const voice = useVoiceInfo();
  const ready = voice.status === "ready";
  const loading = voice.status === "unknown";

  const title = ready ? "İngilizce ses bulundu" : loading ? "Sesler yükleniyor…" : "Cihazda İngilizce ses yok";
  const desc = ready
    ? `Kullanılan: ${voice.name} (${voice.lang}). Cihazda ${voice.english} İngilizce ses var.`
    : loading
      ? "Birkaç saniye bekle."
      : `Cihazında ${voice.total} ses var ama hiçbiri İngilizce değil. Kelimeler ve örnek cümleler hazır ses kaydıyla okunur (makine sesi, doğal değil). Yapay zekanın cümlelerini okumak için cihaz sesi gerekir.`;

  return (
    <Group id="voice-settings" title="Okuma sesi" hint={VOICE_HINT}>
      <Row icon="speaker" tone={ready ? "mint" : "coral"} title={title} desc={desc}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => speak(ready ? "Hello! This is how I will read English words." : "negotiate")}
        >
          Dene
        </Button>
      </Row>
      {voice.voices.length > 1 && (
        <Row icon="sliders" tone="violet" title="Ses seç" desc="Beğenmediysen başka bir İngilizce ses seç." stacked>
          <select
            className="select"
            aria-label="Okuma sesi"
            value={state.settings.voiceURI || ""}
            onChange={(e) => actions.setSetting("voiceURI", e.target.value || null)}
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

export default function SettingsScreen() {
  const { state, actions } = useApp();
  const { user, isPro, settings } = state;
  const levels = activeLevels(state);
  const full = hasFullAccess(state);

  return (
    <div className="screen">
      <h1 className="screen-title">Ayarlar</h1>

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

      <InstallApp />

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

      <p className="app-version">
        {APP_NAME} {APP_VERSION}
      </p>
    </div>
  );
}
