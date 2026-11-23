// Uygulama genelindeki sabitler ve özellik anahtarları.

export const APP_NAME = "Kelimanya";
// Herkesin puanını bir kez sıfırlamak için bu kimliği değiştir (kayıtlı hesaplar bir sonraki açılışta 0'dan başlar).
export const POINTS_RESET_ID = "2026-11-22";

export const APP_VERSION = "0.25.0";

// Özellik anahtarları: kapalı olanlar arayüzde hiç görünmez.
export const FEATURES = {
  pro: false,
  leagueRivals: false,
  googleSignIn: false,
  passwordReset: true,
  reminders: false,
  aiPartner: true,
  friends: true, // arkadaş ekleme ve köy ziyareti (supabase/friends.sql)
  liveTalk: false, // canlı sesli konuşma: kod hazır, şimdilik "Yakında" (LiveKit + supabase/talk.sql)
};

// Google AdSense: .env'de VITE_ADSENSE_CLIENT ve birim kimliği yoksa reklam gösterilmez (bkz. vite.config.js).
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "";
export const ADS = {
  client: /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) ? ADSENSE_CLIENT : "",
  slots: {
    lessonEnd: import.meta.env.VITE_ADSENSE_SLOT_LESSON_END || "", // ünite bitiş ekranı
  },
};

// Adresin sonunda ?dev ya da #dev varsa test araçları açılır.
export const isDevMode = () =>
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).has("dev") || window.location.hash === "#dev");

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
export const FREE_LEVELS = ["A1", "A2"];

export const FREE_DAILY_CARDS = 12; // ücretsiz planda günlük kart
export const PRO_DECK_SIZE = 40; // Pro destesinde bir seferde yeni kart
export const MAX_REVIEWS = 15; // destedeki en fazla tekrar kartı
export const DAILY_GOAL_OPTIONS = [5, 10, 20];
export const DEFAULT_DAILY_GOAL = 10;

export const MAX_LIVES = 5;
// 5 canın tamamı 3 saatte dolar: bir can 36 dakikada gelir.
export const LIFE_REGEN_MS = 36 * 60 * 1000;

// Aralıklı tekrar: kaçıncı aşamada kaç gün sonra tekrar sorulacak.
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
export const WORDS_PER_UNIT = 8;

export const XP = {
  swipe: 1,
  correct: 2,
  unit: 15,
  unitReplay: 5,
  day: 8,
  partnerTurn: 1,
  partnerWord: 3,
  talkMinute: 3, // canlı konuşmada her tam dakika
  talkMinuteCap: 6, // en fazla bu kadar dakika puanlanır
};

export const PRICES = { xpBoost: 50 }; // canlar puanla alınmaz
export const PRO_FREEZES = 2;

export const PARTNER = { maxTurns: 12, words: 5 };

export const STORAGE_PREFIX = "swipevocab";
export const STATE_VERSION = 2;
