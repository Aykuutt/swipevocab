// Uygulama durumu, kelime listesi ve sekme gezgini için tek bağlam.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useAccount } from "../hooks/useAccount";
import { useProgressSave } from "../hooks/useProgressSave";
import { signOut as authSignOut } from "../lib/auth";
import { buildDeck, topUpCards } from "../lib/deck";
import { localCache } from "../lib/progress";
import { playSfx } from "../lib/sfx";
import { setPreferredVoice } from "../lib/speech";
import { localDayIndex, msUntilMidnight } from "../lib/time";
import { buildUnits } from "../lib/units";
import { loadWords } from "../lib/words";
import { initialState, reducer } from "./reducer";
import { activeLevels, dailyCardLimit, wordPool } from "./selectors";

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp, AppProvider içinde kullanılmalı.");
  return ctx;
}

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [tab, setTab] = useState("learn");

  /* ---------- Kelime listesi ---------- */
  const [words, setWords] = useState([]);
  const [wordsStatus, setWordsStatus] = useState("loading");
  const reloadWords = useCallback(async () => {
    setWordsStatus("loading");
    try {
      setWords(await loadWords());
      setWordsStatus("ready");
    } catch {
      setWordsStatus("error");
    }
  }, []);
  useEffect(() => {
    reloadWords();
  }, [reloadWords]);

  const wordsById = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);
  const units = useMemo(() => buildUnits(words), [words]);

  // Test araçlarıyla ileri sarılmış saat.
  const getNow = useCallback(() => Date.now() + stateRef.current.clockOffsetMs, []);

  /* ---------- Oturum (Supabase) ---------- */
  const account = useAccount({ dispatch, getNow });
  // Hesaplı ya da misafir: uygulama kullanımda.
  const inApp = account.status === "signedIn" || account.status === "guest";
  const active = wordsStatus === "ready" && inApp && !!state.user;

  /* ---------- Gün geçişi ---------- */
  useEffect(() => {
    if (!active) return;
    const sync = () => {
      const s = stateRef.current;
      if (s.startDayIndex === null) return;
      const day = localDayIndex(getNow()) - s.startDayIndex + 1;
      if (day > s.day) dispatch({ type: "SYNC_DAY", day, deck: buildDeck(s, words, day) });
    };
    sync();
    const timer = setInterval(sync, 30_000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [active, words, state.clockOffsetMs, getNow]);

  /* ---------- Can yenilenmesi ---------- */
  useEffect(() => {
    if (state.regenAt === null) return;
    const tick = () => dispatch({ type: "HEARTS_TICK", now: getNow() });
    const wait = state.regenAt - getNow();
    if (wait <= 0) {
      tick();
      return;
    }
    const timer = setTimeout(tick, Math.min(wait + 50, 2_147_483_000));
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state.regenAt, state.clockOffsetMs, getNow]);

  /* ---------- Deste ---------- */
  const cardLimit = dailyCardLimit(state); // null = sınırsız (Pro)
  const deckKey = `${cardLimit}|${activeLevels(state).join(",")}`;
  const lastDeckKey = useRef(null);

  // Plan, günlük sınır ya da seviye değişince desteyi yeniden kur; silinmiş kelimeleri ayıkla.
  useEffect(() => {
    if (!active) return;
    const s = stateRef.current;
    const keyChanged = lastDeckKey.current !== null && lastDeckKey.current !== deckKey;
    const freshDay = s.deck.length === 0 && s.swipedToday === 0 && s.phase === "swipe";
    lastDeckKey.current = deckKey;
    if (keyChanged || freshDay) dispatch({ type: "SET_DECK", deck: buildDeck(s, words) });
    else if (s.deck.some((c) => !wordsById.has(c.id)))
      dispatch({ type: "SET_DECK", deck: s.deck.filter((c) => wordsById.has(c.id)) });
  }, [active, words, wordsById, deckKey]);

  // Yalnızca sınırsız planda deste bitmeden yeni kart ekle; sınırlı planda deste günün kartlarıdır.
  const unlimited = cardLimit === null;
  useEffect(() => {
    if (!active || !unlimited || state.phase !== "swipe" || state.deck.length > 5) return;
    dispatch({ type: "TOPUP_DECK", cards: topUpCards(stateRef.current, words) });
  }, [active, words, unlimited, state.phase, state.deck.length]);

  /* ---------- Kaydetme (tarayıcı önbelleği + Supabase) ---------- */
  const flushProgress = useProgressSave(state, inApp, dispatch);

  /* ---------- Ses ---------- */
  useEffect(() => {
    setPreferredVoice(state.settings.voiceURI);
  }, [state.settings.voiceURI]);

  const sfx = useCallback((kind) => {
    if (stateRef.current.settings.sound) playSfx(kind);
  }, []);

  // Gün tamamlanınca kutlama sesi (giriş yapınca kayıt yüklenirken çalmasın).
  const lastCompleted = useRef({ userId: null, day: 0 });
  useEffect(() => {
    const userId = state.user?.id ?? null;
    const prev = lastCompleted.current;
    if (prev.userId === userId && state.lastCompletedDay > prev.day) sfx("levelup");
    lastCompleted.current = { userId, day: state.lastCompletedDay };
  }, [state.user?.id, state.lastCompletedDay, sfx]);

  /* ---------- Eylemler ---------- */
  const actions = useMemo(
    () => ({
      /** Bekleyen ilerlemeyi sunucuya yazar, sonra oturumu kapatır. */
      async signOut() {
        const userId = stateRef.current.user?.id;
        const saved = await flushProgress();
        // Ortak bilgisayarda başkası görmesin diye önbelleği sil (sunucuya yazıldıysa).
        if (saved && userId) localCache.remove(userId);
        await authSignOut();
        setTab("learn");
      },
      setOnboarding: (goal, level) => dispatch({ type: "SET_ONBOARDING", goal, level }),
      setName: (name) => dispatch({ type: "SET_NAME", name }),
      swipe: (dir) => dispatch({ type: "SWIPE", dir }),
      continueSwiping: () => dispatch({ type: "CONTINUE_SWIPING" }),
      finishReinforce: () => dispatch({ type: "REINFORCE_DONE" }),
      restartSession: () =>
        dispatch({ type: "RESTART_SESSION", deck: buildDeck(stateRef.current, words, stateRef.current.day, 0) }),
      correct: (xp) => dispatch({ type: "CORRECT", xp }),
      awardXp: (xp) => dispatch({ type: "AWARD_XP", xp }),
      loseLife: () => dispatch({ type: "LOSE_LIFE", now: getNow() }),
      completeUnit: (unitId, wordIds) => dispatch({ type: "COMPLETE_UNIT", unitId, wordIds }),
      buyHearts: () => dispatch({ type: "BUY_HEARTS" }),
      buyBoost: () => dispatch({ type: "BUY_BOOST" }),
      setPro: (value) => dispatch({ type: "SET_PRO", value }),
      setSetting: (key, value) => dispatch({ type: "SET_SETTING", key, value }),
      toggleLevel: (level) => dispatch({ type: "TOGGLE_LEVEL", level }),
      dismissFreezeNotice: () => dispatch({ type: "DISMISS_FREEZE_NOTICE" }),
      // Test araçları
      advanceHours: (hours) => dispatch({ type: "ADVANCE_CLOCK", ms: hours * HOUR_MS, now: getNow() }),
      advanceDays: (days) =>
        dispatch({
          type: "ADVANCE_CLOCK",
          ms: msUntilMidnight(getNow()) + 1000 + (days - 1) * DAY_MS,
          now: getNow(),
        }),
    }),
    [words, getNow, flushProgress]
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      actions,
      words,
      wordsById,
      units,
      wordsStatus,
      reloadWords,
      account,
      pool: wordPool(state, words),
      tab,
      setTab,
      goTo: setTab,
      getNow,
      sfx,
    }),
    [state, actions, words, wordsById, units, wordsStatus, reloadWords, account, tab, getNow, sfx]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
