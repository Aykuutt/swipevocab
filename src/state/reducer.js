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
import { DEFAULT_LANGUAGE, LANGUAGES } from "../data/languages";
import { DEFAULT_THEME, THEMES } from "../data/themes";
import {
  buyBlock,
  buyPrice,
  canPlace,
  canSell,
  expandBlock,
  expandCost,
  expandedLand,
  initialVillage,
  itemById,
  marketPrice,
  migrateVillage,
  pendingHarvests,
  sellValue,
  upgradeBlock,
  upgradeCost,
} from "../data/village";
import { claimReward, needsNewOrder, makeOrder, orderDone } from "../data/orders";
import { availableVillagers, getVillager, isAvailable, talkReward, talkState } from "../data/villagers";
import { leagueRank } from "../lib/league";
import { unique } from "../lib/random";
import { weekOfDay } from "../lib/time";
import { dailyCardLimit, hasFullAccess, hasStreakFreeze, hasUnlimitedLives } from "./selectors";

export const initialState = {
  version: STATE_VERSION,
  user: null, // { id, email, name } (Supabase kullanıcısı)
  savedAt: 0, // son kayıt zamanı; sunucudaki ve yereldeki kopyayı karşılaştırmak için
  goal: null,
  language: DEFAULT_LANGUAGE, // öğrenilen dil
  languages: {}, // dil kodu -> o dilin bekleyen ilerlemesi (bkz. LANGUAGE_FIELDS)
  placementLevel: null,
  isPro: false,
  settings: {
    dailyGoal: DEFAULT_DAILY_GOAL,
    selectedLevels: [...LEVELS],
    notifications: true,
    sound: true,
    voiceURI: null, // eski kayıtlar: İngilizce ses
    voices: {}, // dil kodu -> seçilen okuma sesi
    talkConsent: false, // canlı konuşma kuralları ve 18+ onayı
    theme: DEFAULT_THEME, // görünüm (bkz. src/data/themes.js)
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
  records: {}, // oyun rekorları: "timed:<dil>" -> en yüksek skor
  xpTotal: 0, // ömür boyu kazanılan puan (harcamak bunu düşürmez; başarımlar bunu kullanır)
  counters: { cards: 0, correct: 0, learned: 0, units: 0 }, // ömür boyu sayaçlar (köylü siparişleri bunlarla ölçülür)
  village: initialVillage(), // Kart'ın köyü: bina seviyeleri ve son hasat günleri
};

/** Kayıttan gelen durumu eksik alanları tamamlayarak açar. */
export function hydrate(saved) {
  const { profileId, ...rest } = saved; // eski SQL eşitlemesinden kalan alan
  const settings = { ...initialState.settings, ...rest.settings };
  settings.voices = { ...settings.voices };
  if (!THEMES.some((t) => t.id === settings.theme)) settings.theme = DEFAULT_THEME;
  // Dil seçimi gelmeden önce seçilen ses İngilizce sesiydi.
  if (settings.voiceURI && !settings.voices.en) settings.voices.en = settings.voiceURI;
  let s = {
    ...initialState,
    ...rest,
    settings,
    languages: rest.languages || {},
    xpTotal: Math.max(rest.xpTotal ?? 0, rest.xp ?? 0),
    counters: { ...initialState.counters, ...rest.counters },
    village: migrateVillage(rest.village),
  };
  if (!LANGUAGES[s.language]) s = { ...s, language: DEFAULT_LANGUAGE };
  return FEATURES.pro ? s : { ...s, isPro: false, freezes: 0 };
}

/**
 * Her dilde ayrı tutulan alanlar. XP, seri, lig, canlar ve ayarlar bütün dillerde ortaktır;
 * hangi dil çalışılırsa çalışılsın seri sürer.
 */
export const LANGUAGE_FIELDS = [
  "placementLevel",
  "knownIds",
  "learningIds",
  "schedule",
  "completedUnits",
  "deck",
  "swipedToday",
  "phase",
];

const languageSnapshot = (s) => ({
  ...Object.fromEntries(LANGUAGE_FIELDS.map((f) => [f, s[f]])),
  day: s.day,
});

/** Bir dilin kaydedilmiş ilerlemesini açar; başka bir günden kaldıysa günün destesi yenilenir. */
function restoreLanguage(saved, day) {
  const fields = Object.fromEntries(LANGUAGE_FIELDS.map((f) => [f, saved[f] ?? initialState[f]]));
  if (saved.day === day) return fields;
  return { ...fields, deck: [], swipedToday: 0, phase: "swipe" };
}

/** İlk kez seçilen dil: baştan başlar, seviye kartlarda bildiklerine göre kendiliğinden yükselir. */
const freshLanguage = (level) => ({
  ...Object.fromEntries(LANGUAGE_FIELDS.map((f) => [f, initialState[f]])),
  placementLevel: level ?? "A1",
});

/** Öğrenilen dili değiştirir: şimdiki dilin ilerlemesini saklar, yenisininkini açar. */
function switchLanguage(s, language, level) {
  if (!LANGUAGES[language] || language === s.language) return s;
  const languages = { ...s.languages, [s.language]: languageSnapshot(s) };
  const saved = languages[language];
  delete languages[language];
  const fields = saved ? restoreLanguage(saved, s.day) : freshLanguage(level);
  return { ...s, ...fields, language, languages };
}

/** Çıkış yapınca ya da yeni hesap açılınca seçilen tema korunur. */
const keepTheme = (next, prev) => ({ ...next, settings: { ...next.settings, theme: prev.settings.theme } });

const scheduleAt = (day, stage) => ({ stage, due: day + REVIEW_INTERVALS[stage] });

function addXp(s, amount) {
  const gained = s.xpBoost ? amount * 2 : amount;
  return {
    ...s,
    xp: s.xp + gained,
    xpTotal: (s.xpTotal ?? 0) + gained,
    weeklyXp: s.weeklyXp + gained,
    dailyXp: s.dailyXp + gained,
  };
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

/**
 * Kaydırma sonrası günün kartları bitti mi?
 * Sınırlı planda (herkes, Pro hariç) günlük sınıra ya da deste sonuna gelince kaydırma durur:
 * işaretlenen kelime varsa pekiştirme, yoksa günün özeti. Pro'da hedefe ulaşınca kutlanır,
 * istenirse kaydırmaya devam edilir.
 */
function checkSwipePhase(s) {
  if (s.phase !== "swipe" || s.swipedToday === 0) return s;
  const finish = (phase) => (s.learningIds.length > 0 ? { ...s, phase: "reinforce" } : completeDay({ ...s, phase }));
  const limit = dailyCardLimit(s);
  if (limit === null) {
    return s.swipedToday >= s.settings.dailyGoal && s.lastCompletedDay !== s.day ? finish("done") : s;
  }
  return s.swipedToday >= limit || s.deck.length === 0 ? finish("limit") : s;
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

function baseReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      // Kayıt, sınır uygulanmadan önce oluşmuş olabilir: yüklerken de denetle.
      return checkSwipePhase(hydrate(action.state));

    case "SET_ONBOARDING":
      return {
        ...state,
        goal: action.goal ?? state.goal,
        placementLevel: action.level ?? state.placementLevel,
        language: LANGUAGES[action.language] ? action.language : state.language,
      };

    case "START_ACCOUNT":
      return {
        ...initialState,
        goal: action.goal ?? state.goal ?? DEFAULT_GOAL,
        language: LANGUAGES[action.language] ? action.language : state.language,
        placementLevel: action.level ?? state.placementLevel,
        user: action.user,
        startDayIndex: action.dayIndex,
        settings: { ...initialState.settings, theme: state.settings.theme },
      };

    case "SIGN_OUT":
      return keepTheme({ ...initialState }, state);

    case "SET_LANGUAGE":
      return switchLanguage(state, action.language, action.level);

    case "SET_NAME":
      return state.user ? { ...state, user: { ...state.user, name: action.name } } : state;

    case "SET_SETTING": {
      const next = { ...state, settings: { ...state.settings, [action.key]: action.value } };
      // Gün bittikten sonra hedef yükseltildiyse kalan kartlar için kaydırmaya dön.
      const limit = dailyCardLimit(next);
      if (action.key === "dailyGoal" && next.phase === "limit" && limit !== null && next.swipedToday < limit) {
        return { ...next, phase: "swipe" };
      }
      return next;
    }

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
      // Yalnızca sınırsız planda (Pro) günün hedefinden sonra devam edilebilir.
      return state.phase === "done" && dailyCardLimit(state) === null ? { ...state, phase: "swipe" } : state;

    case "RESTART_SESSION":
      return { ...state, deck: action.deck, swipedToday: 0, phase: "swipe" };

    case "CORRECT":
      return { ...addXp(state, action.xp ?? XP.correct), dailyCorrect: state.dailyCorrect + 1 };

    case "SET_RECORD":
      return action.value > (state.records?.[action.key] ?? 0)
        ? { ...state, records: { ...state.records, [action.key]: action.value } }
        : state;

    case "AWARD_XP":
      return addXp(state, action.xp);

    case "LOSE_LIFE":
      if (hasUnlimitedLives(state) || state.lives <= 0) return state;
      return { ...state, lives: state.lives - 1, regenAt: state.regenAt ?? action.now + LIFE_REGEN_MS };

    case "HEARTS_TICK":
      return regenLives(state, action.now);

    case "BUY_HEARTS": {
      const price = marketPrice(PRICES.heartsRefill, state.village); // Pazar büyüdükçe ucuzlar
      if (state.xp < price || state.lives >= MAX_LIVES) return state;
      return { ...state, xp: state.xp - price, lives: MAX_LIVES, regenAt: null };
    }

    case "BUY_BOOST": {
      const price = marketPrice(PRICES.xpBoost, state.village);
      if (state.xp < price || state.xpBoost) return state;
      return { ...state, xp: state.xp - price, xpBoost: true };
    }

    case "VILLAGE_PLACE": {
      // Dükkândan alınan nesneyi haritaya koyar; puan burada harcanır.
      const { itemType: type, x, y } = action;
      if (buyBlock(state, type) || !canPlace(state.village, type, x, y)) return state;
      const price = buyPrice(type, state.village);
      const id = `i${state.village.nextId}`;
      return {
        ...state,
        xp: state.xp - price,
        village: {
          ...state.village,
          nextId: state.village.nextId + 1,
          items: [...state.village.items, { id, type, x, y, level: 1 }],
        },
      };
    }

    case "VILLAGE_MOVE": {
      const item = itemById(state.village, action.id);
      if (!item || !canPlace(state.village, item.type, action.x, action.y, item.id)) return state;
      if (item.x === action.x && item.y === action.y) return state;
      return {
        ...state,
        village: {
          ...state.village,
          items: state.village.items.map((i) => (i.id === item.id ? { ...i, x: action.x, y: action.y } : i)),
        },
      };
    }

    case "VILLAGE_SELL": {
      // Ev ve pazar satılamaz. Geri gelen puan kazanç sayılmaz (xpTotal artmaz).
      const item = itemById(state.village, action.id);
      if (!item || !canSell(item)) return state;
      const collected = { ...state.village.collected };
      delete collected[item.id];
      return {
        ...state,
        xp: state.xp + sellValue(item),
        village: { ...state.village, collected, items: state.village.items.filter((i) => i.id !== item.id) },
      };
    }

    case "VILLAGE_EXPAND": {
      // Araziyi bir kenardan genişletir; puan harcanır (xpTotal düşmez).
      if (expandBlock(state, action.side)) return state;
      const n = state.village.expansions ?? 0;
      return {
        ...state,
        xp: state.xp - expandCost(n),
        village: { ...state.village, land: expandedLand(state.village.land, action.side), expansions: n + 1 },
      };
    }

    case "VILLAGE_UPGRADE": {
      // Bina yükseltmek puan harcar. Ömür boyu puan (xpTotal) düşmez.
      if (upgradeBlock(state, action.id)) return state;
      const item = itemById(state.village, action.id);
      return {
        ...state,
        xp: state.xp - upgradeCost(item),
        village: {
          ...state.village,
          items: state.village.items.map((i) => (i.id === item.id ? { ...i, level: i.level + 1 } : i)),
        },
      };
    }

    case "VILLAGE_HARVEST": {
      // id yoksa bugün bekleyen hepsi. 2 kat puan güçlendiricisi hasatı katlamaz.
      const ready = pendingHarvests(state).filter((h) => !action.id || h.id === action.id);
      if (ready.length === 0) return state;
      const gained = ready.reduce((n, h) => n + h.amount, 0);
      const collected = { ...state.village.collected };
      ready.forEach((h) => (collected[h.id] = state.day));
      return {
        ...state,
        xp: state.xp + gained,
        xpTotal: (state.xpTotal ?? 0) + gained,
        weeklyXp: state.weeklyXp + gained,
        dailyXp: state.dailyXp + gained,
        village: { ...state.village, collected },
      };
    }

    case "ORDERS_SYNC": {
      // Her köylü için günün siparişini oluşturur (gün değişince ya da yeni köylü gelince).
      const orders = { ...state.village.orders };
      let changed = false;
      for (const v of availableVillagers(state.village)) {
        if (needsNewOrder(state, orders[v.id])) {
          orders[v.id] = makeOrder(state, v);
          changed = true;
        }
      }
      return changed ? { ...state, village: { ...state.village, orders } } : state;
    }

    case "ORDER_CLAIM": {
      // Bitmiş siparişi teslim eder: puan, arkadaşlık sayacı ve gerekirse yeni kalp bonusu. Boost katlamaz.
      const order = state.village.orders?.[action.id];
      const villager = getVillager(action.id);
      if (!order || !villager || order.claimed || !orderDone(state, order)) return state;
      const gained = claimReward(state, villager.id, order);
      const cur = talkState(state.village, villager.id);
      return {
        ...state,
        xp: state.xp + gained,
        xpTotal: (state.xpTotal ?? 0) + gained,
        weeklyXp: state.weeklyXp + gained,
        dailyXp: state.dailyXp + gained,
        village: {
          ...state.village,
          orders: { ...state.village.orders, [villager.id]: { ...order, claimed: true } },
          villagers: { ...state.village.villagers, [villager.id]: { ...cur, talks: cur.talks + 1 } },
        },
      };
    }

    case "VILLAGER_TALK": {
      // Günde bir köylü başına bir sohbet ödülü; yeni kalp kazanılırsa bonus. Boost katlamaz.
      const villager = getVillager(action.id);
      if (!villager || !isAvailable(state.village, villager)) return state;
      const cur = talkState(state.village, villager.id);
      if (cur.last === state.day) return state;
      const gained = talkReward(cur.talks);
      return {
        ...state,
        xp: state.xp + gained,
        xpTotal: (state.xpTotal ?? 0) + gained,
        weeklyXp: state.weeklyXp + gained,
        dailyXp: state.dailyXp + gained,
        village: {
          ...state.village,
          villagers: { ...state.village.villagers, [villager.id]: { talks: cur.talks + 1, last: state.day } },
        },
      };
    }

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

// Ömür boyu sayaçlar: köylü siparişlerinin ilerlemesi buradan ölçülür.
const COUNTED = new Set(["SWIPE", "REINFORCE_DONE", "COMPLETE_UNIT", "CORRECT"]);

function trackCounters(prev, next, action) {
  if (prev === next || !COUNTED.has(action.type)) return next;
  const c = { ...initialState.counters, ...next.counters };
  if (action.type === "SWIPE") c.cards += 1;
  if (action.type === "CORRECT") c.correct += 1;
  if (action.type === "COMPLETE_UNIT") c.units += 1;
  if (action.type !== "CORRECT") c.learned += Math.max(0, next.knownIds.length - prev.knownIds.length);
  return { ...next, counters: c };
}

export function reducer(state, action) {
  return trackCounters(state, baseReducer(state, action), action);
}
