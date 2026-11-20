// Uygulamanın tüm durumu ve onu değiştiren eylemler.
import {
  DEFAULT_DAILY_GOAL,
  FEATURES,
  LEVELS,
  LIFE_REGEN_MS,
  MAX_LIVES,
  PRICES,
  PRO_FREEZES,
  REVIEW_INTERVALS,
  STATE_VERSION,
  XP,
} from "../config";
import { DEFAULT_GOAL } from "../data/goals";
import { leagueRank } from "../lib/league";
import { unique } from "../lib/random";
import { weekOfDay } from "../lib/time";
import { hasFullAccess, hasStreakFreeze, hasUnlimitedLives } from "./selectors";

export const initialState = {
  version: STATE_VERSION,
  user: null, // { id, email, name } (Supabase kullanıcısı)
  savedAt: 0, // son kayıt zamanı; sunucudaki ve yereldeki kopyayı karşılaştırmak için
  goal: null,
  placementLevel: null,
  isPro: false,
  settings: {
    dailyGoal: DEFAULT_DAILY_GOAL,
    selectedLevels: [...LEVELS],
    notifications: true,
    sound: true,
    voiceURI: null,
  },
  startDayIndex: null, // hesabın açıldığı günün takvim indeksi
  day: 1, // uygulamadaki gün numarası
  clockOffsetMs: 0, // test araçlarıyla ileri sarılan süre
  xp: 0,
  weeklyXp: 0,
  dailyXp: 0,
  dailyCorrect: 0,
  xpBoost: false,
  streak: 0,
  freezes: 0,
  lastCompletedDay: 0,
  completedDays: [],
  freezeNotice: false,
  lives: MAX_LIVES,
  regenAt: null, // bir sonraki canın geleceği an
  knownIds: [],
  learningIds: [],
  schedule: {}, // kelime id -> { stage, due }
  completedUnits: [],
  deck: [],
  swipedToday: 0,
  phase: "swipe", // swipe | reinforce | done | limit
  weekWords: 0,
  weekDaysActive: 0,
  lastWeek: null,
  top3Finishes: 0,
};

/** Kayıttan gelen durumu eksik alanları tamamlayarak açar. */
export function hydrate(saved) {
  // eslint-disable-next-line no-unused-vars
  const { profileId, ...rest } = saved; // eski SQL eşitlemesinden kalan alan
  const s = { ...initialState, ...rest, settings: { ...initialState.settings, ...rest.settings } };
  return FEATURES.pro ? s : { ...s, isPro: false, freezes: 0 };
}

const scheduleAt = (day, stage) => ({ stage, due: day + REVIEW_INTERVALS[stage] });

function addXp(s, amount) {
  const gained = s.xpBoost ? amount * 2 : amount;
  return { ...s, xp: s.xp + gained, weeklyXp: s.weeklyXp + gained, dailyXp: s.dailyXp + gained };
}

/** Günü tamamlandı say: seriyi güncelle, günlük puanı ver. */
function completeDay(s) {
  if (s.lastCompletedDay === s.day) return s;
  let { streak, freezes, freezeNotice } = s;
  const missed = s.day - s.lastCompletedDay - 1;

  if (s.lastCompletedDay === 0) streak = 1;
  else if (missed <= 0) streak += 1;
  else if (hasStreakFreeze(s) && freezes >= missed) {
    freezes -= missed;
    streak += 1;
    freezeNotice = true;
  } else streak = 1;

  return addXp(
    {
      ...s,
      streak,
      freezes,
      freezeNotice,
      lastCompletedDay: s.day,
      completedDays: [...s.completedDays.filter((d) => d !== s.day), s.day].slice(-90),
      weekDaysActive: Math.min(7, s.weekDaysActive + 1),
    },
    XP.day
  );
}

/** Kaydırma sonrası günlük hedefe ya da deste sonuna gelindi mi? */
function checkSwipePhase(s) {
  if (s.phase !== "swipe" || s.swipedToday === 0) return s;
  const hasLearning = s.learningIds.length > 0;
  if (hasFullAccess(s)) {
    if (s.swipedToday >= s.settings.dailyGoal && s.lastCompletedDay !== s.day) {
      return hasLearning ? { ...s, phase: "reinforce" } : completeDay({ ...s, phase: "done" });
    }
  } else if (s.deck.length === 0) {
    return hasLearning ? { ...s, phase: "reinforce" } : completeDay({ ...s, phase: "limit" });
  }
  return s;
}

/** Geçen süreye göre canları yeniler. */
function regenLives(s, now) {
  if (s.lives >= MAX_LIVES) return s.regenAt === null ? s : { ...s, regenAt: null };
  let { lives, regenAt } = s;
  if (regenAt === null) regenAt = now + LIFE_REGEN_MS;
  while (lives < MAX_LIVES && now >= regenAt) {
    lives += 1;
    regenAt = lives < MAX_LIVES ? regenAt + LIFE_REGEN_MS : null;
  }
  return lives === s.lives && regenAt === s.regenAt ? s : { ...s, lives, regenAt };
}

export function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return hydrate(action.state);

    case "SET_ONBOARDING":
      return { ...state, goal: action.goal ?? state.goal, placementLevel: action.level ?? state.placementLevel };

    case "START_ACCOUNT":
      return {
        ...initialState,
        goal: action.goal ?? state.goal ?? DEFAULT_GOAL,
        placementLevel: action.level ?? state.placementLevel,
        user: action.user,
        startDayIndex: action.dayIndex,
      };

    case "SIGN_OUT":
      return { ...initialState };

    case "SET_NAME":
      return state.user ? { ...state, user: { ...state.user, name: action.name } } : state;

    case "SET_SETTING":
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };

    case "TOGGLE_LEVEL": {
      if (!hasFullAccess(state)) return state;
      const current = state.settings.selectedLevels;
      const next = current.includes(action.level)
        ? current.filter((l) => l !== action.level)
        : [...current, action.level];
      if (next.length === 0) return state; // en az bir seviye kalmalı
      return { ...state, settings: { ...state.settings, selectedLevels: LEVELS.filter((l) => next.includes(l)) } };
    }

    case "SET_PRO":
      return {
        ...state,
        isPro: action.value,
        freezes: action.value ? PRO_FREEZES : 0,
        phase: action.value && state.phase === "limit" ? "swipe" : state.phase,
      };

    case "SET_DECK":
      return checkSwipePhase({ ...state, deck: action.deck });

    case "TOPUP_DECK":
      return { ...state, deck: [...state.deck, ...action.cards] };

    case "SWIPE": {
      const card = state.deck[0];
      if (!card) return state;
      const id = card.id;
      const wasKnown = state.knownIds.includes(id);
      let s = addXp({ ...state, deck: state.deck.slice(1), swipedToday: state.swipedToday + 1 }, XP.swipe);

      if (action.dir === "keep") {
        if (wasKnown) {
          // Bilinen kelime tekrar doğru: bir sonraki tekrar aşamasına geç.
          const stage = Math.min((s.schedule[id]?.stage ?? -1) + 1, REVIEW_INTERVALS.length - 1);
          s = { ...s, schedule: { ...s.schedule, [id]: scheduleAt(s.day, stage) } };
        } else {
          s = {
            ...s,
            knownIds: [...s.knownIds, id],
            learningIds: s.learningIds.filter((x) => x !== id),
            schedule: { ...s.schedule, [id]: scheduleAt(s.day, 0) },
            weekWords: s.weekWords + 1,
          };
        }
      } else {
        // Bilmiyorum / emin değilim: öğrenilecekler listesine al.
        const schedule = { ...s.schedule };
        delete schedule[id];
        s = {
          ...s,
          knownIds: s.knownIds.filter((x) => x !== id),
          schedule,
          learningIds: s.learningIds.includes(id) ? s.learningIds : [...s.learningIds, id],
        };
      }
      return checkSwipePhase(s);
    }

    case "REINFORCE_DONE": {
      const learned = state.learningIds.filter((id) => !state.knownIds.includes(id));
      const schedule = { ...state.schedule };
      learned.forEach((id) => (schedule[id] = scheduleAt(state.day, 0)));
      return completeDay({
        ...state,
        knownIds: [...state.knownIds, ...learned],
        learningIds: [],
        schedule,
        weekWords: state.weekWords + learned.length,
        phase: "done",
      });
    }

    case "CONTINUE_SWIPING":
      return state.phase === "done" ? { ...state, phase: "swipe" } : state;

    case "RESTART_SESSION":
      return { ...state, deck: action.deck, swipedToday: 0, phase: "swipe" };

    case "CORRECT":
      return { ...addXp(state, action.xp ?? XP.correct), dailyCorrect: state.dailyCorrect + 1 };

    case "AWARD_XP":
      return addXp(state, action.xp);

    case "LOSE_LIFE":
      if (hasUnlimitedLives(state) || state.lives <= 0) return state;
      return { ...state, lives: state.lives - 1, regenAt: state.regenAt ?? action.now + LIFE_REGEN_MS };

    case "HEARTS_TICK":
      return regenLives(state, action.now);

    case "BUY_HEARTS":
      if (state.xp < PRICES.heartsRefill || state.lives >= MAX_LIVES) return state;
      return { ...state, xp: state.xp - PRICES.heartsRefill, lives: MAX_LIVES, regenAt: null };

    case "BUY_BOOST":
      if (state.xp < PRICES.xpBoost || state.xpBoost) return state;
      return { ...state, xp: state.xp - PRICES.xpBoost, xpBoost: true };

    case "COMPLETE_UNIT": {
      const { unitId, wordIds } = action;
      const firstTime = !state.completedUnits.includes(unitId);
      const newlyKnown = wordIds.filter((id) => !state.knownIds.includes(id));
      const schedule = { ...state.schedule };
      newlyKnown.forEach((id) => (schedule[id] = scheduleAt(state.day, 0)));
      return addXp(
        {
          ...state,
          completedUnits: unique([...state.completedUnits, unitId]),
          knownIds: [...state.knownIds, ...newlyKnown],
          learningIds: state.learningIds.filter((id) => !wordIds.includes(id)),
          deck: state.deck.filter((c) => c.isReview || !newlyKnown.includes(c.id)),
          schedule,
          weekWords: state.weekWords + newlyKnown.length,
        },
        firstTime ? XP.unit : XP.unitReplay
      );
    }

    case "ADVANCE_CLOCK":
      return regenLives({ ...state, clockOffsetMs: state.clockOffsetMs + action.ms }, action.now + action.ms);

    case "SYNC_DAY": {
      if (action.day <= state.day) return state;
      let s = {
        ...state,
        day: action.day,
        deck: action.deck,
        swipedToday: 0,
        phase: "swipe",
        dailyXp: 0,
        dailyCorrect: 0,
        xpBoost: false,
      };
      const oldWeek = weekOfDay(state.day);
      if (weekOfDay(action.day) !== oldWeek) {
        // Hafta bitti: özeti sakla, haftalık sayaçları sıfırla.
        const rank = leagueRank(oldWeek, state.weeklyXp, state.user?.name);
        s = {
          ...s,
          top3Finishes: s.top3Finishes + (rank >= 0 && rank < 3 ? 1 : 0),
          lastWeek: { week: oldWeek, xp: state.weeklyXp, words: state.weekWords, days: state.weekDaysActive },
          weeklyXp: 0,
          weekWords: 0,
          weekDaysActive: 0,
        };
      }
      return s;
    }

    case "DISMISS_FREEZE_NOTICE":
      return { ...state, freezeNotice: false };

    default:
      return state;
  }
}
