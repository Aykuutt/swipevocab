// Uygulamanın kökü: yükleme -> kurulum (giriş yoksa) -> sekmeli ana ekran.
import { AppShell, Header, Splash, TabBar, VoiceNotice } from "./components/layout";
import { AppProvider, useApp } from "./state/AppContext";
import GameScreen from "./screens/game/GameScreen";
import LearnScreen from "./screens/learn/LearnScreen";
import NewPassword from "./screens/onboarding/NewPassword";
import Onboarding from "./screens/onboarding/Onboarding";
import PathScreen from "./screens/path/PathScreen";
import ProgressScreen from "./screens/ProgressScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StoreScreen from "./screens/StoreScreen";

const SCREENS = {
  learn: LearnScreen,
  path: PathScreen,
  game: GameScreen,
  store: StoreScreen,
  progress: ProgressScreen,
  settings: SettingsScreen,
};

function MainLayout() {
  const { tab } = useApp();
  const Screen = SCREENS[tab] || LearnScreen;
  return (
    <>
      <Header />
      <main className="main">
        <Screen />
      </main>
      <TabBar />
    </>
  );
}

function Root() {
  const { state, wordsStatus, reloadWords, account } = useApp();
  if (account.status === "unconfigured") {
    return <Splash error message="Supabase ayarları eksik. .env.example dosyasındaki adımları izle." />;
  }
  if (account.recovery) return <NewPassword onDone={account.finishRecovery} />;
  if (wordsStatus === "loading" || account.status === "loading") return <Splash />;
  if (wordsStatus === "error") return <Splash error onRetry={reloadWords} />;
  if (account.status === "error") {
    return (
      <Splash
        error
        message="Hesabındaki ilerleme yüklenemedi. İnternet bağlantını kontrol edip tekrar dene."
        onRetry={account.retry}
      />
    );
  }
  if (account.status !== "signedIn" || !state.user) return <Onboarding />;
  return (
    <>
      <MainLayout />
      <VoiceNotice />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <Root />
      </AppShell>
    </AppProvider>
  );
}
