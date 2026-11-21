// Uygulamanın kökü: yükleme -> kurulum (giriş yoksa) -> sekmeli ana ekran.
import { AppShell, Header, Splash, TabBar, VoiceNotice } from "./components/layout";
import MascotBuddy from "./components/MascotBuddy";
import { useMascotMoments } from "./hooks/useMascotMoments";
import { AppProvider, useApp } from "./state/AppContext";
import GameScreen from "./screens/game/GameScreen";
import LearnScreen from "./screens/learn/LearnScreen";
import NewPassword from "./screens/onboarding/NewPassword";
import Onboarding from "./screens/onboarding/Onboarding";
import PathScreen from "./screens/path/PathScreen";
import ProfileScreen from "./screens/profile/ProfileScreen";
import VillageScreen from "./screens/village/VillageScreen";

const SCREENS = {
  learn: LearnScreen,
  path: PathScreen,
  game: GameScreen,
  village: VillageScreen,
  profile: ProfileScreen,
};

function MainLayout() {
  const { tab } = useApp();
  useMascotMoments();
  const Screen = SCREENS[tab] || LearnScreen;
  return (
    <>
      <Header />
      <main className="main">
        <Screen />
      </main>
      <TabBar />
      <MascotBuddy />
    </>
  );
}

function Root() {
  const { state, words, wordsStatus, reloadWords, account } = useApp();
  const inApp = (account.status === "signedIn" || account.status === "guest") && !!state.user;
  if (account.status === "unconfigured") {
    return <Splash error message="Supabase ayarları eksik. .env.example dosyasındaki adımları izle." />;
  }
  if (account.recovery) return <NewPassword onDone={account.finishRecovery} />;
  // Kurulumda dil değişirken ekran sıfırlanmasın; seviye testi kendi yüklenmesini bekler.
  if (account.status === "loading" || (wordsStatus === "loading" && (inApp || words.length === 0))) return <Splash />;
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
  if (!inApp) return <Onboarding />;
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
