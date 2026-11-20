// Uygulama genelindeki sabitler ve özellik anahtarları.

export const APP_NAME = "SwipeVocab";
export const APP_VERSION = "0.4.1";

// Özellik anahtarları: kapalı olanlar arayüzde hiç görünmez.
export const FEATURES = {
  pro: false,
  leagueRivals: false,
  googleSignIn: false,
  passwordReset: true,
  reminders: false,
  aiPartner: true,
  liveTalk: false, // canlı sesli konuşma: kod hazır, şimdilik "Yakında" (LiveKit + supabase/talk.sql)
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

export const MAX_LIVES = 3;
export const LIFE_REGEN_MS = 4 * 60 * 60 * 1000; // bir can 4 saatte gelir

// Aralıklı tekrar: kaçıncı aşamada kaç gün sonra tekrar sorulacak.
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
export const WORDS_PER_UNIT = 8;

export const XP = {
  swipe: 2,
  correct: 4,
  unit: 30,
  unitReplay: 10,
  day: 15,
  partnerTurn: 3,
  partnerWord: 6,
  talkMinute: 5, // canlı konuşmada her tam dakika
  talkMinuteCap: 6, // en fazla bu kadar dakika puanlanır
};

export const PRICES = { heartsRefill: 30, xpBoost: 50 };
export const PRO_FREEZES = 2;

export const PARTNER = { maxTurns: 12, words: 5 };

export const STORAGE_PREFIX = "swipevocab";
export const STATE_VERSION = 2;
